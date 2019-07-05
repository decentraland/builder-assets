import { main } from '.'

main()
  .then(_ => {
    console.log('listening')
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
