import * as fs from 'fs-extra'

export async function writeFileAsServerResponse<T = any>(
  outPath: string,
  data: T
) {
  const fileContents = JSON.stringify(data, null, 2)
  return fs.writeFile(outPath, fileContents)
}
