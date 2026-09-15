import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function Segmented({ options, value, onChange, label }) {
  const ref = useRef(null);
  const [thumb, setThumb] = useState(null);

  const measure = () => {
    const button = ref.current?.querySelector('[aria-pressed="true"]');
    if (!button) return;
    const x = button.offsetLeft;
    const w = button.offsetWidth;
    setThumb((prev) => (prev?.x === x && prev?.w === w ? prev : { x, w }));
  };

  useLayoutEffect(measure);

  // biome-ignore lint/correctness/useExhaustiveDependencies: observe once, measure reads the DOM
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <fieldset ref={ref} className="seg">
      <legend className="sr-only">{label}</legend>
      {thumb && (
        <span
          className="seg-thumb"
          style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
