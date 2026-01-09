import webpush from 'web-push';
import fs from 'fs';
const vapidKeys = webpush.generateVAPIDKeys();
fs.writeFileSync('keys.json', JSON.stringify(vapidKeys, null, 2));
