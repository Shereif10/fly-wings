/**
 * Fly Wings Academy — Firestore importer
 *
 * Usage:
 *   npm install firebase-admin
 *   node import-firestore.js ./serviceAccount.json
 *
 * Reads every ./json/<collection>.json file and writes the documents
 * into Firestore, preserving the original document IDs.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node import-firestore.js ./serviceAccount.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(keyPath))),
});

const db = admin.firestore();
const jsonDir = path.join(__dirname, 'json');

(async () => {
  const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const collection = file.replace(/\.json$/, '');
    const rows = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`${collection}: skipped (empty)`);
      continue;
    }
    let batch = db.batch();
    let count = 0;
    for (const row of rows) {
      const { id, ...data } = row;
      batch.set(db.collection(collection).doc(String(id)), data);
      count++;
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();
    console.log(`${collection}: imported ${rows.length} documents`);
  }
  console.log('Done.');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
