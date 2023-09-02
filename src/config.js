export const port = process.env.PORT || 8080

export const HOUR = 3.6e6
export const BASE_URL = 'https://convivarum.odonfrancis.co'
export const DOC_LIMIT = 10e3

export const ACTIONS = ['convene', 'call', 'text']
export const VALID_ACTIONS = ACTIONS.reduce((a, c) => {
  a[c] = true
  return a
}, {})
