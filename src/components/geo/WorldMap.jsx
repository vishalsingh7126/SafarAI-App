import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../lib/cn';
import Icon from '../ui/Icon';
import { detectQuality, greatCirclePath, haversine } from './geo';
import { POI_CATEGORIES } from '../../data/pointsOfInterest';

/**
 * WorldMap — a real cartographic map (Leaflet) with satellite, terrain and
 * street basemaps, zoom-aware clustering and animated fly-to.
 *
 * Tiles come from open providers that need no API key; attribution is rendered
 * by Leaflet as required by each provider's licence.
 */

const BASEMAPS = {
  satellite: {
    label: 'Satellite',
    icon: 'globe',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
  terrain: {
    label: 'Terrain',
    icon: 'mountain',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data © OpenStreetMap contributors, SRTM · style © OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
  streets: {
    label: 'Streets',
    icon: 'map',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 20,
  },
  dark: {
    label: 'Night',
    icon: 'moon',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 20,
  },
};

const CONTINENT_COLORS = {
  Asia: '#f59e0b',
  Europe: '#60a5fa',
  Africa: '#34d399',
  'North America': '#f472b6',
  'South America': '#a78bfa',
  Oceania: '#22d3ee',
  'Middle East': '#fb923c',
  'Central America': '#4ade80',
  Caribbean: '#2dd4bf',
};

function markerIcon(destination, { selected = false } = {}) {
  const color = CONTINENT_COLORS[destination.continent] || '#6366f1';
  const size = selected ? 42 : 30;
  return L.divIcon({
    className: 'safarai-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `
      <span class="safarai-pin ${selected ? 'is-selected' : ''}" style="--pin:${color}">
        <span class="safarai-pin__dot"></span>
      </span>`,
  });
}

function clusterIcon(count, dominant) {
  const color = CONTINENT_COLORS[dominant] || '#6366f1';
  const size = count > 40 ? 54 : count > 12 ? 46 : 38;
  return L.divIcon({
    className: 'safarai-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="safarai-cluster__bubble" style="--pin:${color};width:${size}px;height:${size}px">${count}</span>`,
  });
}

const WorldMap = forwardRef(function WorldMap(
  {
    destinations = [],
    selectedSlug = null,
    onSelect,
    route = null,
    pois = [],
    basemap: basemapProp,
    onBasemapChange,
    className,
    fitOnChange = true,
    showControls = true,
    initialView = { center: [20, 20], zoom: 2 },
  },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const tileRef = useRef(null);
  const routeRef = useRef(null);
  const poiRef = useRef(null);
  const labelTileRef = useRef(null);
  const propsRef = useRef({ destinations, selectedSlug, onSelect });
  const [internalBasemap, setInternalBasemap] = useState(basemapProp || 'satellite');
  const [zoom, setZoom] = useState(initialView.zoom);

  propsRef.current = { destinations, selectedSlug, onSelect, pois };
  const basemap = basemapProp || internalBasemap;
  const quality = useMemo(() => detectQuality(), []);

  /* ------------------------------------------------------------- create map */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return undefined;

    const map = L.map(container, {
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: 2,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      preferCanvas: true,
      scrollWheelZoom: true,
      zoomAnimation: quality !== 'low',
      markerZoomAnimation: quality !== 'low',
    });

    map.attributionControl.setPrefix('');
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('zoomend', () => setZoom(map.getZoom()));

    // Leaflet needs a nudge when it is mounted inside a flex/animated panel.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileRef.current = null;
      labelTileRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------- basemaps  */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const config = BASEMAPS[basemap] || BASEMAPS.satellite;
    if (tileRef.current) map.removeLayer(tileRef.current);
    if (labelTileRef.current) {
      map.removeLayer(labelTileRef.current);
      labelTileRef.current = null;
    }

    tileRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      crossOrigin: true,
      detectRetina: quality === 'high',
      keepBuffer: quality === 'low' ? 1 : 2,
    }).addTo(map);

    if (config.labels) {
      labelTileRef.current = L.tileLayer(config.labels, {
        maxZoom: config.maxZoom,
        pane: 'shadowPane',
        opacity: 0.9,
      }).addTo(map);
    }
  }, [basemap, quality]);

  /* -------------------------------------------------- markers + clustering */
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const list = propsRef.current.destinations;
    if (!list.length) return;

    const currentZoom = map.getZoom();
    const showLabels = currentZoom >= 5;
    const cellSize = currentZoom >= 6 ? 0 : currentZoom >= 4 ? 58 : 74;

    // Pixel-grid clustering: cheap, stable and dependency-free.
    const cells = new Map();
    list.forEach((destination) => {
      const point = map.latLngToLayerPoint([destination.coords.lat, destination.coords.lng]);
      const key = cellSize
        ? `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`
        : destination.slug;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(destination);
    });

    cells.forEach((group) => {
      if (group.length === 1 || !cellSize) {
        group.forEach((destination) => {
          const selected = destination.slug === propsRef.current.selectedSlug;
          const marker = L.marker([destination.coords.lat, destination.coords.lng], {
            icon: markerIcon(destination, { selected }),
            title: destination.name,
            riseOnHover: true,
            keyboard: true,
            alt: `${destination.name}, ${destination.country}`,
          });

          marker.on('click', () => propsRef.current.onSelect?.(destination));
          marker.on('keypress', (event) => {
            if (event.originalEvent.key === 'Enter') propsRef.current.onSelect?.(destination);
          });

          if (showLabels || selected) {
            marker.bindTooltip(destination.name, {
              permanent: true,
              direction: 'top',
              offset: [0, -30],
              className: 'safarai-tooltip',
            });
          }

          marker.bindPopup(
            `<div class="safarai-popup">
               <p class="safarai-popup__title">${destination.name}</p>
               <p class="safarai-popup__meta">${destination.country} · ${destination.bestTime}</p>
               <p class="safarai-popup__text">${destination.tagline}</p>
             </div>`,
            { closeButton: false, maxWidth: 220 }
          );

          layer.addLayer(marker);
        });
        return;
      }

      // Cluster bubble at the group's centroid.
      const lat = group.reduce((sum, item) => sum + item.coords.lat, 0) / group.length;
      const lng = group.reduce((sum, item) => sum + item.coords.lng, 0) / group.length;
      const dominant = group
        .map((item) => item.continent)
        .sort(
          (a, b) =>
            group.filter((item) => item.continent === b).length -
            group.filter((item) => item.continent === a).length
        )[0];

      const cluster = L.marker([lat, lng], {
        icon: clusterIcon(group.length, dominant),
        title: `${group.length} destinations`,
        alt: `Cluster of ${group.length} destinations`,
      });

      cluster.on('click', () => {
        const bounds = L.latLngBounds(group.map((item) => [item.coords.lat, item.coords.lng]));
        map.flyToBounds(bounds.pad(0.35), { duration: 0.9, maxZoom: 7 });
      });

      layer.addLayer(cluster);
    });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    renderMarkers();
    map.on('zoomend moveend', renderMarkers);
    return () => map.off('zoomend moveend', renderMarkers);
  }, [renderMarkers, destinations, selectedSlug]);

  /* -------------------------------------------------------- points of interest */
  const renderPois = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (poiRef.current) {
      map.removeLayer(poiRef.current);
      poiRef.current = null;
    }

    const list = propsRef.current.pois || [];
    if (!list.length || map.getZoom() < 7) return;

    const group = L.layerGroup();
    const showLabels = map.getZoom() >= 10;

    list.forEach((item) => {
      const category = POI_CATEGORIES[item.category] || POI_CATEGORIES.landmark;
      const marker = L.marker([item.coords.lat, item.coords.lng], {
        icon: L.divIcon({
          className: 'safarai-poi',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          html: `<span class="safarai-poi__dot" style="--pin:${category.color}" title="${item.name}"></span>`,
        }),
        alt: `${item.name} — ${category.label}`,
        riseOnHover: true,
      });

      marker.bindTooltip(item.name, {
        permanent: showLabels,
        direction: 'right',
        offset: [10, 0],
        className: 'safarai-tooltip safarai-tooltip--poi',
      });

      marker.bindPopup(
        `<div class="safarai-popup">
           <p class="safarai-popup__title">${item.name}</p>
           <p class="safarai-popup__meta">${category.label}</p>
           ${item.note ? `<p class="safarai-popup__text">${item.note}</p>` : ''}
           ${
             item.wiki
               ? `<a class="safarai-popup__link" target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/${item.wiki}">Read more →</a>`
               : ''
           }
         </div>`,
        { closeButton: false, maxWidth: 220 }
      );

      group.addLayer(marker);
    });

    group.addTo(map);
    poiRef.current = group;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    renderPois();
    map.on('zoomend moveend', renderPois);
    return () => map.off('zoomend moveend', renderPois);
  }, [renderPois, pois]);

  /* ------------------------------------------------------------ route line */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    if (routeRef.current) {
      map.removeLayer(routeRef.current);
      routeRef.current = null;
    }
    if (!route?.from || !route?.to) return undefined;

    const path = greatCirclePath(route.from, route.to, 80);
    const group = L.layerGroup();

    L.polyline(path, {
      color: '#ffffff',
      weight: 5,
      opacity: 0.35,
      lineCap: 'round',
    }).addTo(group);

    const line = L.polyline(path, {
      color: '#22d3ee',
      weight: 2.5,
      opacity: 0.95,
      dashArray: '7 9',
      lineCap: 'round',
    }).addTo(group);

    const midpoint = path[Math.floor(path.length / 2)];
    const distance = Math.round(haversine(route.from, route.to));
    L.marker(midpoint, {
      interactive: false,
      icon: L.divIcon({
        className: 'safarai-route-label',
        html: `<span>${distance.toLocaleString('en-IN')} km</span>`,
        iconSize: [90, 22],
        iconAnchor: [45, 11],
      }),
    }).addTo(group);

    group.addTo(map);
    routeRef.current = group;
    line.bringToFront();

    return () => {
      if (routeRef.current) {
        map.removeLayer(routeRef.current);
        routeRef.current = null;
      }
    };
  }, [route]);

  /* ------------------------------------------------------------ fit bounds */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitOnChange || destinations.length === 0) return;
    if (destinations.length === 1) {
      map.flyTo([destinations[0].coords.lat, destinations[0].coords.lng], 6, { duration: 1 });
      return;
    }
    const bounds = L.latLngBounds(destinations.map((item) => [item.coords.lat, item.coords.lng]));
    map.flyToBounds(bounds.pad(0.2), { duration: 0.9, maxZoom: 6 });
  }, [destinations, fitOnChange]);

  /* -------------------------------------------------------------- imperative */
  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat, lng, targetZoom = 8) => {
        mapRef.current?.flyTo([lat, lng], targetZoom, { duration: 1.4 });
      },
      fitAll: () => {
        const list = propsRef.current.destinations;
        if (!mapRef.current || !list.length) return;
        const bounds = L.latLngBounds(list.map((item) => [item.coords.lat, item.coords.lng]));
        mapRef.current.flyToBounds(bounds.pad(0.2), { duration: 1 });
      },
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      invalidate: () => mapRef.current?.invalidateSize(),
      getMap: () => mapRef.current,
    }),
    []
  );

  const setBasemap = (next) => {
    if (onBasemapChange) onBasemapChange(next);
    else setInternalBasemap(next);
  };

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <div ref={containerRef} className="h-full w-full" />

      {showControls && (
        <>
          <div className="pointer-events-auto absolute left-3 top-3 z-[500] flex flex-col gap-1 rounded-xl border border-line bg-surface/95 p-1 shadow-lift backdrop-blur">
            {Object.entries(BASEMAPS).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBasemap(key)}
                aria-pressed={basemap === key}
                title={`${config.label} basemap`}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-2xs font-bold transition',
                  basemap === key
                    ? 'bg-brand-gradient text-white shadow-float'
                    : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
                )}
              >
                <Icon name={config.icon} size="xs" />
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            ))}
          </div>

          <div className="pointer-events-auto absolute right-3 top-3 z-[500] flex flex-col gap-1 rounded-xl border border-line bg-surface/95 p-1 shadow-lift backdrop-blur">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Zoom in"
              className="rounded-lg p-2 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <Icon name="plus" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Zoom out"
              className="rounded-lg p-2 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <Icon name="minus" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => {
                const list = propsRef.current.destinations;
                if (!list.length || !mapRef.current) return;
                const bounds = L.latLngBounds(list.map((item) => [item.coords.lat, item.coords.lng]));
                mapRef.current.flyToBounds(bounds.pad(0.2), { duration: 1 });
              }}
              aria-label="Fit all destinations"
              className="rounded-lg p-2 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <Icon name="target" size="sm" />
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-lg border border-line bg-surface/90 px-2 py-1 text-2xs font-semibold text-fg-muted backdrop-blur">
            zoom {zoom} · {destinations.length} places
          </div>
        </>
      )}
    </div>
  );
});

export default WorldMap;
export { BASEMAPS, CONTINENT_COLORS };
