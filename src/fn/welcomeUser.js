import sendMail from '#fn/sendMail.js'

export default function welcomeUser(user) {
  if (!user || !user.username) return
  return sendMail({ type: 'welcome', name: user.username }, user.email)
}
