import mongoose from 'mongoose'

import { ACTIONS } from '#config.js'

const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  // Timestamp of date to reprocess user's friend action
  next: Number,

  action: ACTIONS.reduce((a, c) => {
    a[c] = { last: { type: Number, default: 0 }, interval: { type: Number, default: 0 } }
    return a
  }, {}),
})

schema.index('username')

export default () => schema
