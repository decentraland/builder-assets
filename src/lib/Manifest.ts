import * as path from 'path'
import { Log } from 'decentraland-commons'

import { AssetPack } from './AssetPack'
import { DARList, AssetList } from 'nft-open-api/dist'
import { writeFileAsServerResponse } from './utils'
import { mkdirSync } from 'fs'

const log = new Log('Manifest')

export class Manifest {
  darList: DARList = { registries: [] }

  nowIndex = {
    version: 2,
    routes: [
      {
        src: '/dar',
        dest: '/dar.json'
      }
    ]
  }

  constructor(public outDir: string, public resultURL: string) {}

  async save(assetPacks: AssetPack[]) {
    await this.saveAssetPacks(assetPacks)
    await this.saveNowIndex()
  }

  private async saveAssetPacks(assetPacks: AssetPack[]) {
    log.info('Writing asset packs file')

    const darPath = path.join(this.outDir, 'dar')

    try {
      mkdirSync(darPath)
    } catch {}

    const assetList: AssetList = { assets: [] }

    await Promise.all(
      assetPacks.map(async $ => {
        const dar = $.toJSON()
        this.darList.registries.push(dar)

        this.nowIndex.routes.push({
          src: `/dar/${dar.common_name}`,
          dest: `/dar/${dar.common_name}.json`
        })

        this.nowIndex.routes.push({
          src: `/dar/${dar.common_name}/address/(.+)`,
          dest: `/dar/${dar.common_name}_assets.json`
        })

        await $.save(darPath)

        $.assets.forEach($ => assetList.assets.push($.toJSON()))
      })
    )
  }

  private async saveNowIndex() {
    log.info('Writing server routes')

    const nowIndexPath = path.join(this.outDir, 'now.json')
    const indexPath = path.join(this.outDir, 'dar.json')

    await writeFileAsServerResponse(nowIndexPath, this.nowIndex)
    await writeFileAsServerResponse(indexPath, this.darList)
  }
}
