import * as fs from 'fs-extra'
import * as path from 'path'

type Properties = {
  id: string | undefined
  title: string | undefined
}

export const FILE_NAME = 'info.json'

export class AssetInfo {
  dirPath: string

  id: Properties['id']
  title: Properties['title']

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

  toJSON() {
    return { id: this.id, title: this.title }
  }
}
