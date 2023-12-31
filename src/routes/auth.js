import passport from 'passport'
import express from 'express'
import bcrypt from 'bcrypt'

import { User } from '#schema/index.js'
const router = express.Router()

import validateEmail from '#fn/validateEmail.js'
import welcomeUser from '#fn/welcomeUser.js'

router.post('/signup', async (req, res) => {
  const [username, email] = ['username', 'email'].map(key => (req.body[key] || '').toLowerCase())
  const { password } = req.body

  if (!username || !password || !email) {
    res.status(400).json({ msg: 'Please provide both a username, password & email' })
    return
  }

  if (!validateEmail(email)) {
    res.status(400).json({ msg: 'Please provide a valid email address' })
    return
  }

  const user = await User.findOne({ $or: [{ username }, { email }] }, '_id username email').lean()
  if (user) {
    const existingProp = user.username === username ? 'username' : 'email'
    res.status(400).json({ msg: `This ${existingProp} is already in use` })
    return
  }

  const salt = bcrypt.genSaltSync(10)
  const hashPass = bcrypt.hashSync(password, salt)

  const newUser = new User({
    username,
    password: hashPass,
    email,
  })

  const savedUser = await newUser.save()
  if (!savedUser) {
    res
      .status(400)
      .json({ msg: 'Something with our server went wrong, try again or send us feedback' })
    return
  }

  req.login(savedUser, err => {
    if (err) {
      res.status(500).json({
        msg: 'Something with our server went wrong, try again or send us feedback',
      })
      return
    }

    welcomeUser(savedUser)
    res.status(200).send({ success: true })
  })
})

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, errMsg) => {
    if (err) {
      res.status(500).json({
        msg: 'Something went wrong in our servers, try again or kindly send us feedback',
      })
      return
    }

    if (!user) {
      res.status(401).json({ err: errMsg })
      return
    }

    req.login(user, err => {
      if (err) {
        res.status(500).json({
          msg: 'Something went wrong in our servers, try again or kindly send us feedback',
        })
        return
      }

      res.status(200).send({ success: true })
    })
  })(req, res, next)
})

router.get('/loggedin', (req, res) => {
  res.status(200).json({ success: req.isAuthenticated(), user: req.user })
})

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err)

    res.redirect('/')
  })
})

export default router
