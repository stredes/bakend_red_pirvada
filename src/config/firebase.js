const fs = require('fs');
const admin = require('firebase-admin');
const {
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_SERVICE_ACCOUNT_JSON,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = require('./env');

function loadServiceAccount() {
  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const credentialsPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Firebase credentials file not found at ${credentialsPath}`);
    }
    return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  }

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, ' +
        'GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
    );
  }

  return {
    project_id: FIREBASE_PROJECT_ID,
    client_email: FIREBASE_CLIENT_EMAIL,
    private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_STORAGE_BUCKET || undefined
  });
}

const db = admin.firestore();
const bucket = FIREBASE_STORAGE_BUCKET ? admin.storage().bucket() : null;

module.exports = { admin, db, bucket };
