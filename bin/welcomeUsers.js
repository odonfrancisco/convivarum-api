import mongoose from 'mongoose'

import { User } from '#schema/index.js'
import welcomeUser from '#fn/welcomeUser.js'

const welcomeUsers = async () => {
  if (!process.env.MONGODB_URI) return console.log(`Must provide valid MONGODB_URI`)

  await mongoose
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err))

  const users = await User.find()
    .lean()
    .then(arr => arr.filter(({ username }) => username === 'dont matter'))

  for (const user of users) {
    const res = await welcomeUser(user)

    if (res) {
      console.log(`Successfully emailed ${user.username}`)
    } else {
      console.log(`Problem emailing ${user.username}`)
    }
  }

  console.log(`Welcomed ${users.length} users`)

  process.exit(0)
}

welcomeUsers()
