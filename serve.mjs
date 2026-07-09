import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT || 3000)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const pathname = decodeURIComponent(url.pathname)
  const requested = pathname === '/' ? '/index.html' : pathname
  const filePath = normalize(join(root, requested))

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Not found')
    return
  }

  response.writeHead(200, { 'content-type': types[extname(filePath).toLowerCase()] || 'application/octet-stream' })
  createReadStream(filePath).pipe(response)
})

server.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
