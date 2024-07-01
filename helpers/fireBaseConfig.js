import { initializeApp } from 'firebase-admin/app';
import pkg from 'firebase-admin';
import fs from 'fs';
const { credential } = pkg;
const serviceAccount = JSON.parse(fs.readFileSync('the-child-and-family-wellness-firebase-adminsdk-vrxxn-45d20c29ff.json'));
const fireBase = initializeApp({
    credential: credential.cert(serviceAccount),
});
export default fireBase