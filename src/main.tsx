/**
 * ========================================
 * MAIN ENTRY POINT
 * ========================================
 * Point d'entrée de l'application React
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { logger } from '@/middleware/logger'

// Log de démarrage de l'application
logger.info('Application starting', {
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  version: '0.1.0',
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
