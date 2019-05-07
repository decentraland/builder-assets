import * as fs from 'fs-extra'
import * as path from 'path'
import { Log } from 'decentraland-commons'

import { AssetInfo, FILE_NAME as ASSET_INFO_FILE_NAME } from '../lib/AssetInfo'
import { AssetPack } from '../lib/AssetPack'
import { Manifest } from '../lib/Manifest'
import { getDirectories } from '../lib/files'

const log = new Log('cmd::bundle')

type Options = {
  src: string
  contentServer: string
  bucket: string
  out: string
  url: string
}

export function register(program) {
  // TODO: Add a skip flag
  return program
    .command('bundle')
    .option('--src [assetPacksDir]', 'Path to the asset packs content folder')
    .option(
      '--bucket [bucketName]',
      'S3 bucket name to upload the asset pack contents'
    )
    .option('--content-server [contentServerURL]', 'Content server URL')
    .option('--out [assetPackOut]', 'Path to the asset pack descriptor output')
    .option('--url [url]', 'URL where the assets where be served')
    .action(main)
}

async function main(options: Options) {
  const temporalDir = '_' + path.basename(options.src)

  try {
    checkOptions(options)

    await fs.copy(options.src, temporalDir)

    const directories = await getDirectories(temporalDir)
    const uploadedAssetPacks: AssetPack[] = []
    const skippedDirErrors: string[] = []

    for (const dirPath of directories) {
      const assetInfo = new AssetInfo(dirPath)
      await assetInfo.read()

      if (assetInfo.isValid()) {
        const { id, title } = assetInfo.toJSON()
        const assetPack = new AssetPack(id!, title!, dirPath)

        await uploadAssetPack(assetPack, options)
        uploadedAssetPacks.push(assetPack)
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

    if (options.out) {
      await new Manifest(options.out, options.url).save(uploadedAssetPacks)
    }
  } catch (err) {
    log.error(err)
  } finally {
    await fs.remove(temporalDir)
  }

  process.exit()
}

async function uploadAssetPack(assetPack: AssetPack, options: Options) {
  await assetPack.bundle(options.contentServer)

  if (options.out) {
    await assetPack.save(options.out)
  }

  if (options.bucket) {
    await assetPack.upload(options.bucket)
  }
}

function checkOptions(options: Options) {
  const { src, out, url } = options

  if (!src) {
    throw new Error(
      'You need to supply a --src path to the assets. Check --help for more info'
    )
  }

  if ((out && !url) || (!out && url)) {
    throw new Error(
      'You need to supply both --out and --url or neither. Check --help for more info'
    )
  }
}
