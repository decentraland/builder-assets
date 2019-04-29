import { Log } from 'decentraland-commons'

import { AssetPack } from '../lib/AssetPack'

const log = new Log('cmd::bundle')

export const register = program => {
  program
    .command('bundle')
    .option('--title [assetPackTitle]', 'The title for the asset pack')
    .option('--src [assetPackDir]', 'Path to the asset pack content folder')
    .option(
      '--bucket [bucketName]',
      'S3 bucket name to upload the asset pack contents'
    )
    .option('--out [assetPackOut]', 'Path to output the asset pack descriptor')
    .option('--content-server [contentServerURL]', 'Content server URL')
    .action(main)
}

const main = async options => {
  try {
    const assetPack = new AssetPack(options.title, options.src)

    await assetPack.bundle(options.contentServer)

    if (options.out) {
      assetPack.save(options.out)
    }

    if (options.bucket) {
      await assetPack.upload(options.bucket)
    }
  } catch (err) {
    log.error(err)
  }

  process.exit()
}
