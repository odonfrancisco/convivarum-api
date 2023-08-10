import passport from 'passport'
import express from 'express'
import bcrypt from 'bcrypt'

import { User } from '#schema/index.js'
const router = express.Router()

import validateEmail from '#fn/validateEmail.js'

router.post('/signup', async (req, res) => {
  const { username, password, email } = req.body

  if (!username || !password || !email) {
    res.status(400).json({ message: 'Please provide both a username, password & email' })
    return
  }

  if (!validateEmail(email)) {
    res.status(400).json({ message: 'Please provide a valid email address' })
    return
  }

  const user = await User.findOne({ username }, '_id').lean()
  if (user) {
    res.status(400).json({ message: 'This username already exists' })
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
      .json({ message: 'Something with our server went wrong, try again or send us feedback' })
    return
  }

  req.login(savedUser, err => {
    if (err) {
      res.status(500).json({
        message: 'Something with our server went wrong, try again or send us feedback',
      })
      return
    }

    res.status(200).send('Signed in successfully')
  })
})

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, errMsg) => {
    if (err) {
      res.status(500).json({
        message: 'Something went wrong in our servers, try again or kindly send us feedback',
      })
      return
    }

    if (!user) {
      res.status(401).json(errMsg)
      return
    }

    req.login(user, err => {
      if (err) {
        res.status(500).json({
          message: 'Something went wrong in our servers, try again or kindly send us feedback',
        })
        return
      }

      res.status(200).send('Logged in successfully')
    })
  })(req, res, next)
})

router.get('/loggedin', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user)
    return
  }
  res.status(403).json({ message: 'Unauthorized' })
})

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err)

    res.redirect('/')
  })
})

export default router
