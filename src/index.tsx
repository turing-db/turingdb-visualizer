import { createRoot } from 'react-dom/client'
import { App } from './app'
import './style.css'

createRoot(document.getElementById('app') as Element).render(<App />)
