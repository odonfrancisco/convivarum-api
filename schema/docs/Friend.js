import mongoose from 'mongoose'

import { actions } from '#config.js'

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  // The way main user would like to reach out
  action: { type: String, required: true, enum: actions },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  enabled: { type: Boolean, required: true, default: true },
  contacted: { type: Boolean, required: true, default: false },
  lastContacted: Number,
  // Current denotes whether this is the current friend of the week/month etc
  // Only one friend per action can be current=true
  current: { type: Boolean, required: true, default: false },

  details: String,
})

schema.index('user')

export default () => schema
