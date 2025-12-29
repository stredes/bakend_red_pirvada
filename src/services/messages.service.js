const messagesRepo = require('../repositories/messages.repository');
const { normalizeEmail } = require('../utils/normalize');

async function sendMessage(sender, payload) {
  const receiverEmail = normalizeEmail(payload.receiverEmail);
  if (!receiverEmail || !payload.content) {
    throw new Error('Missing fields');
  }

  const message = {
    senderEmail: sender.email,
    senderName: sender.name || '',
    receiverEmail,
    content: payload.content,
    type: payload.type || 'CHAT',
    timestamp: Date.now(),
    participants: [sender.email, receiverEmail]
  };

  return messagesRepo.createMessage(message);
}

async function listInbox(email, page, pageSize) {
  return messagesRepo.listInbox(email, page, pageSize);
}

async function listThread(email, otherEmail, page, pageSize) {
  const all = await messagesRepo.listThread(email, page, pageSize);
  const normalizedOther = normalizeEmail(otherEmail);

  return all.filter(
    (msg) =>
      (msg.senderEmail === email && msg.receiverEmail === normalizedOther) ||
      (msg.senderEmail === normalizedOther && msg.receiverEmail === email)
  );
}

module.exports = { sendMessage, listInbox, listThread };
