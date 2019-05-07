import * as fs from 'fs-extra'
import * as path from 'path'
import { Log } from 'decentraland-commons'

import { AssetInfo, FILE_NAME as ASSET_INFO_FILE_NAME } from '../lib/AssetInfo'
import { AssetPack } from '../lib/AssetPack'
import { getDirectories } from '../lib/files'

const log = new Log('cmd::bundle')

type Options = {
  src: string
  contentServer: string
  bucket: string
  out: string
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
  const temporalDir = '__' + path.basename(options.src)

  try {
    await fs.copy(options.src, temporalDir)

    const directories = await getDirectories(temporalDir)
    const skippedDirErrors: string[] = []

    for (const dirPath of directories) {
      const assetInfo = new AssetInfo(dirPath)
      await assetInfo.read()

      if (assetInfo.isValid()) {
        const { id, title } = assetInfo.toJSON()
        const assetPack = new AssetPack(id!, title!, dirPath)
        await uploadAssetPack(assetPack, options)
      } else {
        const dirName = path.basename(dirPath)
        skippedDirErrors.push(
          `Skipped "${dirName}" because the "${ASSET_INFO_FILE_NAME}" file is missing or malformed. Check the README for an example`
        )
      }
    }

    if (skippedDirErrors.length) {
      log.warn(`Errors:\n\t - ${skippedDirErrors.join('\n\t - ')}`)
    }
  } catch (err) {
    log.error(err)
  } finally {
    await fs.remove(temporalDir)
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
