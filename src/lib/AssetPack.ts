import * as fs from 'fs-extra'
import * as path from 'path'
import { env, Log } from 'decentraland-commons'

import { Asset } from './Asset'
import { getDirectories } from './files'
import { writeFileAsServerResponse } from './utils'
import { DARSchema, AssetList, validateObject, TYPE_NAMES } from 'nft-open-api'
import { AssetPackInfo } from './AssetPackInfo'
import { CIDUtils } from './CIDUtils'
import { checkFile, uploadFile } from './s3'
import * as mime from 'mime/lite'

const BATCH_SIZE = parseInt(env.get('BATCH_SIZE', '15'), 10)
const log = new Log('AssetPack')

export class AssetPack {
  version: number
  assets: Asset[]

  private thumbnailCID?: string

  constructor(
    public info: AssetPackInfo,
    public contentServerURL: string,
    public publicUrl: string
  ) {
    this.version = 1
    this.assets = []
  }

  async bundle() {
    const assetDirList = getDirectories(this.info.dirPath)
    let assets: (Asset | null)[] = []
    let builds: Promise<Asset | null>[] = []

    log.info(`Processing ${assetDirList.length} assets in ${this.info.dirPath}`)
    for (const [index, assetDir] of assetDirList.entries()) {
      builds.push(this.buildAsset(assetDir))

      if (index % BATCH_SIZE === 0) {
        assets = assets.concat(await Promise.all(builds))
        builds = []
      }
    }
    assets = assets.concat(await Promise.all(builds))

    this.assets = assets.filter(asset => asset !== null) as Asset[]

    log.info(`Found ${this.assets.length} valid assets in ${this.info.dirPath}`)
  }

  async buildAsset(assetDir: string) {
    try {
      const asset = await Asset.build(assetDir, this)
      await asset.fill()
      return asset
    } catch (err) {
      log.error(`Error processing asset, skipping : ${assetDir} ${err}`)
      return null
    }
  }

  async upload(bucketName: string, skipCheck: boolean) {
    let uploads: Promise<void>[] = []

    for (const [index, asset] of this.assets.entries()) {
      uploads.push(asset.upload(bucketName, this.info.dirPath, skipCheck))

      if (index % BATCH_SIZE === 0) {
        await Promise.all(uploads)
        uploads = []
      }
      log.info(
        `(${asset.directory}) uploaded ${index + 1}/${this.assets.length}`
      )
    }
    await Promise.all(uploads)
    await this.uploadThumbnail(bucketName, skipCheck)
  }

  /** returns the CID of the thumbnail */
  async uploadThumbnail(
    bucketName: string,
    skipCheck: boolean
  ): Promise<string> {
    const thumbnailPath = path.join(this.info.dirPath, 'thumbnail.png')
    const { cid } = await new CIDUtils(thumbnailPath).getFilePathCID()

    const isFileUploaded = skipCheck ? false : await checkFile(bucketName, cid)
    const contentType = mime.getType(thumbnailPath)

    if (!isFileUploaded) {
      const contentData = await fs.readFile(thumbnailPath)
      await uploadFile(bucketName, contentType, cid, contentData)
    }

    this.thumbnailCID = cid

    return cid
  }

  async save(outPath: string) {
    const filePath = path.join(outPath, `${this.info.id}.json`)
    log.info(`Writing asset pack ${filePath}`)

    await writeFileAsServerResponse(filePath, this.toJSON())

    const assetList: AssetList = { assets: [] }

    this.assets.map($ => assetList.assets.push($.toJSON()))

    const assetsFilePath = path.join(outPath, `${this.info.id}_assets.json`)

    validateObject(TYPE_NAMES.AssetList, assetList)

    await writeFileAsServerResponse(assetsFilePath, assetList)
  }

  get contractUri() {
    return `dcl://${this.info.id}`
  }

  toJSON(): DARSchema {
    const ret: DARSchema = {
      common_name: this.info.id!,
      description: '',
      name: this.info.title!,
      schema_url: `https://schema.decentraland.org/dar/${this.info.id}`,
      traits: [
        {
          id: 'dcl:asset-pack:category',
          name: 'Decentraland Builder Category',
          type: 'string'
        },
        {
          id: 'dcl:asset-pack:tag',
          name: 'Decentraland Builder Tag',
          type: 'string'
        },
        {
          id: 'dcl:asset-pack:variation',
          name: 'Decentraland Builder Variation',
          type: 'string'
        }
      ],
      contract_uri: this.contractUri
    }

    if (this.thumbnailCID) {
      ret.image_url = `${this.contentServerURL}/${this.thumbnailCID}`
    }

    validateObject(TYPE_NAMES.DARSchema, ret)

    return ret
  }
}
