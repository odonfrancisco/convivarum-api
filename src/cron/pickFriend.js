import { User } from '#schema/index.js'

import sendMail from '#fn/sendMail.js'
import roundHour from '#fn/roundHour.js'
import FriendPicker from '#fn/FriendPicker.js'
import { HOUR } from '#config.js'

const customMsg = { hang: 'hang with' }

export default async function pickFriend(user) {
  const tommorrow = roundHour.dayStart(Date.now()) + HOUR * 24

  const users = user ? [user] : await User.find({ next: { $lt: tommorrow } }).lean()

  // Should promisepool it
  // Could take measures to make this more extensible with a greater number of data but chillen for now
  for (const user of users) {
    const { action, email } = user
    if (!action) continue

    const userUpdates = { next: user.next || null }
    let actionSetNext

    await Promise.all(
      Object.entries(action).map(async ([action, { last, interval }]) => {
        const processAction = !last || last + interval < tommorrow
        if (!processAction || !interval) return

        // Don't know if it's good practice to be instantiating a new class inside a loop
        const picker = new FriendPicker(user, action)
        const { randomDoc } = await picker.pickNewFriend()
        if (!randomDoc) return

        const msg = await sendMail(
          {
            type: 'newFriend',
            action: customMsg[action] || action,
            name: randomDoc.name,
          },
          email,
        )
        if (!msg) {
          console.log(`Error sending mail to ${email} on ${action} for ${randomDoc.name}`)
          return
        }

        userUpdates[`action.${action}.last`] = Date.now()
        const newNext = roundHour.dayStart(Date.now() + interval)
        if (!actionSetNext) actionSetNext = newNext
        else actionSetNext = Math.min(newNext, actionSetNext)

        await picker.saveFriends()
      }),
    )

    userUpdates.next = actionSetNext

    await User.findByIdAndUpdate({ _id: user._id }, { $set: userUpdates })
  }
}
