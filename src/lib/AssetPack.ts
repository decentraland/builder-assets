import * as fs from 'fs'
import * as path from 'path'
// import * as uuidv4 from 'uuid/v4'

import { Log } from 'decentraland-commons'

import { AssetDescriptor, readAsset, processAsset } from './asset'
import { getDirectories } from './files'
import { s3CheckFile, s3UploadFile } from './s3'

const DEFAULT_CONTENT_SERVER_URL = 'https://content.decentraland.today'

const log = new Log('AssetPack')

export class AssetPack {
  id: string
  version: number
  title: string
  directory: string
  assets: AssetDescriptor[]

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
        const asset = await processAsset(readAsset(assetDir), contentServerURL)
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
      const uploads = Object.entries(asset.contents).map(
        ([contentFilePath, contentCID]) =>
          this.uploadAsset(bucketName, contentFilePath, contentCID)
      )
      await Promise.all(uploads)
      log.info(`(${asset.path}) uploaded ${idx + 1}/${this.assets.length}`)
    }
  }

  async uploadAsset(
    bucketName: string,
    contentFilePath: string,
    contentCID: string
  ) {
    const contentFullPath = path.join(this.directory, contentFilePath)
    const contentData = fs.readFileSync(contentFullPath)
    const isFileUploaded = await s3CheckFile(bucketName, contentCID)

    if (!isFileUploaded) {
      return s3UploadFile(bucketName, contentCID, contentData)
    }
  }

  save(dstPath: string) {
    // HACK: this result format is to return like a server request
    const result = {
      ok: true,
      data: this
    }
    const data = JSON.stringify(result, null, 2)
    fs.writeFileSync(dstPath, data)
  }
}
