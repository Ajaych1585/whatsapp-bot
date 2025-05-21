const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
require('dotenv').config();

// 🟢 WhatsApp client setup
const client = new Client();

// 🎯 Target group(s) to monitor
const targetGroups = [
  '919948275795-1634459859@g.us' // Replace with your actual group ID
];

// 🗝️ Keyword triggers
const rideKeywords = ['ride', 'rides', 'need ride', 'looking for ride'];
const accomKeywords = ['accommodation', 'room', 'stay', 'need accommodation'];

// 📌 Show QR code for WhatsApp login
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// ✅ Once connected
client.on('ready', async () => {
  console.log('✅ WhatsApp bot is ready and connected!\n');

  const chats = await client.getChats();
  const groupChats = chats.filter(chat => chat.isGroup);

  console.log('📢 Available Group Chats:');
  groupChats.forEach(chat => {
    console.log(`Group: ${chat.name}  |  ID: ${chat.id._serialized}`);
  });

  console.log('\n📝 Bot is listening to selected group(s) and will send private replies for matching keywords.\n');
});

// 📩 On message received
client.on('message', async msg => {
  if (!targetGroups.includes(msg.from)) return;

  const contact = await msg.getContact();
  const text = msg.body.trim().toLowerCase();
  const privateChatId = `${contact.number}@c.us`;

  console.log(`💬 ${contact.pushname || contact.number}: ${text}`);

  // 🔍 Check if message contains ride or accommodation keywords
  const containsRide = rideKeywords.some(keyword => text.includes(keyword));
  const containsAccom = accomKeywords.some(keyword => text.includes(keyword));

  if (containsRide || containsAccom) {
    const grofyyMessage =
      `📍 It looks like you're looking for ride or accommodation options.\n\n` +
      `🚀 Visit 👉 https://www.grofyy.com`;

    // 📨 Reply privately with the original group message quoted
    return client.sendMessage(privateChatId, grofyyMessage, {
      quotedMessageId: msg.id._serialized,
    });
  }

  // 🔕 Ignore messages that don't match
});
  
// 🚀 Start the client
client.initialize();
