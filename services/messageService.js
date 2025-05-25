const path = require('path')
const { MessageMedia } = require('whatsapp-web.js')

async function sendAutoReply(client, contact, type, msgId) {
  const privateChatId = `${contact.number}@c.us`

  const config = {
    both: {
      text: `🌐 Looking for both ride and accommodation?\n\nGrofyy has you covered.\n👉 https://www.grofyy.com`,
      image: 'grofyy.jpeg',
    },
    ride: {
      text: `🚗 Looking for a ride?\n\n🛣️ Connect with riders near you.\n👉 https://www.grofyy.com`,
      image: 'grofyyride.jpeg',
    },
    accom: {
      text: `🏠 Looking for a place to stay?\n\n🛏️ Find or post accommodation easily!\n👉 https://www.grofyy.com`,
      image: 'grofyystay.png',
    },
  }

  const { text, image } = config[type] || {}
  const media = MessageMedia.fromFilePath(path.join(__dirname, '..', 'static', image))

  await client.sendMessage(privateChatId, media, {
    caption: text,
    quotedMessageId: msgId,
  })
}

module.exports = { sendAutoReply }
