export const port = process.env.PORT || 8080

export const HOUR = 3.6e6

export const reachOutMethods = ['call', 'text', 'hang']
export const validReachOutMethods = reachOutMethods.reduce((a, c) => {
  a[c] = true
  return a
}, {})
