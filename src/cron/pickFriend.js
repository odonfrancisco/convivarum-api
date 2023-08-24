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
    const { action, email } = user
    if (!action) continue

    const userUpdates = { next: user.next || null }
    let actionSetNext

    await Promise.all(
      Object.entries(action).map(async ([action, { last, interval }]) => {
        const processAction = !last || last + interval < tommorrow
        if (!processAction || !interval) return

        const [uncontacted, current] = await Promise.all([
          Friend.find({
            action,
            user: user._id,
            enabled: true,
            contacted: false,
          }),
          Friend.findOne({ action, user: user._id, current: true }),
        ])

        if (!uncontacted.length) {
          const contacted = await Friend.find({
            user: user._id,
            action,
            enabled: true,
            contacted: true,
            current: false,
          })

          if (!contacted.length) {
            // One friend in this action
            if (current) uncontacted.push(current)
            // No friends in this action
            else return
          } else if (contacted.length === 1) {
            uncontacted.push(contacted[0])
          } else {
            for (const doc of contacted) {
              // handle updating the 'contacted' prop to false on each friend doc
              doc.set({ contacted: false })
              uncontacted.push(doc)
            }
          }
        }

        const randomIndex = Math.floor(Math.random() * uncontacted.length)
        const randomDoc = uncontacted[randomIndex]
        uncontacted.splice(randomIndex, 1)

        // When user first signs up, none of their friends will be current
        if (current && current._id !== randomDoc?._id) {
          current.set({ current: false, contacted: false })
        }
        randomDoc.set({ current: true, contacted: true, lastContacted: Date.now() })

        const msg = await sendMail(
          {
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

        await Promise.all([
          current && current._id !== randomDoc._id && current.save(),
          randomDoc.save(),
          ...uncontacted.map(d => d.save()),
        ])
      }),
    )

    userUpdates.next = actionSetNext

    await User.findByIdAndUpdate({ _id: user._id }, { $set: userUpdates })
  }
}
