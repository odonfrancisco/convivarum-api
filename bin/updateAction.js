import mongoose from 'mongoose'

import { User, Friend } from '#schema/index.js'
import { ACTIONS } from '#config.js'

const CONVENE = ACTIONS[0]
const HANG = 'hang'

const update = async () => {
  if (!process.env.MONGODB_URI) return console.log(`Must provide valid MONGODB_URI`)

  await mongoose
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err))

  const [uBulk, fBulk] = [User, Friend].map(m => m.collection.initializeUnorderedBulkOp())

  const [users, friends] = await Promise.all([User, Friend].map(m => m.collection.find().toArray()))
  for (const user of users) {
    if (!user.action) continue

    user.action = { [CONVENE]: user.action[HANG] || user.action[CONVENE], ...user.action }
    if (process.env.NODE_ENV === 'prod') delete user.action[HANG]
    uBulk.find({ _id: user._id }).updateOne({ $set: { action: user.action } })
  }
  for (const friend of friends) {
    if (friend.action !== HANG) continue
    friend.action = CONVENE
    if (process.env.NODE_ENV === 'prod') delete friend.action[HANG]
    fBulk.find({ _id: friend._id }).updateOne({ $set: { action: friend.action } })
    // proms.push(friend.save)
  }

  await Promise.all([uBulk, fBulk].map(b => b.length && b.execute()))

  console.log(`updated ${uBulk.length + fBulk.length} docs of which are ${users.length} users`)

  process.exit(0)
}

update()
