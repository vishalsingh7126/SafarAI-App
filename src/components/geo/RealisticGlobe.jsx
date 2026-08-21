import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cn } from '../../lib/cn';
import { detectQuality, easeInOutCubic, latLngToVector3, subsolarPoint } from './geo';
import createCloudTexture from './cloudTexture';

/**
 * RealisticGlobe — a photoreal, interactive Earth.
 * ---------------------------------------------------------------------------
 * • NASA Blue Marble colour, city-lights night map, topography as a bump map
 *   and a land/water mask driving ocean specular.
 * • A custom shader mixes day and night across a real terminator computed from
 *   the current sub-solar point, so the lit face matches actual world time.
 * • Rayleigh-ish atmosphere shell, procedural cloud layer, star field.
 * • Orbit / zoom / drag with damping, destination markers with hover labels,
 *   and an animated `flyTo` used for globe → destination transitions.
 * • Quality tiers: textures, geometry density, DPR and clouds all scale down
 *   on small or low-power devices; everything pauses when off-screen.
 */

const TEXTURES = {
  dayLow: '/textures/earth-day-lo.jpg',
  dayHigh: '/textures/earth-day-hi.jpg',
  night: '/textures/earth-night.jpg',
  topology: '/textures/earth-topology.png',
  water: '/textures/earth-water.png',
};

/** Sphere radius (1.0) plus margin for the atmosphere shell and markers. */
const FIT_RADIUS = 1.32;

const QUALITY_PRESETS = {
  low: { segments: 48, dpr: 1, antialias: false, clouds: false, night: false, bump: false, stars: 550, hiRes: false },
  medium: { segments: 72, dpr: 1.5, antialias: false, clouds: false, night: true, bump: true, stars: 900, hiRes: true },
  high: { segments: 128, dpr: 2, antialias: true, clouds: true, night: true, bump: true, stars: 1600, hiRes: true },
};

/* ------------------------------------------------------------------ shaders */

const globeVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);   // world-space normal
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const globeFragmentShader = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uBumpMap;
  uniform sampler2D uWaterMap;
  uniform vec3 uSunDirection;
  uniform float uHasNight;
  uniform float uHasBump;
  uniform float uHasWater;
  uniform float uBumpScale;
  uniform float uAmbient;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);

    // --- terrain relief from the topography map (finite differences) -------
    if (uHasBump > 0.5) {
      vec2 texel = vec2(1.0 / 2048.0, 1.0 / 1024.0);
      float hL = texture2D(uBumpMap, vUv - vec2(texel.x, 0.0)).r;
      float hR = texture2D(uBumpMap, vUv + vec2(texel.x, 0.0)).r;
      float hD = texture2D(uBumpMap, vUv - vec2(0.0, texel.y)).r;
      float hU = texture2D(uBumpMap, vUv + vec2(0.0, texel.y)).r;
      vec3 tangent = normalize(vec3(1.0, 0.0, (hR - hL) * uBumpScale));
      vec3 bitangent = normalize(vec3(0.0, 1.0, (hU - hD) * uBumpScale));
      vec3 perturbed = normalize(cross(tangent, bitangent));
      normal = normalize(normal + perturbed * 0.55 * uBumpScale);
    }

    vec3 sunDir = normalize(uSunDirection);
    float lambert = dot(normal, sunDir);

    // Soft terminator: a few degrees of twilight rather than a hard edge.
    float dayAmount = smoothstep(-0.18, 0.22, lambert);

    vec3 dayColor = texture2D(uDayMap, vUv).rgb;
    vec3 litDay = dayColor * (uAmbient + 1.05 * max(lambert, 0.0));

    // --- city lights on the dark side --------------------------------------
    vec3 nightColor = vec3(0.0);
    if (uHasNight > 0.5) {
      nightColor = texture2D(uNightMap, vUv).rgb;
      nightColor = pow(nightColor, vec3(1.25)) * 1.5;
      nightColor += dayColor * 0.045;   // faint earthshine so oceans are not black
    } else {
      nightColor = dayColor * 0.07;
    }

    vec3 color = mix(nightColor, litDay, dayAmount);

    // --- specular glint on water -------------------------------------------
    if (uHasWater > 0.5) {
      float water = texture2D(uWaterMap, vUv).r;
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfway = normalize(sunDir + viewDir);
      float spec = pow(max(dot(normal, halfway), 0.0), 42.0);
      color += vec3(0.65, 0.78, 1.0) * spec * water * 0.55 * dayAmount;
    }

    // --- warm scattering right on the terminator ----------------------------
    float twilight = exp(-pow(lambert * 7.0, 2.0));
    color += vec3(0.38, 0.17, 0.05) * twilight * 0.20;

    // --- limb darkening -----------------------------------------------------
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(normal, viewDirection), 0.0);
    color *= 1.0 - rim * 0.22;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);    // world-space normal
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 4.4);
    float sun = max(dot(normalize(vNormal), normalize(uSunDirection)), 0.0);
    float glow = rim * (0.35 + sun * 1.15) * uIntensity;
    gl_FragColor = vec4(uColor, glow);
  }
`;

const markerVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aState;      // 0 idle · 1 hovered · 2 selected
  varying vec3 vColor;
  varying float vFacing;
  varying float vState;

  void main() {
    vColor = aColor;
    vState = aState;
    vec3 dir = normalize(position);
    vFacing = dot(dir, normalize(cameraPosition));
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float distanceScale = 260.0 / -mvPosition.z;
    gl_PointSize = clamp(aSize * distanceScale * (1.0 + vState * 0.45), 2.0, 64.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const markerFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vFacing;
  varying float vState;

  void main() {
    if (vFacing < 0.02) discard;                 // hide markers behind the globe
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core = smoothstep(0.34, 0.20, dist);
    float halo = smoothstep(0.5, 0.2, dist) * 0.55;
    float edgeFade = smoothstep(0.02, 0.22, vFacing);

    vec3 color = mix(vColor, vec3(1.0), core * 0.75);
    float alpha = (core + halo) * edgeFade;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* -------------------------------------------------------------- component */

const RealisticGlobe = forwardRef(function RealisticGlobe(
  {
    destinations = [],
    selectedSlug = null,
    onSelect,
    onHover,
    quality: qualityProp = 'auto',
    autoRotate = true,
    showClouds = true,
    showLabels = true,
    className,
    onReady,
  },
  ref
) {
  const mountRef = useRef(null);
  const labelLayerRef = useRef(null);
  const engine = useRef({});
  const propsRef = useRef({ destinations, selectedSlug, onSelect, onHover, autoRotate, showClouds, showLabels });
  const [status, setStatus] = useState('loading');
  const [hovered, setHovered] = useState(null);

  propsRef.current = { destinations, selectedSlug, onSelect, onHover, autoRotate, showClouds, showLabels };

  const quality = qualityProp === 'auto' ? detectQuality() : qualityProp;
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;

  /* ------------------------------------------------------------ imperative */
  const flyTo = useCallback((lat, lng, options = {}) => {
    const { camera, controls } = engine.current;
    if (!camera || !controls) return;

    const { altitude = 1.9, duration = 1500 } = options;
    const target = latLngToVector3(lat, lng, 1);
    const targetVec = new THREE.Vector3(target.x, target.y, target.z).normalize().multiplyScalar(altitude);

    const startVec = camera.position.clone();
    const startTime = performance.now();
    const startQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      startVec.clone().normalize()
    );
    const endQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      targetVec.clone().normalize()
    );

    const startDistance = startVec.length();
    engine.current.flight = { startTime, duration, startQuaternion, endQuaternion, startDistance, endDistance: altitude };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo,
      zoomBy: (factor) => {
        const { camera } = engine.current;
        if (!camera) return;
        const distance = THREE.MathUtils.clamp(camera.position.length() * factor, 1.35, 5.5);
        camera.position.setLength(distance);
      },
      reset: () => flyTo(18, 78, { altitude: 2.8, duration: 1200 }),
      getQuality: () => quality,
    }),
    [flyTo, quality]
  );

  /* ----------------------------------------------------------- scene setup */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let frameId;
    let visible = true;
    let lastSize = { width: 0, height: 0 };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    camera.position.set(0, 0.55, 3.4);   // replaced below once the sun is known

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: preset.antialias,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      console.error('[Globe] WebGL unavailable', error);
      setStatus('error');
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.dpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;   // keep NASA colour accurate
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D globe of world destinations');
    renderer.domElement.setAttribute('role', 'img');

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.42;
    controls.zoomSpeed = 0.7;
    controls.enablePan = false;
    controls.minDistance = 1.32;
    controls.maxDistance = 5.5;
    controls.target.set(0, 0, 0);
    controls.addEventListener('start', () => {
      engine.current.userAdjusted = true;
    });

    /* -------------------------------------------------------------- lights */
    const sun = subsolarPoint();
    const sunVec = latLngToVector3(sun.lat, sun.lng, 1);
    const sunDirection = new THREE.Vector3(sunVec.x, sunVec.y, sunVec.z);

    // Start looking at the daylit hemisphere, tilted north for a natural view.
    const openingView = latLngToVector3(sun.lat + 18, sun.lng + 12, 1);
    camera.position.set(openingView.x, openingView.y, openingView.z).setLength(3.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.1);
    sunLight.position.copy(sunDirection).multiplyScalar(6);
    scene.add(sunLight);

    /* --------------------------------------------------------------- earth */
    const loader = new THREE.TextureLoader();

    // A 1×1 placeholder keeps every sampler bound before the maps arrive —
    // some drivers reject shaders with unbound sampler units.
    const placeholder = new THREE.DataTexture(new Uint8Array([10, 14, 30, 255]), 1, 1);
    placeholder.needsUpdate = true;

    const uniforms = {
      uDayMap: { value: placeholder },
      uNightMap: { value: placeholder },
      uBumpMap: { value: placeholder },
      uWaterMap: { value: placeholder },
      uSunDirection: { value: sunDirection.clone() },
      uHasNight: { value: 0 },
      uHasBump: { value: 0 },
      uHasWater: { value: 0 },
      uBumpScale: { value: 0.9 },
      uAmbient: { value: 0.16 },
    };

    const globeGeometry = new THREE.SphereGeometry(1, preset.segments, Math.round(preset.segments * 0.6));
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: globeVertexShader,
      fragmentShader: globeFragmentShader,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    /* ---------------------------------------------------------- atmosphere */
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.022, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uSunDirection: { value: sunDirection.clone() },
          uColor: { value: new THREE.Color('#6ea8ff') },
          uIntensity: { value: 0.62 },
        },
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      })
    );
    scene.add(atmosphere);

    /* -------------------------------------------------------------- clouds */
    let clouds = null;
    if (preset.clouds && propsRef.current.showClouds) {
      const cloudCanvas = createCloudTexture({ width: 1024, height: 512 });
      const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
      cloudTexture.colorSpace = THREE.SRGBColorSpace;
      cloudTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.012, 64, 48),
        new THREE.MeshLambertMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        })
      );
      scene.add(clouds);
    }

    /* --------------------------------------------------------------- stars */
    const starGeometry = new THREE.BufferGeometry();
    const starCount = preset.stars;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 60 + Math.random() * 30;
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      starSizes[i] = Math.random() < 0.08 ? 2.4 : 1.1;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0.75 })
    );
    scene.add(stars);

    /* ------------------------------------------------------------- markers */
    const markerGeometry = new THREE.BufferGeometry();
    const markerMaterial = new THREE.ShaderMaterial({
      vertexShader: markerVertexShader,
      fragmentShader: markerFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const markers = new THREE.Points(markerGeometry, markerMaterial);
    markers.frustumCulled = false;
    scene.add(markers);

    /* -------------------------------------------- selection ring + pulse -- */
    const ringGroup = new THREE.Group();
    ringGroup.visible = false;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.028, 0.036, 48),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.038, 0.046, 48),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ringGroup.add(ring, pulse);
    scene.add(ringGroup);

    engine.current = { scene, camera, renderer, controls, markers, markerMaterial, uniforms, ringGroup, pulse, clouds, atmosphere };

    /* ------------------------------------------------- progressive loading */
    const loadTexture = (url, { srgb = true } = {}) =>
      new Promise((resolve) => {
        loader.load(
          url,
          (texture) => {
            if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            resolve(texture);
          },
          undefined,
          () => resolve(null)
        );
      });

    loadTexture(TEXTURES.dayLow).then((texture) => {
      if (disposed || !texture) return;
      uniforms.uDayMap.value = texture;
      setStatus('ready');
      onReady?.();

      if (!preset.hiRes) return;

      // Second pass: full-resolution imagery once the globe is already up.
      loadTexture(TEXTURES.dayHigh).then((hi) => {
        if (disposed || !hi) return;
        uniforms.uDayMap.value = hi;
        texture.dispose();
      });

      if (preset.night) {
        loadTexture(TEXTURES.night).then((night) => {
          if (disposed || !night) return;
          uniforms.uNightMap.value = night;
          uniforms.uHasNight.value = 1;
        });
      }

      if (preset.bump) {
        loadTexture(TEXTURES.topology, { srgb: false }).then((bump) => {
          if (disposed || !bump) return;
          uniforms.uBumpMap.value = bump;
          uniforms.uHasBump.value = 1;
        });
        loadTexture(TEXTURES.water, { srgb: false }).then((water) => {
          if (disposed || !water) return;
          uniforms.uWaterMap.value = water;
          uniforms.uHasWater.value = 1;
        });
      }
    });

    /* --------------------------------------------------------------- sizing */
    const resize = () => {
      // Measure the *parent* box, never the canvas itself, and always update
      // the CSS size so the element can never feed its own buffer size back
      // into the observer.
      const rect = mount.getBoundingClientRect();
      const width = Math.max(240, Math.round(rect.width));
      const height = Math.max(240, Math.round(rect.height));
      if (width === lastSize.width && height === lastSize.height) return;
      lastSize = { width, height };

      renderer.setSize(width, height, true);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      camera.aspect = width / height;
      // Pull the camera back on portrait/narrow viewports so the sphere always
      // fits with breathing room instead of being cropped by the frame.
      const fitDistance = FIT_RADIUS / Math.tan((camera.fov * Math.PI) / 360) / Math.min(1, camera.aspect);
      controls.minDistance = Math.max(1.25, fitDistance * 0.42);
      controls.maxDistance = fitDistance * 2.1;
      if (!engine.current.flight && camera.position.length() > controls.maxDistance) {
        camera.position.setLength(fitDistance);
      }
      if (!engine.current.userAdjusted) camera.position.setLength(fitDistance);
      engine.current.fitDistance = fitDistance;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const intersectionObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { visible = entry.isIntersecting; }),
      { threshold: 0.02 }
    );
    intersectionObserver.observe(mount);

    /* ------------------------------------------------------------ pointer  */
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.032;
    const pointer = new THREE.Vector2();
    let pointerInside = false;
    let hoverIndex = -1;
    let downPosition = null;

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
    };

    const pickMarker = () => {
      const list = propsRef.current.destinations;
      if (!list.length) return -1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(markers, false);
      if (!hits.length) return -1;

      // Ignore markers on the far side of the globe.
      const cameraDir = camera.position.clone().normalize();
      const front = hits.find((hit) => {
        const index = hit.index ?? -1;
        if (index < 0) return false;
        const item = list[index];
        if (!item) return false;
        const position = latLngToVector3(item.coords.lat, item.coords.lng, 1);
        return new THREE.Vector3(position.x, position.y, position.z).normalize().dot(cameraDir) > 0.08;
      });
      return front?.index ?? -1;
    };

    const onPointerMove = (event) => {
      updatePointer(event);
      const index = pickMarker();
      if (index !== hoverIndex) {
        hoverIndex = index;
        const item = propsRef.current.destinations[index] || null;
        renderer.domElement.style.cursor = item ? 'pointer' : 'grab';
        setHovered(item ? { ...item, index } : null);
        propsRef.current.onHover?.(item);
      }
    };

    const onPointerDown = (event) => {
      downPosition = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event) => {
      if (!downPosition) return;
      const moved = Math.hypot(event.clientX - downPosition.x, event.clientY - downPosition.y);
      downPosition = null;
      if (moved > 6) return;            // it was a drag, not a click
      updatePointer(event);
      const index = pickMarker();
      const item = propsRef.current.destinations[index];
      if (item) propsRef.current.onSelect?.(item);
    };

    const onPointerLeave = () => {
      pointerInside = false;
      hoverIndex = -1;
      setHovered(null);
      propsRef.current.onHover?.(null);
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.style.cursor = 'grab';

    /* ---------------------------------------------------------- label pool */
    const labelLayer = labelLayerRef.current;
    const labelPool = new Map();

    const ensureLabel = (destination) => {
      if (labelPool.has(destination.slug)) return labelPool.get(destination.slug);
      const element = document.createElement('button');
      element.type = 'button';
      element.className =
        'pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full ' +
        'border border-white/15 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lift ' +
        'backdrop-blur transition-opacity duration-200 hover:bg-slate-900/90';
      element.textContent = destination.name;
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        propsRef.current.onSelect?.(destination);
      });
      labelLayer?.appendChild(element);
      labelPool.set(destination.slug, element);
      return element;
    };

    /* --------------------------------------------------------- animation   */
    const clock = new THREE.Clock();
    let sunUpdatedAt = 0;
    const projection = new THREE.Vector3();

    const syncMarkers = () => {
      const list = propsRef.current.destinations;
      const count = list.length;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const states = new Float32Array(count);

      const palette = {
        Asia: new THREE.Color('#f59e0b'),
        Europe: new THREE.Color('#60a5fa'),
        Africa: new THREE.Color('#34d399'),
        'North America': new THREE.Color('#f472b6'),
        'South America': new THREE.Color('#a78bfa'),
        Oceania: new THREE.Color('#22d3ee'),
        'Middle East': new THREE.Color('#fb923c'),
        'Central America': new THREE.Color('#4ade80'),
        Caribbean: new THREE.Color('#2dd4bf'),
      };

      list.forEach((destination, index) => {
        const position = latLngToVector3(destination.coords.lat, destination.coords.lng, 1.008);
        positions[index * 3] = position.x;
        positions[index * 3 + 1] = position.y;
        positions[index * 3 + 2] = position.z;

        const color = palette[destination.continent] || new THREE.Color('#67e8f9');
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;

        sizes[index] = 0.026 + (destination.popularity || 60) / 5200;
        states[index] = destination.slug === propsRef.current.selectedSlug ? 2 : 0;
      });

      markerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      markerGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      markerGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      markerGeometry.setAttribute('aState', new THREE.BufferAttribute(states, 1));
      markerGeometry.computeBoundingSphere();
    };

    engine.current.syncMarkers = syncMarkers;
    syncMarkers();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Refresh the sun position every 60 s of wall clock.
      if (elapsed - sunUpdatedAt > 60) {
        sunUpdatedAt = elapsed;
        const next = subsolarPoint();
        const vector = latLngToVector3(next.lat, next.lng, 1);
        uniforms.uSunDirection.value.set(vector.x, vector.y, vector.z);
        atmosphere.material.uniforms.uSunDirection.value.set(vector.x, vector.y, vector.z);
        sunLight.position.set(vector.x, vector.y, vector.z).multiplyScalar(6);
      }

      // Camera flight (globe → destination).
      const flight = engine.current.flight;
      if (flight) {
        const progress = Math.min((performance.now() - flight.startTime) / flight.duration, 1);
        const eased = easeInOutCubic(progress);
        const quaternion = flight.startQuaternion.clone().slerp(flight.endQuaternion, eased);
        const distance = THREE.MathUtils.lerp(flight.startDistance, flight.endDistance, eased);
        camera.position.set(0, 0, 1).applyQuaternion(quaternion).multiplyScalar(distance);
        camera.lookAt(0, 0, 0);
        if (progress >= 1) engine.current.flight = null;
      } else if (propsRef.current.autoRotate && !pointerInside) {
        const angle = delta * 0.035;
        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      }

      if (clouds) clouds.rotation.y += delta * 0.006;
      stars.rotation.y += delta * 0.0015;

      // Selection ring sits flat on the surface at the selected coordinate.
      const selected = propsRef.current.destinations.find((d) => d.slug === propsRef.current.selectedSlug);
      if (selected) {
        const position = latLngToVector3(selected.coords.lat, selected.coords.lng, 1.012);
        ringGroup.position.set(position.x, position.y, position.z);
        ringGroup.lookAt(0, 0, 0);
        ringGroup.visible = true;
        const scale = 1 + Math.sin(elapsed * 2.4) * 0.18;
        pulse.scale.setScalar(scale);
        pulse.material.opacity = 0.55 - (scale - 1) * 1.6;
      } else {
        ringGroup.visible = false;
      }

      controls.update();

      // Labels: only the front-facing, highest-signal markers, density scaled
      // by zoom level so the globe never turns into a wall of text.
      if (propsRef.current.showLabels && labelLayer) {
        const distance = camera.position.length();
        const zoomFactor = THREE.MathUtils.clamp((5.5 - distance) / 4, 0, 1);
        const budget = Math.round(3 + zoomFactor * 14);
        const cameraDir = camera.position.clone().normalize();
        const rect = renderer.domElement.getBoundingClientRect();

        const priorities = new Set([propsRef.current.selectedSlug].filter(Boolean));
        const candidates = propsRef.current.destinations
          .map((destination) => {
            const position = latLngToVector3(destination.coords.lat, destination.coords.lng, 1.02);
            const vector = new THREE.Vector3(position.x, position.y, position.z);
            const facing = vector.clone().normalize().dot(cameraDir);
            return { destination, vector, facing };
          })
          .filter((entry) => entry.facing > 0.45)
          .sort((a, b) => {
            const score = (entry) =>
              (priorities.has(entry.destination.slug) ? 1000 : 0) +
              entry.facing * 60 +
              (entry.destination.popularity || 0);
            return score(b) - score(a);
          })
          .slice(0, budget);

        // Greedy screen-space collision test: labels are placed in priority
        // order and skipped when they would overlap one already on screen.
        const activeSlugs = new Set();
        const placed = [];

        candidates.forEach(({ destination, vector, facing }) => {
          projection.copy(vector).project(camera);
          if (projection.z > 1) return;                       // behind the camera

          const x = (projection.x * 0.5 + 0.5) * rect.width;
          const y = (-projection.y * 0.5 + 0.5) * rect.height - 12;
          const width = 18 + destination.name.length * 5.6;   // matches the pill
          const height = 18;
          const box = { left: x - width / 2, right: x + width / 2, top: y - height, bottom: y };

          if (box.left < 4 || box.right > rect.width - 4 || box.top < 4 || box.bottom > rect.height - 4) return;

          const collides = placed.some(
            (other) =>
              box.left < other.right + 6 &&
              box.right > other.left - 6 &&
              box.top < other.bottom + 4 &&
              box.bottom > other.top - 4
          );
          if (collides) return;

          placed.push(box);
          const element = ensureLabel(destination);
          element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
          element.style.opacity = String(Math.min(1, (facing - 0.35) * 4));
          element.style.display = 'block';
          activeSlugs.add(destination.slug);
        });

        labelPool.forEach((element, slug) => {
          if (!activeSlugs.has(slug)) element.style.display = 'none';
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    /* --------------------------------------------------------------- teardown */
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      labelPool.forEach((element) => element.remove());
      controls.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            Object.values(material.uniforms || {}).forEach((uniform) => uniform.value?.dispose?.());
            material.map?.dispose?.();
            material.dispose();
          });
        }
      });
      placeholder.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      engine.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.segments, preset.dpr, preset.antialias, preset.clouds, preset.stars, preset.hiRes]);

  /* --------------------------------------------- react to data/selection -- */
  useEffect(() => {
    engine.current.syncMarkers?.();
  }, [destinations, selectedSlug]);

  useEffect(() => {
    const { clouds } = engine.current;
    if (clouds) clouds.visible = showClouds;
  }, [showClouds]);

  return (
    <div className={cn('relative h-full w-full select-none', className)}>
      <div ref={mountRef} className="h-full w-full" />
      <div ref={labelLayerRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />

      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
            <p className="text-xs font-semibold text-white/70">Loading satellite imagery…</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <p className="text-sm text-white/80">
            Your browser could not start WebGL. Switch to the map view to keep exploring.
          </p>
        </div>
      )}

      {hovered && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-center shadow-lift backdrop-blur">
          <p className="text-sm font-bold text-white">{hovered.name}</p>
          <p className="text-2xs text-white/70">
            {hovered.country} · {hovered.continent}
          </p>
        </div>
      )}
    </div>
  );
});

export default RealisticGlobe;
