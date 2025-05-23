const qrcode = require('qrcode-terminal')
const { Client, MessageMedia } = require('whatsapp-web.js')
const logger = require('./logger')
const path = require('path')
require('dotenv').config()

const client = new Client()

const targetGroups = [
  '919948275795-1634459859@g.us',
]

const rideKeywords = ['ride', 'rides', 'need ride', 'looking for ride','want ride']
const accomKeywords = ['accommodation', 'room', 'stay', 'need accommodation', 'people', 'male', 'female','looking stay']

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
})

client.on('message', async msg => {
  if (!targetGroups.includes(msg.from)) return

  const contact = await msg.getContact()
  const text = msg.body.trim().toLowerCase()
  const privateChatId = `${contact.number}@c.us`

  logger.info(`💬 ${contact.pushname || contact.number}: ${text}`)

  const containsRide = rideKeywords.some(keyword => text.includes(keyword))
  const containsAccom = accomKeywords.some(keyword => text.includes(keyword))

  // Determine message type
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
