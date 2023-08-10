import { User, Friend } from '#schema/index.js'

import sendMail from '#fn/sendMail.js'
import roundHour from '#fn/roundHour.js'
import { HOUR } from '#config.js'

const customMsg = { hang: 'hang with' }

export default async function pickFriend(user) {
  const tommorrow = roundHour.dayStart(Date.now()) + HOUR * 24

  const users = user ? [user] : await User.find({ next: { $lt: tommorrow } }).lean()

  // Should promisepool it
  // Could take measures to make this more extensible with a greater number of data but chillen for now
  for (const user of users) {
    const { freq, email } = user
    if (!freq) continue

    const userUpdates = { next: null }

    await Promise.all(
      Object.entries(freq).map(async ([method, { last, interval }]) => {
        const processMethod = !last || last + interval < tommorrow
        if (!processMethod || !interval) return

        const [uncontacted, current] = await Promise.all([
          Friend.find({
            method,
            user: user._id,
            enabled: true,
            contacted: false,
          }),
          Friend.findOne({ method, user: user._id, current: true }),
        ])

        const randomDoc = uncontacted[Math.floor(Math.random() * uncontacted.length)]

        current.set({ current: false })
        randomDoc.set({ current: true, contacted: true })

        const msg = await sendMail(
          `It's time for you to ${customMsg[method] || method} ${randomDoc.name}`,
          email,
        )
        if (!msg) {
          console.log(`Error sending mail to ${email} on ${method} for ${randomDoc.name}`)
          return
        }

        userUpdates[`freq.${method}.last`] = Date.now()
        if (!userUpdates.next) userUpdates.next = Date.now() + interval
        else userUpdates.next = Math.min(Date.now() + interval, userUpdates.next)

        await Promise.all([current.save(), randomDoc.save()])
      }),
    )

    await User.findByIdAndUpdate({ _id: user._id }, { $set: userUpdates })
  }
}
