import * as fs from 'fs'
import * as path from 'path'
// import * as uuidv4 from 'uuid/v4'

import { Log } from 'decentraland-commons'

import { Asset } from './asset'
import { getDirectories } from './files'

const DEFAULT_CONTENT_SERVER_URL = 'https://content.decentraland.today'

const log = new Log('AssetPack')

export class AssetPack {
  id: string
  version: number
  title: string
  directory: string
  assets: Asset[]

  constructor(title: string, directory: string) {
    // this.id = uuidv4()
    // TODO: hack only for first builder asset pack
    this.id = 'e6fa9601-3e47-4dff-9a84-e8e017add15a'
    this.version = 1
    this.title = title
    this.directory = directory
    this.assets = []
  }

  async bundle(contentServerURL: string = DEFAULT_CONTENT_SERVER_URL) {
    const assetDirList = getDirectories(this.directory)

    log.info(`Processing ${assetDirList.length} assets`)
    for (const assetDir of assetDirList) {
      try {
        const asset = await Asset.build(assetDir).fill(contentServerURL)

        this.assets.push(asset)
      } catch (err) {
        log.error(`Processing : ${assetDir} ${err}`)
      }
    }
    log.info(`Found ${this.assets.length} valid assets`)
  }

  async upload(bucketName: string) {
    // TODO: batch per asset
    for (const [idx, asset] of this.assets.entries()) {
      asset.upload(bucketName, this.directory)
      log.info(`(${asset.dir}) uploaded ${idx + 1}/${this.assets.length}`)
    }
  }

  save(outPath: string) {
    // HACK: this result format is to return like a server request
    const result = {
      ok: true,
      data: this
    }
    const data = JSON.stringify(result, null, 2)
    fs.writeFileSync(outPath, data)
  }
}