const rideKeywords = ['ride', 'rides', 'need ride', 'looking for ride', 'want ride', 'commute']
const accomKeywords = ['accommodation', 'room', 'stay', 'need accommodation', 'people', 'male', 'female', 'looking stay', 'acco']

function matchType(text) {
  const lowerText = text.trim().toLowerCase()
  const isRide = rideKeywords.some(k => lowerText.includes(k))
  const isAccom = accomKeywords.some(k => lowerText.includes(k))

  if (isRide && isAccom) return 'both'
  if (isRide) return 'ride'
  if (isAccom) return 'accom'
  return ''
}

module.exports = { matchType }