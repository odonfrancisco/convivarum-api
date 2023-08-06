import passport from 'passport'
import express from 'express'
import bcrypt from 'bcrypt'

import { Friend } from '#schema/index.js'
const router = express.Router()

import { reachOutMethods, validReachOutMethods } from '#config.js'

const sortTypes = {
  enabled: {
    fields: ['enabled', 'disabled'],
    check: doc => (doc.enabled ? 'enabled' : 'disabled'),
  },
  method: {
    fields: reachOutMethods,
    check: doc => doc.method,
  },
  contacted: {
    fields: ['true', 'false'],
    check: doc => doc.contacted,
  },
}

router.post('/create', async (req, res) => {
  const user = req.user
  if (req.body?.method) req.body.method = req.body.method.toLowerCase()
  const { name, method, details = '' } = req.body
  if (!name || !method) {
    return res.status(400).send('Please provide both a name and the preferred reach out method')
  }

  if (!validReachOutMethods[method]) {
    return res.status(400).send('Please provide a valid reach out method')
  }

  const newFriend = new Friend({
    name,
    method,
    user: user._id,
    details,
  })

  const savedFriend = await newFriend.save()

  if (!savedFriend) {
    res
      .status(400)
      .json({ message: 'Something with our server went wrong, try again or send us feedback' })
    return
  }

  res.status(200).json(savedFriend)
})

router.get('/get', async (req, res) => {
  const user = req.user
  const docs = await Friend.find({ user: user._id }).lean()

  if (!sortTypes[req.query.sort]) req.query.sort = 'enabled'

  const { fields, check } = sortTypes[req.query.sort]

  const ret = fields.reduce((a, c) => {
    a[c] = []
    return a
  }, {})

  for (const doc of docs) {
    const field = check(doc)
    ret[field].push(doc)
  }

  res.status(200).json(ret)
})

router.post('/update', async (req, res) => {
  const updates = req.body
  if (!updates._id) return res.status(400).send('Please ensure updating a valid friend document')
  if (!validReachOutMethods[updates.method]) {
    return res.status(400).send('Please provide a valid reach out method')
  }

  const updatedFriend = await Friend.findByIdAndUpdate({ _id: updates._id }, { $set: updates })

  res.status(200).json(updatedFriend)
})

router.get('/current', async (req, res) => {
  const user = req.user
  const method = req.query.method

  const docs = await Friend.find({
    user: user._id,
    current: true,
    ...(method && { method }),
  }).lean()

  if (method) return res.status(200).json(docs[0])

  const ret = {}
  for (const doc of docs) ret[doc.method] = doc

  res.status(200).json(ret)
})

router.post('/changeCurrent', async (req, res) => {
  const user = req.user
  const { method = 'hang', friendId } = req.body

  const current = await Friend.findOne({ user: user._id, method, current: true })
  current.set({
    current: false,
    contacted: false,
  })

  if (friendId) {
    const friendDoc = await Friend.findById({ _id: friendId })
    if (friendDoc) {
      friendDoc.set({
        current: true,
        contacted: true,
      })

      await Promise.all([current.save(), friendDoc.save()])

      return res.status(200).send(`Successfully updated the current friend to ${friendDoc.name}`)
    }
  }

  const uncontacted = await Friend.find({ user: user._id, contacted: false })
  const randomDoc = uncontacted[Math.floor(Math.random() * uncontacted.length)]

  randomDoc.set({
    current: true,
    contacted: true,
  })

  await Promise.all([current.save(), randomDoc.save()])

  res.status(200).send(`Successfully updated the current friend to ${randomDoc.name}`)
})

export default router
