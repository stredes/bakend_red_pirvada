const uploadsService = require('../services/uploads.service');

async function uploadProduct(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing image' });
  }

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await uploadsService.uploadProductImage(req.file, { baseUrl });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed' });
  }
}

module.exports = { uploadProduct };
