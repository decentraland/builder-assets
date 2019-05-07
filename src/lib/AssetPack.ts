import * as path from 'path'
import { Log } from 'decentraland-commons'

import { Asset } from './Asset'
import { getDirectories } from './files'
import { writeFileAsServerRequest } from './utils'

const DEFAULT_CONTENT_SERVER_URL = 'https://content.decentraland.today'

const log = new Log('AssetPack')

export class AssetPack {
  id: string
  version: number
  title: string
  directory: string
  assets: Asset[]

  constructor(id: string, title: string, directory: string) {
    this.id = id
    this.version = 1
    this.title = title
    this.directory = directory
    this.assets = []
  }

  async bundle(contentServerURL: string = DEFAULT_CONTENT_SERVER_URL) {
    const assetDirList = getDirectories(this.directory)

    log.info(`Processing ${assetDirList.length} assets in ${this.directory}`)
    for (const assetDir of assetDirList) {
      try {
        // TODO: this could be a single method
        const asset = await Asset.build(assetDir).fill(contentServerURL)

        this.assets.push(asset)
      } catch (err) {
        log.error(`Processing : ${assetDir} ${err}`)
      }
    }
    log.info(`Found ${this.assets.length} valid assets in ${this.directory}`)
  }

  async upload(bucketName: string) {
    const batchSize = 1
    let uploads: Promise<void>[] = []

    for (const [idx, asset] of this.assets.entries()) {
      uploads.push(asset.upload(bucketName, this.directory))

      if (idx % batchSize === 0) {
        await Promise.all(uploads)
        uploads = []
      }
      log.info(`(${asset.directory}) uploaded ${idx + 1}/${this.assets.length}`)
    }
    await Promise.all(uploads)
  }

  async save(outPath: string) {
    const filePath = path.join(outPath, `${this.id}.json`)
    return writeFileAsServerRequest(filePath, this.toJSON())
  }

  toJSON() {
    return {
      id: this.id,
      version: this.version,
      title: this.title,
      assets: this.assets.map(asset => asset.toJSON())
    }
  }
}
