import * as fs from 'fs'
import * as path from 'path'

import { Log } from 'decentraland-commons'
import * as gltfPipeline from 'gltf-pipeline'

import { CIDUtils } from './CIDUtils'
import { getSHA256 } from './crypto'
import { getFiles, getRelativeDir } from './files'
import { checkFile, uploadFile } from './s3'

const ASSET_RESOURCE_FORMATS = ['.glb', '.gltf', '.png', '.jpg', '.bin']
const ASSET_SCENE_FORMATS = ['.glb']
const ASSET_FILE_NAME = 'asset.json'
const THUMB_FILE_NAME = 'thumbnail.png'

const log = new Log('Asset')

export class Asset {
  id: string
  name: string
  category: string
  tags: string[]
  thumbnail: string = ''
  url: string = ''
  variations: string[] = []
  contents: Record<string, string> = {}
  dir: string = ''

  static build(assetDir: string): Asset {
    log.info(`Reading : ${assetDir}...`)

    const filepath = path.join(assetDir, ASSET_FILE_NAME)
    const assetData = fs.readFileSync(filepath)
    const assetJSON = JSON.parse(assetData.toString())

    return new Asset(
      assetDir,
      assetJSON.name,
      assetJSON.category,
      assetJSON.tags
    )
  }

  constructor(dir: string, name: string, category: string, tags: string[]) {
    this.id = getSHA256(path.basename(dir))
    this.dir = dir
    this.name = name
    this.category = category
    this.tags = tags

    this.check()
  }

  check() {
    if (!this.name) {
      throw new Error(`Asset must have a name`)
    }

    if (this.tags.length === 0) {
      throw new Error(`Asset must have at least 1 tag`)
    }

    if (!this.category) {
      throw new Error(`Asset must have a category`)
    }

    // if (this.tags.indexOf(this.category) === -1) {
    //   throw new Error(`Asset must have a category from the included tags`)
    // }
  }

  async fill(contentServerURL: string): Promise<Asset> {
    // Thumb
    const thumbnailPath = path.join(this.dir, THUMB_FILE_NAME)
    const { cid } = await new CIDUtils(thumbnailPath).getFilePathCID()
    this.thumbnail = contentServerURL + '/' + cid

    // Contents
    await this.saveContentTextures()

    // TODO: Batch or Promise.all([cids])
    const contentFilePaths = this.getResources()
    for (const contentFilePath of contentFilePaths) {
      const { cid } = await new CIDUtils(contentFilePath).getFilePathCID()
      this.contents[getRelativeDir(contentFilePath)] = cid
    }

    // Entry point
    const sceneFilePath = Object.keys(this.contents).find(isAssetScene) || ''
    this.url = sceneFilePath

    return this
  }

  async saveContentTextures() {
    const contentFilePaths = this.getScenes()
    for (const contentFilePath of contentFilePaths) {
      try {
        await saveTexturesFromGLB(contentFilePath, this.dir)
      } catch (err) {
        log.error(`Error trying to save textures from glb ${err.message}`)
      }
    }
  }

  getScenes() {
    return this.getFiles().filter(isAssetScene)
  }

  getResources() {
    return this.getFiles().filter(isAssetResource)
  }

  getFiles() {
    return getFiles(this.dir + '/')
  }

  async upload(bucketName: string, assetPackDir: string) {
    const uploads = Object.entries(this.contents).map(
      async ([contentFilePath, contentCID]) => {
        const isFileUploaded = await checkFile(bucketName, contentCID)

        if (!isFileUploaded) {
          const contentFullPath = path.join(assetPackDir, contentFilePath)
          // TODO: Promisified fs
          const contentData = fs.readFileSync(contentFullPath)
          return uploadFile(bucketName, contentCID, contentData)
        }
      }
    )

    await Promise.all(uploads)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      thumbnail: this.thumbnail,
      url: this.url,
      category: this.category,
      tags: this.tags,
      variations: this.variations,
      contents: this.contents
    }
  }
}

// Validation

const isAssetFormat = (formats: string[]) => {
  return function(source: string): boolean {
    const extension = path.extname(source)
    for (const format of formats) {
      if (extension.indexOf(format) !== -1) {
        return true
      }
    }
    return false
  }
}

const isAssetResource = isAssetFormat(ASSET_RESOURCE_FORMATS)
const isAssetScene = isAssetFormat(ASSET_SCENE_FORMATS)

// Save files

const saveTexturesFromGLB = (srcFilePath: string, dstDir: string = '.') => {
  const options = {
    separateTextures: true
  }
  // TODO: Promisified fs
  const data = fs.readFileSync(srcFilePath)

  // TODO: npm install defenetly typed
  return gltfPipeline.processGlb(data, options).then(results => {
    const glbFilePath = path.join(dstDir, path.basename(srcFilePath))
    fs.writeFileSync(glbFilePath, results.glb)

    const separateResources = results.separateResources
    for (const relativePath in separateResources) {
      if (separateResources.hasOwnProperty(relativePath)) {
        const resource = separateResources[relativePath]
        const resourceFilePath = path.join(dstDir, relativePath)
        fs.writeFileSync(resourceFilePath, resource)
      }
    }
  })
}
