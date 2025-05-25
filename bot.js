const qrcode = require('qrcode-terminal')
const { Client, MessageMedia } = require('whatsapp-web.js')
const logger = require('./logger')
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
require('dotenv').config()

const client = new Client()

const EXCEL_FILE = path.join(__dirname, 'group_numbers.xlsx')
const targetGroups = [
  '120363042605788269@g.us', // VVC- Rides -1
  '120363317344029475@g.us', // UNT 2
  '120363149333936680@g.us', // FALL 2025 RIDES
  '120363239707725658@g.us', // Unt ride group 🚥Dallas...
  '120363165473799526@g.us', // 🚗UNT RIDES 🚗
  '120363019899507773@g.us', // UNT Vahamanu 🚘 2
  '120363036982524190@g.us', // UNT accommodation 2021-22
  '120363267232895191@g.us', // Need A Ride? 🆘
  '120363143914086835@g.us', // Rideshare-2 UNT/UTA/UTD
  '120363186937054145@g.us', // UNT Friends
  '120363027033877117@g.us', // UNT 2025 Confirmed
  '120363023171483562@g.us', // UNT RIDE SHARING🚗
  '120363163082195671@g.us', // Texas City || Dallas...
  '120363077579598523@g.us', // University Of North Texas
  '120363170187902889@g.us', // 🚥RIDE _KAVALA🚥🇺🇸
  '120363327881551514@g.us', // Rides(❌❌NO ADS)...
  '120363041171051527@g.us', // UNT Carpool
  '120363022861930726@g.us', // UNT RIDESHARE SPRING22
  '120363022771298069@g.us', // UNT Fall 22
  '120363226913795936@g.us', // Rides 🇮🇳🇺🇸
  '120363170843342983@g.us', // Rides
  '120363230176405064@g.us', // Rides Mania🏁
]

 // Replace with your actual group ID

const rideKeywords = ['ride', 'rides', 'need ride', 'looking for ride', 'want ride', 'commute']
const accomKeywords = ['accommodation', 'room', 'stay', 'need accommodation', 'people', 'male', 'female', 'looking stay','acco']

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

  logger.info('📢 Fetching and printing group names...')

  for (const chat of groupChats) {
    try {
      const fullChat = await client.getChatById(chat.id._serialized)
      const groupName = fullChat.name || '[Unnamed Group]'
      logger.info(`✅ Group: ${groupName}  |  ID: ${fullChat.id._serialized}`)
    } catch (err) {
      logger.error(`❌ Failed to fetch group ${chat.id._serialized}: ${err.message}`)
    }
  }

  logger.info('📝 Bot is listening to selected group(s) and will send private replies for matching keywords.')

  const existingNumbers = readExcelNumbers()

  for (const groupId of targetGroups) {
    try {
      const chat = await client.getChatById(groupId)
      const participants = chat.participants || []

      participants.forEach(p => {
        if (p.id.user) existingNumbers.add(p.id.user)
      })
    } catch (err) {
      logger.error(`❌ Could not fetch participants from ${groupId}: ${err.message}`)
    }
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
