const uploadsService = require('../services/uploads.service');

async function uploadProduct(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing image' });
  }

  try {
    const result = await uploadsService.uploadProductImage(req.file);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Storage bucket not configured') {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Upload failed' });
  }
}

module.exports = { uploadProduct };
