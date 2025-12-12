import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PortalPage } from './PortalPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortalPage />
  </StrictMode>,
);

