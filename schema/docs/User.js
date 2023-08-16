import mongoose from 'mongoose'

import { actions } from '#config.js'

const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },

  freq: actions.reduce((a, c) => {
    a[c] = { last: { type: Number, default: 0 }, interval: { type: Number, default: 0 } }
    return a
  }, {}),
})

schema.index('username')

export default () => schema
