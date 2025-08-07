import path from 'node:path'
import express from 'express'
import proxy from 'express-http-proxy'
import { fileURLToPath } from 'node:url'

const frontendPort = Number(process.env.TURING_FRONTEND_PORT || 8080)
const apiPort = Number(process.env.TURING_API_PORT || 6666)
const dir = path.dirname(fileURLToPath(import.meta.url))

const STATIC_PATH = path.join(dir, 'dist')

// Init Express server
const app = express()

// Serve static files
app.use(express.static(STATIC_PATH))

// Set up the proxy
app.use('/api', proxy(`http://localhost:${apiPort}`, {}))

// Start the server
app.listen(frontendPort, '0.0.0.0', () => {
  console.log('- Turing App started')
  console.log('- Web application is available on port', frontendPort)
  console.log('- REST server is listening on port', apiPort)
})
