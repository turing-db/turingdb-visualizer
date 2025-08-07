import path from 'node:path'
import express from 'express'
import proxy from 'express-http-proxy'
import { fileURLToPath } from 'node:url'

const port = 8080
const api_port = process.env.TURING_API_PORT || 6666
const dir = path.dirname(fileURLToPath(import.meta.url))

const STATIC_PATH = path.join(dir, 'dist')

// Init Express server
const app = express()

// Serve static files
app.use(express.static(STATIC_PATH))

// Set up the proxy
app.use('/api', proxy(`http://localhost:${api_port}`, {}))

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log('- Turing App started')
  console.log('- Web application is available on port', port)
  console.log('- REST server is listening on port', api_port)
})
