const qrcode = require('qrcode-terminal')
const { Client, MessageMedia } = require('whatsapp-web.js')
const logger = require('./logger')
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
require('dotenv').config()

const client = new Client()

const EXCEL_FILE = path.join(__dirname, 'group_numbers.xlsx')
const targetGroups = ['120363039394588205@g.us'] // Replace with your actual group ID

const rideKeywords = ['ride', 'rides', 'need ride', 'looking for ride', 'want ride', 'commute']
const accomKeywords = ['accommodation', 'room', 'stay', 'need accommodation', 'people', 'male', 'female', 'looking stay']

function readExcelNumbers() {
  if (!fs.existsSync(EXCEL_FILE)) return new Set()
  const workbook = XLSX.readFile(EXCEL_FILE)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet)
  return new Set(data.map(row => row.Number))
}

function writeExcelNumbers(numbersSet) {
  const data = Array.from(numbersSet)
    .filter(fullNumber => typeof fullNumber === 'string' && /^\d{11,15}$/.test(fullNumber)) // basic validation
    .map(fullNumber => {
      const phoneNumber = fullNumber.slice(-10)
      const countryCode = fullNumber.slice(0, fullNumber.length - 10)
      return {
        CountryCode: countryCode,
        PhoneNumber: phoneNumber,
      }
    })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Group Members')
  XLSX.writeFile(workbook, EXCEL_FILE)
  logger.info(`📁 Excel updated with ${data.length} unique numbers.`)
}

client.on('qr', qr => {
  qrcode.generate(qr, { small: true })
})

client.on('ready', async () => {
  logger.info('✅ WhatsApp bot is ready and connected!')

  const chats = await client.getChats()
  const groupChats = chats.filter(chat => chat.isGroup)

  logger.info('📢 Available Group Chats:')
  groupChats.forEach(chat => {
    logger.info(`Group: ${chat.name}  |  ID: ${chat.id._serialized}`)
  })

  logger.info('📝 Bot is listening to selected group(s) and will send private replies for matching keywords.')

  const existingNumbers = readExcelNumbers()

  for (const groupId of targetGroups) {
    const chat = await client.getChatById(groupId)
    const participants = chat.participants || []

    participants.forEach(p => {
      if (p.id.user) existingNumbers.add(p.id.user)
    })
  }

  writeExcelNumbers(existingNumbers)
})

client.on('group_join', async notification => {
  console.log('👀 group_join event fired')

  const groupId = notification.chatId
  if (!targetGroups.includes(groupId)) {
    console.log('❌ Group not in targetGroups. Skipping.')
    return
  }

  const numbersSet = readExcelNumbers()

  for (const recipientId of notification.recipientIds || []) {
    const number = recipientId.split('@')[0]

    if (!numbersSet.has(number)) {
      numbersSet.add(number)
      logger.info(`➕ New member ${number} added to Excel from group ${groupId}`)
    } else {
      logger.info(`ℹ️ Member ${number} already in Excel.`)
    }
  }

  writeExcelNumbers(numbersSet)
})

client.on('message', async msg => {
  if (!targetGroups.includes(msg.from)) return

  const contact = await msg.getContact()
  const text = msg.body.trim().toLowerCase()
  const privateChatId = `${contact.number}@c.us`

  logger.info(`💬 ${contact.pushname || contact.number}: ${text}`)

  const containsRide = rideKeywords.some(keyword => text.includes(keyword))
  const containsAccom = accomKeywords.some(keyword => text.includes(keyword))

  let matchedType = ''
  if (containsRide && containsAccom) matchedType = 'both'
  else if (containsRide) matchedType = 'ride'
  else if (containsAccom) matchedType = 'accom'

  logger.info(`📌 Matched type: ${matchedType}`)

  if (matchedType) {
    let messageText = ''
    let imageName = ''

    if (matchedType === 'both') {
      messageText =
        `🌐 Looking for both ride and accommodation?\n\n` +
        `Grofyy has you covered for everything.\n👉 https://www.grofyy.com`
      imageName = 'grofyy.jpeg'
    } else if (matchedType === 'ride') {
      messageText =
        `🚗 Looking for a ride?\n\n` +
        `🛣️ Connect with riders near you.\n👉 https://www.grofyy.com`
      imageName = 'grofyyride.jpeg'
    } else if (matchedType === 'accom') {
      messageText =
        `🏠 Looking for a place to stay?\n\n` +
        `🛏️ Find or post accommodation easily!\n👉 https://www.grofyy.com`
      imageName = 'grofyystay.png'
    }

    try {
      const imagePath = path.join(__dirname, 'static', imageName)
      const media = MessageMedia.fromFilePath(imagePath)

      await client.sendMessage(privateChatId, media, {
        caption: messageText,
        quotedMessageId: msg.id._serialized,
      })

      logger.info(`📤 Sent private reply with ${imageName} to ${contact.number}`)
    } catch (err) {
      logger.error(`❌ Failed to send message to ${contact.number}: ${err.message}`)
    }
  }
})

client.initialize()
