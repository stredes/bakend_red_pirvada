const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase');

async function uploadProductImage(file) {
  if (!bucket) {
    throw new Error('Storage bucket not configured');
  }

  const filename = `product_images/${uuidv4()}-${file.originalname}`;
  const storageFile = bucket.file(filename);

  await storageFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype
    },
    public: true
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  return { url: publicUrl, filename };
}

module.exports = { uploadProductImage };
