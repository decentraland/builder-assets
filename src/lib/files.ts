import * as fs from 'fs-extra'
import * as path from 'path'

// TODO: promisify?
export const isDirectory = (source: string): boolean =>
  fs.lstatSync(source).isDirectory()

export const getDirectories = (source: string): string[] =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory)

export const getFiles = (source: string): string[] =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(fullpath => !isDirectory(fullpath))

export const getRootDir = (source: string): string =>
  path
    .normalize(source)
    .split(/\/|\\/)
    .find(name => !!name) || ''

export const getBaseDir = (source: string): string =>
  path.basename(path.dirname(source))

export const getRelativeDir = (source: string): string =>
  path.join(getBaseDir(source), path.basename(source))
