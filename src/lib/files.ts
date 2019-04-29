import * as fs from 'fs'
import * as path from 'path'

import { takeLast } from './utils'

// TODO: npm install defenetly typed for fs/path
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

export const getBaseDir = (source: string): string =>
  takeLast(path.dirname(source).split('/'))

export const getRelativeDir = (source: string): string =>
  path.join(getBaseDir(source), path.basename(source))
