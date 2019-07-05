import { DARSchema, DARList, AssetList, AssetSchema } from 'nft-open-api'

export const DB: {
  registries: DARSchema[]
  assets: AssetSchema[]
} = require('./db.json')

// For some reason, the browser's URL class does not like custom protocols.
// We are using regular expressions to handle the URL
function parseURL(
  url: string
): { protocol: string; registry: string; asset: string | void } | null {
  const result = /([^:]+):\/\/([^/]+)(?:\/(.+))?/.exec(url)
  if (result) {
    return {
      asset: result[3],
      registry: result[2],
      protocol: result[1]
    }
  }
  return null
}

export async function getDarByNameContractOrUri(
  nameContractOrUri: string
): Promise<DARSchema | void> {
  let loCaseName = nameContractOrUri.toLowerCase()

  if (loCaseName.includes('://')) {
    // it is an URL

    // name MAY be an URL and end with '/' it has to be removed
    if (loCaseName.endsWith('/')) {
      loCaseName = loCaseName.substr(0, loCaseName.length - 1)
    }

    const parsed = parseURL(loCaseName)!

    return DB.registries.find(
      $ =>
        ($.common_name &&
          $.common_name.toLowerCase() === parsed.registry.toLowerCase()) ||
        $.contract_uri.toLowerCase() == loCaseName
    )
  } else {
    const cn = DB.registries.find(
      $ =>
        ($.common_name && $.common_name.toLowerCase() === loCaseName) ||
        $.contract_uri.toLowerCase() == loCaseName
    )

    if (cn) {
      return cn
    }

    return DB.registries.find($ => {
      const parsed = parseURL($.contract_uri)

      if (!parsed) return false

      return parsed.registry.toLowerCase() === loCaseName
    })
  }
}

export async function getDarList(): Promise<DARList> {
  return {
    registries: DB.registries.map($ => {
      const ret = { ...$ }
      delete ret.traits
      return ret
    })
  }
}

export async function getAssetsByDarAndAddress(
  nameContractOrUri: string,
  address: string
): Promise<AssetList> {
  const dar = await getDarByNameContractOrUri(nameContractOrUri)

  if (dar) {
    // we do not filter by address because for builder everybody has everything

    return {
      assets: DB.assets
        .filter(asset => asset.registry === dar.common_name)
        .map($ => ({ ...$, owner: address }))
    }
  }
  return { assets: [] }
}

export async function getAssetsByAddress(address: string): Promise<AssetList> {
  return {
    assets: DB.assets.map($ => ({ ...$, owner: address }))
  }
}

export async function getDarAsset(
  nameContractOrUri: string,
  tokenId: string
): Promise<AssetSchema | void> {
  const dar = await getDarByNameContractOrUri(nameContractOrUri)

  if (dar) {
    // we do not filter by address because for builder everybody has everything

    return (
      DB.assets.find(
        asset =>
          asset.registry === dar.common_name && asset.token_id === tokenId
      ) || void 0
    )
  }
  return
}
