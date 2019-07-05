import morgan = require('morgan')
import cors = require('cors')
import future from 'fp-future'

import * as express from 'express'
import {
  assetById,
  darByName,
  darList,
  darAssetsByAddress,
  assetsByAddress
} from './controller'
import { Server } from 'http'

export function initializeRoutes(app: express.Express) {
  app.use('/dar/:dar/asset/:asset_id', assetById)
  app.use('/dar/:dar/address/:address', darAssetsByAddress)
  app.use('/dar/:dar', darByName)
  app.use('/dar', darList)
  app.use('/address/:address', assetsByAddress)
}

export const app = express()

export async function main(port = 8080) {
  const defer = future<Server>()

  // CORS
  app.use(cors())

  // LOGGER
  app.use(morgan('dev', {}))

  // WIRING
  initializeRoutes(app)

  const server = app.listen(port, () => {
    if (server.listening) {
      defer.resolve(server)
    } else {
      defer.reject(new Error('Cannot listen'))
    }
  })

  return defer
}
