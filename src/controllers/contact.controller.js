const contactService = require('../services/contact.service');

async function createContact(req, res) {
  const { nombre, email, mensaje } = req.body;
  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const result = await contactService.createContact(req.body);
  return res.status(201).json(result);
}

async function listContacts(req, res) {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const messages = await contactService.listContacts(page, pageSize);
  return res.json({ messages });
}

async function updateContact(req, res) {
  const result = await contactService.updateContact(req.params.id, req.body.respondido);
  return res.json(result);
}

async function deleteContact(req, res) {
  const result = await contactService.deleteContact(req.params.id);
  return res.json(result);
}

module.exports = { createContact, listContacts, updateContact, deleteContact };
