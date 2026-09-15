import { useLayoutEffect, useRef } from 'react';
import { attachFlight, flightStore } from '../lib/hero';
import { useStore } from '../lib/store';
import OpenCase from './OpenCase';

export default function Flight() {
  const flight = useStore(flightStore);
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (flight) attachFlight(flight.id, ref.current);
  }, [flight]);

  if (!flight) return null;

  return (
    <div ref={ref} key={flight.id} className="flight" aria-hidden="true">
      <div className="flight-veil" />
      <div className="flight-case">
        <OpenCase item={flight.item} />
      </div>
    </div>
  );
}
