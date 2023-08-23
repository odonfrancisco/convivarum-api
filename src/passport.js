import passport_local from 'passport-local'
import bcrypt from 'bcrypt'

import { User } from '#schema/index.js'
const LocalStrategy = passport_local.Strategy

export default passport => {
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (name, password, done) => {
      const username = name && name.toLowerCase()
      const user = await User.findOne({ username }, '+password')

      if (!user) {
        done(null, false, { message: 'Your username or password is out of this world' })
        return
      }

      if (!user.password) {
        done(null, false, { message: 'DB error', status: 500 })
      }

      if (!bcrypt.compareSync(password, user.password)) {
        done(null, false, { message: 'Your username or password is out of this world' })
        return
      }

      done(null, user)
    }),
  )

  // Serialize user into the session
  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id)
    if (!user) return

    done(null, user)
  })
}
