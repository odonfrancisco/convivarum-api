import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import passport from 'passport'
import bodyParser from 'body-parser'
import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import morgan from 'morgan'

import { port } from '#config.js'
import setupPassport from '#passport.js'

import runCronJobs from '#cron/index.js'

import friend from '#routes/friend.js'
import auth from '#routes/auth.js'
import user from '#routes/user.js'
import health from '#routes/health.js'

const app = express()
setupPassport(passport)

const allowedOrigins = ['http://localhost:3000', 'https://convivarum.odonfrancis.co'].reduce(
  (a, c) => {
    a[c] = true
    return a
  },
  {},
)

app.use(morgan('common'))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin || !allowedOrigins[origin]) return cb(new Error('Not allowed by CORS'))
      cb(null, true)
    },
  }),
)

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
      // secure: PROD,
    },
  }),
)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credential', true)
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
  )
  if ('OPTIONS' == req.method) {
    res.send(200)
  } else {
    next()
  }
})

app.use(passport.initialize())
app.use(passport.session())

app.use('/health', health)
app.use('/api/auth', auth)

// Ensure authenticated
app.use((req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).send({ msg: 'Not Authenticated' })
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

  runCronJobs()
})
