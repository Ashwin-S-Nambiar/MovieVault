import { useEffect, useState } from 'react';
import { logoImg } from './tmdb';

const tones = new Map();

function measure(path) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const ratio =
          image.naturalWidth && image.naturalHeight
            ? image.naturalWidth / image.naturalHeight
            : 3;
        const width = 64;
        const height = Math.max(8, Math.round(width / ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          count += 1;
        }
        resolve(count && sum / count / 255 < 0.35 ? 'dark' : 'light');
      } catch {
        resolve('light');
      }
    };
    image.onerror = () => resolve(null);
    image.src = logoImg(path, 'w92');
  });
}

export function useLogoTone(path) {
  const [tone, setTone] = useState(() => (path ? tones.get(path) : null));

  useEffect(() => {
    if (!path) return;
    if (tones.has(path)) {
      setTone(tones.get(path));
      return;
    }
    let live = true;
    measure(path).then((value) => {
      tones.set(path, value);
      if (live) setTone(value);
    });
    return () => {
      live = false;
    };
  }, [path]);

  return path ? tone : null;
}
