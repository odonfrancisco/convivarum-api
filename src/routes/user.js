import express from 'express'

import { User } from '#schema/index.js'
const router = express.Router()

import validateEmail from '#fn/validateEmail.js'
import { validActions } from '#config.js'

router.get('/get', async (req, res) => {
  const user = req.user

  const userDoc = await User.findById({ _id: user._id }).lean()
  res.status(200).json({ data: userDoc })
})

router.post('/update', async (req, res) => {
  const { email, freq } = req.body
  const user = req.user

  if (!validateEmail(email)) {
    res.status(400).json({ message: 'Please provide a valid email address' })
    return
  }

  for (const [action, int] of Object.entries(freq)) {
    if (!validActions[action]) {
      res.status(400).json({ message: 'Please submit valid action' })
      return
    }
  }

  await User.findByIdAndUpdate(
    { _id: user._id },
    { $set: { email, freq, next: user.next || Date.now() } },
  )

  res.status(200).send('User updated successfully')
})

export default router
