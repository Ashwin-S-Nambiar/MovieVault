import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { APPS } from '../lib/apps';
import { healthTone, useHealth } from '../lib/health';
import {
  deviceLanguage,
  languageStore,
  themeStore,
  toggleApp,
  useApps,
  useLanguage,
  useTheme,
} from '../lib/prefs';
import { closeSheet, useSheet } from '../lib/ui';
import Segmented from './Segmented';
import Sheet from './Sheet';

const LANGUAGES = [
  'en-US',
  'ja-JP',
  'ko-KR',
  'hi-IN',
  'ta-IN',
  'te-IN',
  'ml-IN',
  'es-ES',
  'es-MX',
  'fr-FR',
  'de-DE',
  'it-IT',
  'pt-BR',
  'zh-CN',
  'tr-TR',
  'th-TH',
];

function nativeName(tag) {
  if (tag === 'en-US') return 'English';
  try {
    const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag);
    return name.charAt(0).toLocaleUpperCase(tag) + name.slice(1);
  } catch {
    return tag;
  }
}

function changeLanguage(tag) {
  languageStore.set(tag);
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('mv:q:')) sessionStorage.removeItem(key);
    }
  } catch {}
  window.location.reload();
}

function LanguageRow() {
  const language = useLanguage();
  const device = deviceLanguage();
  const tags = LANGUAGES.includes(device) ? LANGUAGES : [...LANGUAGES, device];
  return (
    <div className="pref-row">
      <div>
        <strong>Titles and descriptions</strong>
        <span>From TMDB, where a translation exists</span>
      </div>
      <select
        className="select"
        value={tags.includes(language) ? language : 'en-US'}
        aria-label="Language for titles and descriptions"
        onChange={(event) => changeLanguage(event.target.value)}
      >
        {tags.map((tag) => (
          <option key={tag} value={tag}>
            {nativeName(tag)}
            {tag === device && tag !== 'en-US' ? ' (device)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

function ApiStatusRow() {
  const health = useHealth();
  const tone = healthTone(health);
  const text = {
    up: `Connected${health.latency ? ` · ${Math.round(health.latency)}ms` : ''}`,
    idle: 'Waiting for the first request',
    retrying: 'Reconnecting',
    down: health.lastError ?? 'Not responding',
    offline: 'Offline',
    'bad-key': 'API key rejected',
  }[tone];

  return (
    <div className="pref-row">
      <div>
        <strong>Connection to TMDB</strong>
        <span className="status-line">
          <span className="dot" data-status={tone} />
          {text}
        </span>
      </div>
    </div>
  );
}

export default function SettingsSheet() {
  const open = useSheet() === 'settings';
  const theme = useTheme();
  const apps = useApps();

  return (
    <Sheet open={open} onClose={closeSheet} title="Settings">
      <div className="sheet-section-head">
        <h3>Appearance</h3>
      </div>
      <div>
        <div className="pref-row">
          <div>
            <strong>Theme</strong>
            <span>Follow your device or pick one</span>
          </div>
          <Segmented
            label="Theme"
            value={theme}
            onChange={(value) => themeStore.set(value)}
            options={[
              {
                value: 'system',
                label: 'Match device',
                icon: <IconDeviceDesktop stroke={1.8} />,
              },
              {
                value: 'light',
                label: 'Light',
                icon: <IconSun stroke={1.8} />,
              },
              { value: 'dark', label: 'Dark', icon: <IconMoon stroke={1.8} /> },
            ]}
          />
        </div>
        <LanguageRow />
      </div>
      <div className="sheet-section-head" style={{ marginTop: 28 }}>
        <h3>Watch apps</h3>
        <p>
          Show an Open button on title pages for the apps you have installed.
        </p>
      </div>
      <div>
        {APPS.map((app) => {
          const on = apps.includes(app.id);
          return (
            <div key={app.id} className="pref-row">
              <div className="app-row">
                <img className="app-icon" src={app.icon} alt="" />
                <div>
                  <strong>{app.name}</strong>
                  <span>{app.platforms}</span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                className="switch"
                aria-checked={on}
                aria-label={`Show Open in ${app.name}`}
                onClick={() => toggleApp(app.id)}
              />
            </div>
          );
        })}
      </div>
      <div className="sheet-section-head" style={{ marginTop: 28 }}>
        <h3>Data</h3>
      </div>
      <div>
        <ApiStatusRow />
        <p className="attribution">
          Streaming availability from JustWatch, via TMDB.
        </p>
      </div>
    </Sheet>
  );
}
