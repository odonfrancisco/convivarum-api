import express from 'express'

import { User } from '#schema/index.js'
const router = express.Router()

import validateEmail from '#fn/validateEmail.js'
import { VALID_ACTIONS } from '#config.js'
import roundHour from '#fn/roundHour.js'

router.get('/get', async (req, res) => {
  const user = req.user

  const userDoc = await User.findById({ _id: user._id }).lean()
  res.status(200).json({ data: userDoc })
})

router.post('/update', async (req, res) => {
  const { username, email, delayNext, ...body } = req.body
  const user = req.user

  // If email !== user.email, need to run an email validation cycle

  if (!validateEmail(email)) {
    res.status(400).json({ msg: 'Please provide a valid email address' })
    return
  }

  for (const [key, int] of Object.entries(body)) {
    if (!key.startsWith('action')) continue
    const action = key.split('.')[1]
    if (!Number.isInteger(int)) body[key] = 0
    if (!VALID_ACTIONS[action]) {
      res.status(400).json({ msg: 'Please submit valid action' })
      return
    }
    const actionObj = user.action[action]
    if (!actionObj) continue

    const changed = actionObj.interval !== int
    // If !actionObj.last, user.next shouldn't exist
    if (!changed || !actionObj.last) continue

    const newNext = roundHour.dayStart(actionObj.last + int)
    user.next = Math.min(user.next, newNext)
  }

  if (delayNext) user.next = roundHour.dayStart(Date.now() + delayNext)

  await User.findByIdAndUpdate(
    { _id: user._id },
    {
      $set: {
        username,
        email,
        next: user.next,
        ...body,
      },
    },
  )

  res.status(200).send({ msg: 'User updated successfully' })
})

export default router
