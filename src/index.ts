import { cli } from 'decentraland-server'

import * as bundle from './commands/bundle'

const getProgram = () => {
  return {
    addCommands(program) {
      bundle.register(program)
    }
  }
}

const main = () => cli.runProgram([getProgram()])

if (require.main === module) {
  Promise.resolve()
    .then(main)
    .catch(console.error)
}
