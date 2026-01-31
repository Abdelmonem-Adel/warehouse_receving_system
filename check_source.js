import fs from 'fs';
import path from 'path';

const filesToCheck = [
    'src/server.js',
    'src/routes/api.js',
    'src/controllers/storekeeperController.js',
    'src/controllers/userController.js',
    'public/storekeepper.js',
    'public/supervisor.js'
];

filesToCheck.forEach(file => {
    try {
        const stats = fs.statSync(file);
        console.log(`${file}: ${stats.size} bytes`);
    } catch (err) {
        console.error(`${file}: ERROR - ${err.message}`);
    }
});
