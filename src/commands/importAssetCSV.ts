import * as fs from 'fs'
import * as path from 'path'
import * as parse from 'csv-parse/lib/sync'
import { Log } from 'decentraland-commons'

type Options = {
  assetPack: string
  src: string
}

type CSVRecord = {
  id: string
  folder: string
  name: string
  category: string
  tags: string
}

type Asset = {
  name: string
  category: string
  tags: string[]
}

const log = new Log('cmd::importAssetCSV')

export function register(program) {
  return program
    .command('importAssetCSV')
    .option('--assetPack [assetPack]', 'Name of the asset pack')
    .option('--src [csvPath]', 'Path to the asset CSV')
    .action(main)
}

function main(options: Options) {
  if (!options.assetPack) {
    throw new Error('You need to supply the asset pack name using --assetPack')
  }
  if (!options.src) {
    throw new Error('You need to supply the asset pack name using --src')
  }

  const csv = fs.readFileSync(options.src, 'utf8')

  const records: CSVRecord[] = parse(csv, {
    columns: true,
    skip_empty_lines: true
  })

  for (const record of records) {
    const asset = toAsset(record)
    const folder = path.join(options.assetPack, record.folder)
    writeAsset(folder, asset)
  }

  return options
}

function writeAsset(folder: string, asset: Asset) {
  const filepath = path.join('assets', folder, 'asset.json')
  log.info(`Writing "${filepath}" for "${asset.name}"`)
  fs.writeFileSync(filepath, JSON.stringify(asset, null, 2), 'utf8')
}

function toAsset(record: CSVRecord): Asset {
  return {
    name: record.name,
    tags: record.tags.split(','),
    category: record.category
  }
}
