import * as fs from 'fs-extra'
import * as path from 'path'

type Properties = {
  id?: string
  title?: string
}

export const FILE_NAME = 'info.json'

export class AssetPackInfo implements Properties {
  dirPath: string

  id?: string
  title?: string

  constructor(dirPath: string) {
    this.dirPath = dirPath
  }

  async read() {
    const assetInfoPath = path.join(this.dirPath, FILE_NAME)

    if (await fs.pathExists(assetInfoPath)) {
      const assetInfoContent = await fs.readFile(assetInfoPath, 'utf-8')
      const fileInfo: Partial<Properties> | null = JSON.parse(assetInfoContent)

      if (!fileInfo) {
        return null
      }

      this.id = fileInfo.id
      this.title = fileInfo.title

      return this
    }
  }

  isValid() {
    return !!this.id && !!this.title
  }
}
