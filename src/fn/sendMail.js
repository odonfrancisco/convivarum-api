import nodemailer from 'nodemailer'
import randomQuote from 'random-quotes'

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.HOST_EMAIL_USER,
    pass: process.env.HOST_EMAIL_PWD,
  },
})

// export default
export default async function sendMail({ name, action }, to) {
  if (!name || !action || !to) return console.log(`Must include name, action, & email`)

  const quote = randomQuote.default()

  const mailOptions = {
    from: `Hospite tuō ${process.env.HOST_EMAIL_USER}`,
    to,
    subject: 'Convivarum',
    text: 'Sup Boii',
    html: `
    <p style="font-size: 24px; font-weight: bold;">${name}</p>
    <p style="font-size: 24px; font-weight: bold;">${action}</p>
     <p>${quote.body}</p>
     <p> - ${quote.author}</p>
`,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    return info.messageId
  } catch (err) {
    console.log(err)
    return false
  }
}
