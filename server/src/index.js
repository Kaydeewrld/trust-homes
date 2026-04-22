import { createApp } from './app.js'
import { assertConfig, config } from './config.js'

assertConfig()

const app = createApp()
app.listen(config.port, () => {
  console.log(`TrustedHome API listening on http://localhost:${config.port}`)
})
