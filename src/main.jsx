import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 Starting React application...')

try {
  const root = document.getElementById('root')
  console.log('✅ Root element found:', root)

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('✅ React app rendered successfully')
} catch (error) {
  console.error('❌ Error rendering React app:', error)
  document.body.innerHTML = `<div style="padding: 20px; font-family: monospace;">
    <h1 style="color: red;">Error Loading Application</h1>
    <pre>${error.message}\n\n${error.stack}</pre>
  </div>`
}
