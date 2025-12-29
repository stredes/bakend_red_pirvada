/**
 * Configuración de ejemplo para integración con AWS S3
 * Este archivo muestra cómo extender el backend para usar S3
 * 
 * Para usar esta configuración:
 * 1. npm install @aws-sdk/client-s3
 * 2. Configurar variables de entorno en .env
 * 3. Reemplazar la lógica de almacenamiento en server.js
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET = process.env.S3_BUCKET || 'my-images-bucket';

/**
 * Generar URL firmada para subida PUT
 */
async function generatePresignedUploadUrl(filename, contentType) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: `product-images/${filename}`,
    ContentType: contentType
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

/**
 * Generar URL firmada para descarga GET
 */
async function generatePresignedDownloadUrl(filename) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: `product-images/${filename}`
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 }); // 24 horas
  return url;
}

/**
 * Obtener URL pública de S3
 */
function getPublicUrl(filename) {
  return `https://${S3_BUCKET}.s3.amazonaws.com/product-images/${filename}`;
}

/**
 * Subir archivo a S3
 */
async function uploadToS3(filename, fileBuffer, contentType) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: `product-images/${filename}`,
    Body: fileBuffer,
    ContentType: contentType
  });

  try {
    await s3Client.send(command);
    return {
      success: true,
      filename: filename,
      publicUrl: getPublicUrl(filename)
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Eliminar archivo de S3
 */
async function deleteFromS3(filename) {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: `product-images/${filename}`
  });

  try {
    await s3Client.send(command);
    return {
      success: true,
      message: 'Archivo eliminado de S3'
    };
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
}

module.exports = {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  getPublicUrl,
  uploadToS3,
  deleteFromS3
};

/**
 * Ejemplo de uso en server.js:
 * 
 * const s3 = require('./s3-config');
 * 
 * app.post('/upload-url', authenticateToken, async (req, res) => {
 *   const { productoId, mimeType } = req.body;
 *   const filename = `${uuidv4()}.jpg`;
 *   
 *   try {
 *     const uploadUrl = await s3.generatePresignedUploadUrl(filename, mimeType);
 *     const publicUrl = s3.getPublicUrl(filename);
 *     
 *     res.json({
 *       success: true,
 *       uploadUrl,
 *       publicUrl,
 *       filename,
 *       expiresIn: 3600
 *     });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 */
