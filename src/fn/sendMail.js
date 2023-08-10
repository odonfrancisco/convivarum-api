import nodemailer from 'nodemailer'

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
export default async function sendMail(text, to) {
  if (!text || !to) return console.log(`Must include both email string and recipient email address`)

  const mailOptions = {
    from: `Hospite tuō ${process.env.HOST_EMAIL_USER}`,
    to,
    subject: 'Convivarum',
    text,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    return info.messageId
  } catch (err) {
    console.log(err)
    return false
  }
}
