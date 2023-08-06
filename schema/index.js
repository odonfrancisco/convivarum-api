import mongoose from 'mongoose'

import UserSchema from '#schema/docs/User.js'
import FriendSchema from '#schema/docs/Friend.js'

export const User = mongoose.model('User', UserSchema())
export const Friend = mongoose.model('Friend', FriendSchema())
