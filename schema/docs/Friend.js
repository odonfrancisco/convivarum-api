import mongoose from 'mongoose'

import { reachOutMethods } from '#config.js'

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  // The way main user would like to reach out
  method: { type: String, required: true, enum: reachOutMethods },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  enabled: { type: Boolean, required: true, default: true },
  contacted: { type: Boolean, required: true, default: false },
  // Current denotes whether this is the current friend of the week/month etc
  // Only one friend per method can be current=true
  current: { type: Boolean, required: true, default: false },

  details: String,
})

schema.index('user')

export default () => schema
