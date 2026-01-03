const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase');

async function uploadProductImage(file, { baseUrl } = {}) {
  const filename = `${uuidv4()}-${file.originalname}`;

  if (bucket) {
    const storagePath = `product_images/${filename}`;
    const storageFile = bucket.file(storagePath);

    await storageFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype
      },
      public: true
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    return { url: publicUrl, filename: storagePath };
  }

  const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, file.buffer);

  const origin = baseUrl || '';
  const publicUrl = `${origin}/uploads/${encodeURIComponent(filename)}`;
  return { url: publicUrl, filename };
}

module.exports = { uploadProductImage };
