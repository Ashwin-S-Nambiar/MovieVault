import { useEffect, useRef, useState } from 'react';

export default function Swap({ value, id, children }) {
  const counter = useRef(0);
  const [layers, setLayers] = useState([{ n: 0, id, value }]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1].id === id) {
        return prev.map((l, i) =>
          i === prev.length - 1 ? { ...l, value } : l,
        );
      }
      counter.current += 1;
      return [...prev.slice(-1), { n: counter.current, id, value }];
    });
  }, [id, value]);

  return (
    <span className="swap-stack">
      {layers.map((layer, i) => {
        const on = i === layers.length - 1;
        return (
          <span key={layer.n} className="swap" data-on={on} aria-hidden={!on}>
            {children(layer.value)}
          </span>
        );
      })}
    </span>
  );
}
