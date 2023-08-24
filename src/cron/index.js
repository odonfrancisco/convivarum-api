import { scheduleJob } from 'node-schedule'

import pickFriend from '#cron/pickFriend.js'

export default function runCronJobs() {
  if (process.env.NODE_ENV !== 'production') pickFriend()

  scheduleJob('0 */13 * * *', () => {
    pickFriend()
  })
}
