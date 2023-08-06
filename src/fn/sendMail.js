import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Your SMTP server address
  port: 587, // Common ports include 587 (TLS), 465 (SSL), or 25 (non-secure)
  secure: false, // true for 465 (SSL), false for other ports
  auth: {
    user: process.env.HOST_EMAIL_USER, // Your SMTP username
    pass: process.env.HOST_EMAIL_PWD, // Your SMTP password
  },
})

// export default
export default function sendMail(text, to) {
  if (!text || !to) return console.log(`Must include both email string and recipient email address`)

  const mailOptions = {
    from: `Francisco ${process.env.HOST_EMAIL_USER}`,
    to,
    subject: 'This is your person of the week',
    text,
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.log(error)

    console.log('Message sent: %s', info.messageId)
  })
}
