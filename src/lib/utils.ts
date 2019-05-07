import * as fs from 'fs-extra'

export async function writeFileAsServerRequest<T = any>(
  outPath: string,
  data: T
) {
  const fileContents = JSON.stringify(asServerRequest(data), null, 2)
  return fs.writeFile(outPath, fileContents)
}

export function asServerRequest<T = any>(data: T) {
  // HACK: this result format is to return like a server request
  return {
    ok: true,
    data
  }
}
