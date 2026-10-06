import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initIdentity } from './utils/identity';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Resolve who is signed in BEFORE the store module loads: the store reads that
// teacher's own local-first buffer at import time.
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
