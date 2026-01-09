import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Dock from '../src/models/Dock.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await Dock.deleteMany();
        await User.deleteMany();
        await Company.deleteMany();

        const docks = [];
        for (let i = 1; i <= 9; i++) {
            docks.push({ number: i, status: 'available' });
        }

        const users = [];
        
        // Admin
        users.push({
            name: 'System Admin',
            username: 'admin',
            password: '123',
            role: 'admin'
        });

        // Supervisor
        users.push({
            name: 'Supervisor 1',
            username: 'sup1',
            password: '123',
            role: 'supervisor'
        });

        // Gate
        users.push({
            name: 'Gate Employee',
            username: 'gate',
            password: '123',
            role: 'gate'
        });

        // Storekeepers
        // for (let i = 1; i <= 8; i++) {
        //     users.push({ 
        //         name: `Storekeeper ${i}`, 
        //         username: `sk${i}`, 
        //         password: '123', 
        //         role: 'storekeeper',
        //         status: 'available',
        //         lastTurnAt: new Date(Date.now() - (i * 10000)),
        //         priorityIndex: i 
        //     });
        // }

        await Dock.insertMany(docks);
        await User.insertMany(users);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
