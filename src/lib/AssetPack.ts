import * as fs from 'fs-extra'
import * as path from 'path'
import { env, Log } from 'decentraland-commons'

import { Asset } from './Asset'
import { getDirectories } from './files'
import { writeFileAsServerRequest } from './utils'

const BATCH_SIZE = parseInt(env.get('BATCH_SIZE', '15'), 10)
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

  async bundle(contentServerURL: string) {
    const assetDirList = getDirectories(this.directory)
    let assets: (Asset | null)[] = []
    let builds: Promise<Asset | null>[] = []

    log.info(`Processing ${assetDirList.length} assets in ${this.directory}`)
    for (const [index, assetDir] of assetDirList.entries()) {
      builds.push(this.buildAsset(assetDir, contentServerURL))

      if (index % BATCH_SIZE === 0) {
        assets = assets.concat(await Promise.all(builds))
        builds = []
      }
    }
    assets = assets.concat(await Promise.all(builds))

    this.assets = assets.filter(asset => asset !== null) as Asset[]

    log.info(`Found ${this.assets.length} valid assets in ${this.directory}`)
  }

  async buildAsset(assetDir: string, contentServerURL: string) {
    try {
      const asset = await Asset.build(assetDir)
      await asset.fill(contentServerURL)
      return asset
    } catch (err) {
      log.error(`Error processing asset, skipping : ${assetDir} ${err}`)
      return null
    }
  }

  async upload(bucketName: string, skipCheck: boolean) {
    let uploads: Promise<void>[] = []

    for (const [index, asset] of this.assets.entries()) {
      uploads.push(asset.upload(bucketName, this.directory, skipCheck))

      if (index % BATCH_SIZE === 0) {
        await Promise.all(uploads)
        uploads = []
      }
      log.info(
        `(${asset.directory}) uploaded ${index + 1}/${this.assets.length}`
      )
    }
    await Promise.all(uploads)
  }

  async save(outPath: string) {
    const filePath = path.join(outPath, `${this.id}.json`)
    const thumbnailPath = path.join(outPath, `${this.id}.png`)

    return Promise.all([
      writeFileAsServerRequest(filePath, this.toJSON()),

      fs.copy(path.join(this.directory, 'thumbnail.png'), thumbnailPath)
    ])
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
