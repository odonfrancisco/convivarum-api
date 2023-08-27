import express from 'express'

import { Friend } from '#schema/index.js'
const router = express.Router()

import { actions, validActions } from '#config.js'
import FriendPicker from '#fn/FriendPicker.js'

const sortTypes = {
  enabled: {
    fields: ['enabled', 'disabled'],
    check: doc => (doc.enabled ? 'enabled' : 'disabled'),
  },
  // Want to combine the following two
  action: {
    fields: actions,
    check: doc => doc.action,
  },
  contacted: {
    fields: ['true', 'false'],
    check: doc => doc.contacted,
  },
  current: {
    fields: actions,
    check: doc => doc.current && doc.action,
  },
}

router.post('/create', async (req, res) => {
  const user = req.user
  if (req.body?.action) req.body.action = req.body.action.toLowerCase()
  const { name, action, details = '' } = req.body
  if (!name || !action) {
    return res
      .status(400)
      .send({ msg: 'Please provide both a name and the preferred reach out action' })
  }

  if (!validActions[action]) {
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
  const docs = await Friend.find({ user: user._id }).lean()

  // Should really be the frontend doing all the sorting. need to be careful sending too large of a payload
  if (!sortTypes[req.query.sort]) req.query.sort = 'enabled'

  const { fields, check } = sortTypes[req.query.sort]

  const ret = fields.reduce((a, c) => {
    a[c] = []
    return a
  }, {})

  for (const doc of docs) {
    const field = check(doc)
    if (!ret[field]) continue
    ret[field].push(doc)
  }

  res.status(200).json({ data: ret })
})

router.post('/update/:id', async (req, res) => {
  const updates = req.body
  const id = req.params?.id
  if (!id) return res.status(400).send({ msg: 'Please ensure updating a valid friend document' })
  if (!validActions[updates.action]) {
    return res.status(400).send({ msg: 'Please provide a valid action' })
  }

  // Need to inc interactions
  const updatedFriend = await Friend.findByIdAndUpdate({ _id: id }, { $set: updates })

  res.status(200).json({ data: updatedFriend })
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
  const { randomDoc } = await Picker.pickNewFriend(true)

  res
    .status(200)
    .send({ msg: `Successfully updated the current friend to ${randomDoc.name}`, data: randomDoc })
})

export default router
