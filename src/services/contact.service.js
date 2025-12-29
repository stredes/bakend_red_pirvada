const contactRepo = require('../repositories/contact.repository');
const { normalizeEmail } = require('../utils/normalize');

async function createContact(payload) {
  const message = {
    nombre: payload.nombre.trim(),
    email: normalizeEmail(payload.email),
    mensaje: payload.mensaje.trim(),
    fecha: new Date().toISOString(),
    respondido: false
  };

  return contactRepo.createContactMessage(message);
}

async function listContacts(page, pageSize) {
  return contactRepo.listContactMessages(page, pageSize);
}

async function updateContact(id, respondido) {
  await contactRepo.updateContactMessage(id, { respondido: !!respondido });
  return { success: true };
}

async function deleteContact(id) {
  await contactRepo.deleteContactMessage(id);
  return { success: true };
}

module.exports = { createContact, listContacts, updateContact, deleteContact };
