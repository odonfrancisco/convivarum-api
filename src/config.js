export const port = process.env.PORT || 8080

export const HOUR = 3.6e6
export const BASE_URL = 'https://convivarum.odonfrancis.co'

export const actions = ['call', 'text', 'hang']
export const validActions = actions.reduce((a, c) => {
  a[c] = true
  return a
}, {})
