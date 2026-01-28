// import webpush from 'web-push';
// import PushSubscription from '../models/PushSubscription.js';
// import fs from 'fs';

// import 'dotenv/config';

// let vapidKeys = {
//     publicKey: process.env.VAPID_PUBLIC_KEY,
//     privateKey: process.env.VAPID_PRIVATE_KEY
// };

// try {
//     if (vapidKeys.publicKey && vapidKeys.privateKey) {
//         console.log('VAPID Keys loaded from Environment.');
//     } else {
//         // Fallback to keys.json
//         if (fs.existsSync('keys.json')) {
//              const data = fs.readFileSync('keys.json');
//              vapidKeys = JSON.parse(data);
//              console.log('VAPID Keys loaded from keys.json');
//         } else {
//              throw new Error('Missing Keys');
//         }
//     }

//     if (vapidKeys.publicKey && vapidKeys.privateKey) {
//         webpush.setVapidDetails(
//             'mailto:admin@example.com',
//             vapidKeys.publicKey,
//             vapidKeys.privateKey
//         );
//     }
// } catch (error) {
//     console.warn('Warning: VAPID Keys not found. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY in .env or ensure keys.json exists.');
// }


// export const sendNotification = async (storekeeperId, payload) => {
//     try {
//         if (!vapidKeys.publicKey) return;

//         const sub = await PushSubscription.findOne({ storekeeperId });
//         if (!sub) return;

//         const pushConfig = {
//             endpoint: sub.endpoint,
//             keys: sub.keys
//         };

//         await webpush.sendNotification(pushConfig, JSON.stringify(payload));
//     } catch (error) {
//         console.error('Error sending notification:', error);
//     }
// };

// export const getPublicKey = () => {
//     return vapidKeys.publicKey;
// };
