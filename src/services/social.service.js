const socialRepo = require('../repositories/social.repository');
const { normalizeEmail } = require('../utils/normalize');

async function createRequest(sender, receiverEmail) {
  const normalizedReceiver = normalizeEmail(receiverEmail);
  if (!normalizedReceiver) {
    throw new Error('Missing receiverEmail');
  }

  const request = {
    senderEmail: sender.email,
    senderName: sender.name || '',
    receiverEmail: normalizedReceiver,
    status: 'PENDIENTE',
    timestamp: Date.now()
  };

  return socialRepo.createFriendRequest(request);
}

async function listIncoming(email) {
  return socialRepo.listIncomingRequests(email);
}

async function listOutgoing(email) {
  return socialRepo.listOutgoingRequests(email);
}

async function acceptRequest(id, receiverEmail) {
  const request = await socialRepo.getRequestById(id);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.receiverEmail !== receiverEmail) {
    throw new Error('Forbidden');
  }

  await socialRepo.updateRequest(id, { status: 'ACEPTADA' });
  await socialRepo.createFriendPairs([
    { userEmail: request.senderEmail, friendEmail: request.receiverEmail },
    { userEmail: request.receiverEmail, friendEmail: request.senderEmail }
  ]);

  return { success: true };
}

async function rejectRequest(id, receiverEmail) {
  const request = await socialRepo.getRequestById(id);
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.receiverEmail !== receiverEmail) {
    throw new Error('Forbidden');
  }

  await socialRepo.updateRequest(id, { status: 'RECHAZADA' });
  return { success: true };
}

async function listFriends(email) {
  return socialRepo.listFriends(email);
}

module.exports = {
  createRequest,
  listIncoming,
  listOutgoing,
  acceptRequest,
  rejectRequest,
  listFriends
};
