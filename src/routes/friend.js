import express from 'express'

import { Friend } from '#schema/index.js'
const router = express.Router()

import { VALID_ACTIONS, DOC_LIMIT } from '#config.js'
import FriendPicker from '#fn/FriendPicker.js'

router.post('/create', async (req, res) => {
  const user = req.user
  if (req.body?.action) req.body.action = req.body.action.toLowerCase()
  const { name, action, details = '' } = req.body
  if (!name || !action) {
    return res
      .status(400)
      .send({ msg: 'Please provide both a name and the preferred reach out action' })
  }

  if (!VALID_ACTIONS[action]) {
    return res.status(400).send({ msg: 'Please provide a valid action' })
  }

  const newFriend = new Friend({
    name,
    action,
    user: user._id,
    details,
  })

  const savedFriend = await newFriend.save()

  if (!savedFriend) {
    res
      .status(400)
      .json({ msg: 'Something with our server went wrong, try again or send us feedback' })
    return
  }

  res.status(200).json({ data: savedFriend })
})

router.get('/get', async (req, res) => {
  const user = req.user
  const data = await Friend.find({ user: user._id }).limit(DOC_LIMIT).lean()

  res.status(200).json({ data })
})

router.post('/update/:id', async (req, res) => {
  const updates = req.body
  const id = req.params?.id
  if (!id) return res.status(400).send({ msg: 'Please ensure updating a valid friend document' })
  if (!VALID_ACTIONS[updates.action]) {
    return res.status(400).send({ msg: 'Please provide a valid action' })
  }

  // Need to inc interactions
  const oldFriendDoc = await Friend.findByIdAndUpdate({ _id: id }, { $set: updates })

  res.status(200).json({ data: { cur: { ...updates, _id: id }, old: oldFriendDoc } })
})

router.get('/current', async (req, res) => {
  const user = req.user
  const action = req.query.action

  const docs = await Friend.find({
    user: user._id,
    current: true,
    ...(action && { action }),
  }).lean()

  if (action) return res.status(200).json({ data: docs[0] })

  const ret = {}
  for (const doc of docs) ret[doc.action] = doc

  res.status(200).json({ data: ret })
})

router.get('/changeCurrent', async (req, res) => {
  const user = req.user
  const action = req.query.action

  const Picker = new FriendPicker(user, action)
  const { randomDoc, current } = await Picker.pickNewFriend(true)

  res.status(200).send({
    msg: `Successfully updated the current friend to ${randomDoc.name}`,
    data: { old: current, cur: randomDoc },
  })
})

export default router
