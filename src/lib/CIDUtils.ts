import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'

import * as CID from 'cids'
import { MemoryDatastore } from 'interface-datastore'
import { Importer } from 'ipfs-unixfs-engine'

export type ContentIdentifier = {
  cid: string
  name: string
}

export interface IFile {
  path: string
  content: Buffer
  size: number
}

/**
 * Utility class to handle the calculation of a IFile CID
 */
export class CIDUtils {
  filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async getFilePathCID() {
    const file = this.readFile(this.filePath)
    return this.getFileCID(file)
  }

  /**
   * Retrieves a ContentIdentifier (which contains the CID) for the File
   * The path is ignored, it only uses the file name.
   * @param file File to calculate the CID
   */
  private async getFileCID(file: IFile): Promise<ContentIdentifier> {
    return new Promise<ContentIdentifier>((resolve, reject) =>
      this.importIPFSFile(file, (err, content) => {
        if (err) {
          reject(err)
        }

        const cid = new CID(content).toBaseEncodedString()
        resolve({ cid, name: file.path })
      })
    )
  }

  private importIPFSFile(
    file: IFile,
    callback: (err: string, content: string) => void
  ) {
    const importer = new Importer(new MemoryDatastore(), { onlyHash: true })

    pull(
      pull.values([{ path: path.basename(file.path), content: file.content }]),

      importer,

      pull.onEnd(() =>
        importer.flush((err, content) => {
          callback(err, content)
        })
      )
    )
  }

  private readFile(filePath: string): IFile {
    const stat = fs.statSync(filePath)
    const content = fs.readFileSync(filePath)
    return {
      path: filePath,
      content: Buffer.from(content),
      size: stat.size
    }
  }
}
