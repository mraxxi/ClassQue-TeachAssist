import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import { initIdentity } from './utils/identity';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Resolve who is signed in BEFORE the store module loads: the store reads that
// teacher's own local-first buffer at import time. (Offline this answers from the
// last signed-in teacher on this browser, so the app still opens.)
root.render(
  <div className="min-h-screen flex items-center justify-center bg-[#F6F4EF] text-stone-500 text-sm font-medium">
    ClassQue…
  </div>
);

initIdentity()
  .then(() => import('./App'))
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

// Offline app shell (production only): lets the app open when the school Wi-Fi is down.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker registration failed', err));
  });
}
