// logger.js
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, colorize } = format
const path = require('path')
const fs = require('fs')

// Create logs folder if it doesn't exist
const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// Custom format: [timestamp] LEVEL: message
const logFormat = printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`
})

// Winston logger instance
const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
})

// Add console logs during local development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  )
}

module.exports = logger
