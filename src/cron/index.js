import { scheduleJob } from 'node-schedule'

import pickFriend from '#cron/pickFriend.js'

export default function runCronJobs() {
  pickFriend()

  scheduleJob('0 */23 * * *', () => {
    pickFriend()
  })
}
