import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import passport from 'passport'
import bodyParser from 'body-parser'
import MongoStore from 'connect-mongo'

import { port } from '#config.js'
import setupPassport from '#passport.js'

import auth from '#routes/auth.js'
import friend from '#routes/friend.js'
import user from '#routes/user.js'

const app = express()
setupPassport(passport)

app.use(bodyParser.json())

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/api/auth', auth)

// Ensure authenticated
app.use((req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).send('Not Authenticated')
  return next()
})

app.use('/api/friend', friend)
app.use('/api/user', user)

app.listen(port, async () => {
  if (!process.env.MONGODB_URI) return console.log(`Must provide valid MONGODB_URI`)

  await mongoose
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err))
})
