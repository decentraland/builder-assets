import * as fs from 'fs-extra'
import * as path from 'path'
import { Log } from 'decentraland-commons'

import { AssetPack } from '../lib/AssetPack'
import { getDirectories } from '../lib/files'

const log = new Log('cmd::bundle')
const ASSET_INFO_FILE_NAME = 'info.json'

type Options = {
  src: string
  contentServer: string
  bucket: string
  out: string
}

// TODO: Move to it's own file
type AssetInfo = {
  id: string
  title: string
}

export function register(program) {
  return program
    .command('bundle')
    .option('--src [assetPacksDir]', 'Path to the asset packs content folder')
    .option(
      '--bucket [bucketName]',
      'S3 bucket name to upload the asset pack contents'
    )
    .option('--content-server [contentServerURL]', 'Content server URL')
    .option('--out [assetPackOut]', 'Path to output the asset pack descriptor')
    .action(main)
}

async function main(options: Options) {
  try {
    const directories = await getDirectories(options.src)

    for (const dirPath of directories) {
      const assetInfoPath = path.join(dirPath, ASSET_INFO_FILE_NAME)

      if (await fs.pathExists(assetInfoPath)) {
        const assetInfoContent = await fs.readFile(assetInfoPath, 'utf-8')
        const { id, title }: AssetInfo = JSON.parse(assetInfoContent)

        if (!id || !title) {
          log.warn(
            `Malformed "${ASSET_INFO_FILE_NAME}" file for "${dirPath}". Check the README for an example`
          )
          continue
        }

        const assetPack = new AssetPack(id, title, dirPath)
        await uploadAssetPack(assetPack, options)
      } else {
        log.warn(
          `Skipping "${dirPath}" because the "${ASSET_INFO_FILE_NAME}" file is missing. Check the README for an example`
        )
      }
    }
  } catch (err) {
    log.error(err)
  }

  process.exit()
}

export async function uploadAssetPack(assetPack: AssetPack, options: Options) {
  await assetPack.bundle(options.contentServer)

  if (options.out) {
    assetPack.save(options.out)
  }

  if (options.bucket) {
    await assetPack.upload(options.bucket)
  }
}
