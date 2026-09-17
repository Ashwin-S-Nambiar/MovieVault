import { IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { getRegions } from '../lib/catalog';
import { regionStore, toggleService } from '../lib/prefs';
import { useServiceCatalog } from '../lib/services';
import { img } from '../lib/tmdb';
import { closeSheet, useSheet } from '../lib/ui';
import { useQuery } from '../lib/useQuery';
import Sheet from './Sheet';

const INITIAL = 24;

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ServicesSheet() {
  const open = useSheet() === 'services';
  const { region, services, catalog, loading } = useServiceCatalog();
  const [showAll, setShowAll] = useState(false);
  const regions = useQuery('regions', (signal) => getRegions({ signal }), {
    enabled: open,
  });

  const pickedFirst = [
    ...catalog.filter((p) => services.includes(p.id)),
    ...catalog.filter((p) => !services.includes(p.id)),
  ];
  const visible = showAll ? pickedFirst : pickedFirst.slice(0, INITIAL);

  return (
    <Sheet open={open} onClose={closeSheet} title="Your services">
      <div className="sheet-section-head">
        <h3>Streaming services</h3>
        <p>
          Pick what you subscribe to. These show first on every title and power
          the “on your services” rows and filters.
          {services.length > 0 && (
            <span className="sheet-count"> {services.length} selected</span>
          )}
        </p>
      </div>
      {catalog.length === 0 && loading ? (
        <div className="state">
          <span className="spinner" />
        </div>
      ) : (
        <ul className="services">
          {visible.map((p) => {
            const on = services.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="service"
                  aria-pressed={on}
                  onClick={() => toggleService(p.id)}
                >
                  <span className="service-logo">
                    {p.logo ? (
                      <img
                        className="plogo"
                        src={img(p.logo, 'w154')}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="plogo pstack-more">
                        {initials(p.name)}
                      </span>
                    )}
                    <span className="service-check">
                      <IconCheck stroke={3} />
                    </span>
                  </span>
                  <span className="service-name">{p.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pickedFirst.length > INITIAL && (
        <div style={{ display: 'grid', justifyItems: 'center', marginTop: 18 }}>
          <button
            type="button"
            className="btn"
            onClick={() => setShowAll((v) => !v)}
          >
            <span className="label-stack">
              <span aria-hidden={showAll}>Show all {pickedFirst.length}</span>
              <span aria-hidden={!showAll}>Show fewer</span>
            </span>
          </button>
        </div>
      )}

      <div className="sheet-section-head" style={{ marginTop: 28 }}>
        <h3>Availability</h3>
      </div>
      <div>
        <div className="pref-row">
          <div>
            <strong>Region</strong>
            <span>Availability differs by country</span>
          </div>
          <select
            className="select"
            value={region}
            onChange={(e) => {
              regionStore.set(e.target.value);
              setShowAll(false);
            }}
            aria-label="Region"
          >
            {(regions.data ?? [{ code: region, name: region }]).map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Sheet>
  );
}
