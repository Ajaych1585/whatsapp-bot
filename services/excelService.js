const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const logger = require('../logger')

const EXCEL_FILE = path.join(__dirname, '..', 'group_numbers.xlsx')

function readNumbers() {
  if (!fs.existsSync(EXCEL_FILE)) return new Set()
  const data = XLSX.utils.sheet_to_json(XLSX.readFile(EXCEL_FILE).Sheets['Group Members'] || {})
  return new Set(data.map(row => row.PhoneNumber && `${row.CountryCode}${row.PhoneNumber}`))
}

function writeNumbers(numbersSet) {
  const data = Array.from(numbersSet).filter(n => /^\d{11,15}$/.test(n)).map(fullNumber => ({
    CountryCode: fullNumber.slice(0, -10),
    PhoneNumber: fullNumber.slice(-10),
  }))
  const sheet = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Group Members')
  XLSX.writeFile(wb, EXCEL_FILE)
  logger.info(`📁 Excel updated with ${data.length} unique numbers.`)
}

module.exports = { readNumbers, writeNumbers }