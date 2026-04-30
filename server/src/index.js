import { createApp } from './app.js'
import { assertConfig, config } from './config.js'
import { createServer } from 'node:http'
import { initRealtime } from './realtime/socket.js'

assertConfig()

const app = createApp()
const server = createServer(app)
initRealtime(server)
server.listen(config.port, () => {
  console.log(`TrustedHome API listening on http://localhost:${config.port}`)
})
