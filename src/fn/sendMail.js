import nodemailer from 'nodemailer'
import randomQuote from 'random-quotes'

import { BASE_URL } from '#config.js'

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.HOST_EMAIL_USER,
    pass: process.env.HOST_EMAIL_PWD,
  },
})

const mailTypes = {
  newFriend: ({ name, action, quote }) =>
    `
    <p style="font-size: 24px; font-weight: bold;">${name}</p>
    <p style="font-size: 24px; font-weight: bold;">${action}</p>
     <p>${quote.body}</p>
     <p> - ${quote.author}</p>
`,
  // <img src="${gifUrl}" alt="GIF" style="max-width: 100%;">
  welcome: ({ name }) =>
    name &&
    `
<!DOCTYPE html>
<html lang="en">
...
<h2>Hello ${name.charAt(0).toUpperCase() + name.slice(1)} and Welcome to Convivarum!</h2>
...
<p>This app will help automate your social life. Yes, robots are seeping into every aspect of our life and yes, my girlfriend's name is Karen.</p>
    
<img src="${BASE_URL}/assets/karen.gif" alt="GIF" style="max-width: 100%;">

<h3>With that out of the way, let's go over some features:</h3>
<ul class="features">
    <li>a) Email</li>
    <li>b) Email</li>
    <li>c) Email</li>
</ul>
<p>Fun! This feature is really the driving force behind Convivarum, and is the core of what I'd like to explore with you.</p>

<hr>
<h2>FIRST AND FOREMOST</h2>
<p>Before you begin receiving emails, you must go to your profile tab and click edit. There you will see an option to "Send first email". You can set your first email to send as of two, three, etc days from now.</p>
<hr>

<p>As of now, your friends are divided into three "action" categories: Text, Hang, & Call. For the time being each friend can only correspond to one action item, though I may improve that.</p>
<p>For each action, you can set the interval at which you'd like to to reach out to a new friend. I personally have Hang at once a week, Call once a month, and Text every 10 days. Every time the interval hits, you'll receive an email with the name of the friend to reach out to and their action.</p>
<p>These intervals can be modified by clicking Edit inside the Profile tab.</p>
<p>Another feature on the friend list is if you click Edit while in the "Current" sort, a button appears to change who your current friend to contact is. Useful if the friend picked is out of town for the week.</p>

<h3>Cool stuff!</h3>
<p>Over time I'd like to slowly introduce new features & optimizations. A short list:</p>
<ul class="features">
    <li>Improve the friend sorting (bit janky as of now)</li>
    <li>Some backend <> frontend optimizations (you won't notice this, will reduce the load on my API)</li>
    <li>A "pause" button to chill on the intervals for a bit</li>
    <li>Notes per interaction per friend (you'll be able to see a history of your interactions alongside the notes)</li>
    <li>Integrate Google calendar</li>
</ul>
<p>... and more! But for now, you'll have to bear the weight of my barebones app.</p>

<p>Valē! Multās grātiās vōbīs agō. Sperõ applicātiō meus tē dēlectāre. Dēlectātiõ amōris amicōrum familiārumque superātur nōn potest.</p>
</html>`,
}

// export default
export default async function sendMail({ type = 'newFriend', name, action }, to) {
  // if (!name || !action || !to) return console.log(`Must include name, action, & email`)
  if (!mailTypes[type]) return console.log('Invalid mail type')

  const quote = randomQuote.default()

  const html = mailTypes[type]({ name, action, quote })
  if (!html) return false

  const mailOptions = {
    from: `Hospite tuō ${process.env.HOST_EMAIL_USER}`,
    to,
    subject: 'Convivarum',
    text: 'Sup Boii',
    html,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    return info.messageId
  } catch (err) {
    console.log(err)
    return false
  }
}
