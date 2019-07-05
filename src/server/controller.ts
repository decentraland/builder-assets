import { Request, Response } from 'express'

import {
  getDarByNameContractOrUri,
  getDarList,
  getDarAsset,
  getAssetsByAddress,
  getAssetsByDarAndAddress
} from './service'
import { DARList } from 'nft-open-api/dist'

// /dar
export function darList(_: Request, res: Response) {
  const dar = getDarList()
  dar.then(
    dar => {
      if (dar) {
        const ret: DARList = { registries: dar.registries }
        res.send(ret)
      } else {
        res.status(404)
        res.send({ error: 'DAR not found' })
        res.end()
      }
    },
    error => {
      res.status(500)
      res.send({ error: error.toString() })
      res.end()
    }
  )
}

// /dar/:dar
export function darByName(req: Request, res: Response) {
  const dar = getDarByNameContractOrUri(req.params.dar)
  dar.then(
    dar => {
      if (dar) {
        res.send(dar)
      } else {
        res.status(404)
        res.send({ error: 'DAR not found' })
        res.end()
      }
    },
    error => {
      res.status(500)
      res.send({ error: error.toString() })
      res.end()
    }
  )
}

// /dar/:dar/asset/:asset_id
export function assetById(req: Request, res: Response) {
  const asset = getDarAsset(req.params.dar, req.params.asset_id)
  asset.then(
    asset => {
      if (asset) {
        res.send(asset)
      } else {
        res.status(404)
        res.send({ error: 'Asset or DAR not found' })
        res.end()
      }
    },
    error => {
      res.status(500)
      res.send({ error: error.toString() })
      res.end()
    }
  )
}

// /dar/:dar/address/:address
export function darAssetsByAddress(req: Request, res: Response) {
  const assets = getAssetsByDarAndAddress(req.params.dar, req.params.address)
  assets.then(
    response => {
      res.send(response)
    },
    error => {
      res.status(500)
      res.send({ error: error.toString() })
      res.end()
    }
  )
}

// /address/:address
export function assetsByAddress(_: Request, res: Response) {
  const assets = getAssetsByAddress(_.params.address)
  assets.then(
    response => {
      res.send(response)
    },
    error => {
      res.status(500)
      res.send({ error: error.toString() })
      res.end()
    }
  )
}
