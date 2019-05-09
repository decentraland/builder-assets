import * as fs from 'fs-extra'
import * as path from 'path'
import { Log } from 'decentraland-commons'

import { AssetPack } from './AssetPack'
import { writeFileAsServerRequest } from './utils'

type ManifestAssetPack = {
  id: string
  title: string
  thumbnail: string
  url: string
}

const log = new Log('Manifest')

export class Manifest {
  outDir: string
  resultURL: string

  constructor(outDir: string, resultURL: string) {
    this.outDir = outDir
    this.resultURL = resultURL
  }

  async save(assetPacks: AssetPack[]) {
    return Promise.all([this.saveNowIndex(), this.saveIndex(assetPacks)])
  }

  async saveNowIndex() {
    const nowIndex = `{
  "version": 2,
  "routes": [
    {
      "src": "/",
      "dest": "/index.json"
    },
    {
      "src": "/(.*)",
      "dest": "/$1.json"
    }
  ]
}`
    const nowIndexPath = path.join(this.outDir, 'now.json')
    log.info('Writing server routes')
    return fs.writeFile(nowIndexPath, nowIndex)
  }

  async saveIndex(assetPacks: AssetPack[]) {
    const packs: ManifestAssetPack[] = []
    const indexPath = path.join(this.outDir, 'index.json')

    log.info('Writing index file')

    for (const assetPack of assetPacks) {
      packs.push({
        id: assetPack.id,
        title: assetPack.title,
        thumbnail: `${this.resultURL}/${assetPack.id}.png`,
        url: `/${assetPack.id}.json`
      })
    }

    return writeFileAsServerRequest(indexPath, { packs })
  }
}
