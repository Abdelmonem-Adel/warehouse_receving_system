import mongoose from 'mongoose';
import { createReceipt } from './src/controllers/storekeeperController.js';
import Dock from './src/models/Dock.js';
import User from './src/models/User.js';
import Company from './src/models/Company.js';
import Receipts from './src/models/Receipts.js';

// Hardcoded URI from .env
const MONGO_URI = 'mongodb+srv://abdelmonem_db:abdelmonem2005@cluster0.ixmzsgc.mongodb.net/receving?appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Setup: Find/Create a Dock and a User
        const TEST_DOCK_NUM = 999;
        let dock = await Dock.findOne({ number: TEST_DOCK_NUM });
        if (!dock) {
            dock = await Dock.create({ number: TEST_DOCK_NUM, status: 'available' });
        } else {
            dock.status = 'available';
            dock.currentShipment = null;
            await dock.save();
        }

        let user = await User.findOne({ username: 'verify_user' });
        if (!user) {
            user = await User.create({ name: 'Verify User', username: 'verify_user', password: '123' });
        }
        await User.findByIdAndUpdate(user._id, { status: 'available' });

        // Ensure no leftover jobs
        await Company.deleteMany({ assignedStorekeeper: user._id });

        console.log('--- Test 1: Create Receipt on Available Dock (Should Success) ---');
        const req1 = {
            user: { id: user._id },
            body: {
                companyName: 'Test Company 1',
                dockNumber: TEST_DOCK_NUM,
                poNumber: 'PO123',
                truckType: 'Trailer'
            }
        };
        
        let status1 = 200;
        const res1 = {
            status: (code) => { 
                status1 = code; 
                return { json: (data) => console.log(`[${code}]`, data) }; 
            },
            json: (data) => console.log(`[${status1}]`, data)
        };
        
        await createReceipt(req1, res1);
        
        if (status1 !== 201 && status1 !== 200) { // createReceipt returns 201 on success
            throw new Error(`Test 1 Failed: Expected 201, got ${status1}`);
        }
        console.log('Test 1 Passed.');

        // Verify Dock is busy
        const dockBusy = await Dock.findOne({ number: TEST_DOCK_NUM });
        if (dockBusy.status !== 'busy') throw new Error('Test 1 Verification Failed: Dock is not busy');

        // --- Test 2: Create Receipt on SAME Dock (Should Fail) ---
        console.log('--- Test 2: Create Concurrent Receipt on Busy Dock (Should Fail) ---');
        const req2 = {
            user: { id: user._id }, 
            body: {
                companyName: 'Test Company 2',
                dockNumber: TEST_DOCK_NUM,
                poNumber: 'PO124',
                truckType: 'Trailer'
            }
        };
        
        let status2 = 200;
        let msg2 = '';
        const res2 = {
            status: (code) => { 
                status2 = code; 
                return { json: (data) => { msg2 = data.message; console.log(`[${code}]`, data); } }; 
            },
            json: (data) => console.log(`[${status2}]`, data)
        };

        await createReceipt(req2, res2);

        if (status2 !== 400 || !msg2.includes('already in use')) {
             throw new Error(`Test 2 Failed: Expected 400 'already in use', got ${status2} '${msg2}'`);
        }
        console.log('Test 2 Passed: Request rejected as expected.');

        // Cleanup
        console.log('--- Cleanup ---');
        await Dock.deleteOne({ number: TEST_DOCK_NUM });
        await User.deleteOne({ username: 'verify_user' });
        await Company.deleteMany({ companyName: { $in: ['Test Company 1', 'Test Company 2'] } });
        await Receipts.deleteMany({ poNumber: { $in: ['PO123', 'PO124'] } });
        console.log('Cleanup Done.');
        
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();
