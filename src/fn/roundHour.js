import { HOUR } from '#config.js'

export default {
  up: ts => ts + (HOUR - (ts % HOUR)),
  down: ts => ts - (ts % HOUR),
  dayStart: ts => new Date(ts - (ts % HOUR)).setUTCHours(0),
}
