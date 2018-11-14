import { Map, Range } from 'immutable'
import yargs from 'yargs'
import letsHekrmanIt from './main'

console.log('Welcome, son of Jara Hekrman!')
console.log('Run -h to get help with Hekrman!')
const args = Map(yargs.argv || {})

if (args.has('h')) {
  console.log(
    'Options:'
  )
  console.log('--sid=SESSION_ID (a session ID obtained after log in at zdjc.cz)')
  console.log('--plays=123,321 (comma separated list of play ids')
  // console.log('--row=[front|back] (default is back)')
  console.log('--retry=2 (number of attempts to get the seats default is 1)')
  console.log('--take=2 (number of seats to take (deafult is 16))')
  console.log('--odbroukovat (debug mode - will just list free seats)')

  process.exit(0)
}

const requiredArgs = {
  'plays': 'Oh, you have not specified any play id! Make sure you pass: --plays=123,333,222',
  'sid': 'Oh, you have not specified any SESSION_ID! Log in at zdjc.cz and in cookies find "JSESSIONID", pass it as: --sid=123',
}

const missingArgs = Object.keys(requiredArgs).filter((arg) => {
  return !args.get(arg)
})

if (missingArgs.length > 0) {
  console.log('=========')
  missingArgs.forEach((arg) => {
    console.log(requiredArgs[arg])
  })
  console.log('=========')
  process.exit(1)
}

const sid = args.get('sid')
const playArray = (String(args.get('plays')) || '').split(',')
const plays = playArray.reduce((plays, playId) => Object.assign(plays, { [playId]: []}), {})
const row = args.get('row') || 'back'
const debug = Boolean(args.has('odbroukovat'))
const take = args.get('take') || undefined
const retries = args.get('retry') || 1

console.log(`
  Hekrmanin' with:

  SessionId: ${sid}
  Plays: ${playArray.join(',')}
  Retrying: ${retries} times
  Debug mode: ${String(debug)}
`)

new Range(0, retries).forEach(() => {
  letsHekrmanIt(plays, sid, { debug, row, numberOfTakenSeats: take })
})
