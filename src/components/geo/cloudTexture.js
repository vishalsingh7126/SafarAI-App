/**
 * Procedural cloud texture.
 * ---------------------------------------------------------------------------
 * Generating the cloud layer on the client keeps the globe's asset budget to
 * the three NASA maps we already ship, and lets us scale resolution with the
 * device. Value-noise fBm gives soft, banded cover that reads as weather at
 * globe scale without pretending to be a real forecast.
 */

function makeNoise(seed = 1) {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const size = 256;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i += 1) grid[i] = random();

  const at = (x, y) => grid[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  const smooth = (t) => t * t * (3 - 2 * t);

  return function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a * (1 - xf) * (1 - yf) + b * xf * (1 - yf) + c * (1 - xf) * yf + d * xf * yf;
  };
}

export default function createCloudTexture({ width = 1024, height = 512, seed = 7, coverage = 0.52 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, height);
  const noise = makeNoise(seed);

  for (let y = 0; y < height; y += 1) {
    // Latitude weighting: heavy cloud in the tropics and mid-latitude storm
    // belts, clearer over the subtropical highs — roughly how Earth looks.
    const lat = 90 - (y / height) * 180;
    const tropics = Math.exp(-((lat / 14) ** 2)) * 0.55;
    const midLatN = Math.exp(-(((lat - 52) / 16) ** 2)) * 0.45;
    const midLatS = Math.exp(-(((lat + 52) / 16) ** 2)) * 0.45;
    const subtropics = -Math.exp(-(((Math.abs(lat) - 27) / 12) ** 2)) * 0.35;
    const band = tropics + midLatN + midLatS + subtropics;

    for (let x = 0; x < width; x += 1) {
      // fBm — four octaves, stretched horizontally so bands smear east–west.
      const u = (x / width) * 26;
      const v = (y / height) * 13;
      let value = 0;
      let amplitude = 0.55;
      let frequency = 1;
      for (let octave = 0; octave < 4; octave += 1) {
        value += noise(u * frequency, v * frequency * 1.6) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.1;
      }

      const density = Math.max(0, Math.min(1, (value + band - coverage) * 2.4));
      const alpha = Math.round(density ** 1.4 * 235);
      const index = (y * width + x) * 4;
      image.data[index] = 255;
      image.data[index + 1] = 255;
      image.data[index + 2] = 255;
      image.data[index + 3] = alpha;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}
