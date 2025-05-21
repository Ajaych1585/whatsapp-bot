const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')
const logger = require('./logger') // ⬅️ new
require('dotenv').config()

const client = new Client()

const targetGroups = [
  '919948275795-1634459859@g.us',
]

const rideKeywords = ['ride', 'rides', 'need ride', 'looking for ride']
const accomKeywords = ['accommodation', 'room', 'stay', 'need accommodation']

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

  if (containsRide || containsAccom) {
    const grofyyMessage =
      `📍 It looks like you're looking for ride or accommodation options.\n\n` +
      `🚀 Visit 👉 https://www.grofyy.com`

    try {
      await client.sendMessage(privateChatId, grofyyMessage, {
        quotedMessageId: msg.id._serialized,
      })
      logger.info(`📤 Sent private reply to ${contact.number}`)
    } catch (err) {
      logger.error(`❌ Failed to send message to ${contact.number}: ${err.message}`)
    }
  }
})

client.initialize()
