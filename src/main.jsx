import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { iniciarAnalytics } from './lib/analytics';

// Se inicializa aquí, antes de renderizar, y no dentro de un efecto de App.
// React ejecuta los efectos de los hijos antes que los del padre, así que el
// seguimiento de rutas enviaba la primera vista antes de que gtag existiera y
// esa vista se perdía en cada sesión.
iniciarAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
