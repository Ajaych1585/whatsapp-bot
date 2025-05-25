const { Client, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const logger = require('./logger')
const path = require('path')
require('dotenv').config()

const targetGroups = require('./config/groups')
const { readNumbers, writeNumbers } = require('./services/excelService')
const { matchType } = require('./utils/keywordMatcher')
const { sendAutoReply } = require('./services/messageService')

const client = new Client()

client.on('qr', qr => qrcode.generate(qr, { small: true }))

client.on('qr', qr => qrcode.generate(qr, { small: true }))

client.on('ready', async () => {
  logger.info('✅ Bot is ready!')
  const existingNumbers = readNumbers()

  // ✅ Show all group names the bot is part of
  const chats = await client.getChats()
  const groupChats = chats.filter(chat => chat.isGroup)

  logger.info('📢 Available Groups:')
  for (const chat of groupChats) {
    const groupName = chat.name || '[Unnamed Group]'
    const groupId = chat.id._serialized
    logger.info(`✅ Group: ${groupName} | ID: ${groupId}`)
  }

  // ✅ Proceed with extracting users from only targetGroups
  for (const groupId of targetGroups) {
    try {
      const chat = await client.getChatById(groupId)
      for (const p of chat.participants || []) {
        if (p.id.user) existingNumbers.add(p.id.user)
      }
    } catch (err) {
      logger.error(`❌ ${groupId}: ${err.message}`)
    }
  }

  writeNumbers(existingNumbers)
})


client.on('group_join', async notification => {
  logger.info('👀 group_join event fired')
  if (!targetGroups.includes(notification.chatId)) return
  const numbers = readNumbers()

  for (const id of notification.recipientIds || []) {
    const num = id.split('@')[0]
    if (!numbers.has(num)) {
      numbers.add(num)
      logger.info(`➕ New member ${num} added to Excel from group ${notification.chatId}`)
    } else {
      logger.info(`ℹ️ Member ${num} already in Excel.`)
    }
  }

  writeNumbers(numbers)
})

client.on('message', async msg => {
  if (!targetGroups.includes(msg.from)) return
  const contact = await msg.getContact()
  const type = matchType(msg.body)
  if (type) {
    try {
      await sendAutoReply(client, contact, type, msg.id._serialized)
      logger.info(`📤 Sent ${type} message to ${contact.number}`)
    } catch (err) {
      logger.error(`❌ ${contact.number}: ${err.message}`)
    }
  }
})

client.initialize()
