import { runProgram } from 'decentraland-server/dist/cli'

import * as bundle from './commands/bundle'
import * as importAssetCSV from './commands/importAssetCSV'

const commands = {
  bundle,
  importAssetCSV
}

const getProgram = () => {
  const name = process.argv[2] as keyof typeof commands
  const command = commands[name]

  if (!command) {
    throw new Error(`Could not find command name "${name}"`)
  }

  return {
    addCommands(program) {
      command.register(program)
    }
  }
}

const main = () => runProgram([getProgram()])

if (require.main === module) {
  Promise.resolve()
    .then(main)
    .catch(console.error)
}
