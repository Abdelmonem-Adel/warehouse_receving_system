import Storekeeper from '../models/Storekeeper.js';
import Dock from '../models/Dock.js';
import Company from '../models/Company.js';
import PushSubscription from '../models/PushSubscription.js';
import { tryAssign } from '../services/assignmentService.js';
import { getPublicKey } from '../services/notificationService.js';

export const login = async (req, res) => {
    const { username, password } = req.body;
    const sk = await Storekeeper.findOne({ username });
    
    if (sk && sk.password === password) {
        res.json(sk);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

export const getStorekeeperStatus = async (req, res) => {
    try {
        const sk = await Storekeeper.findById(req.params.id);
        if (!sk) return res.status(404).json({ message: 'Not found' });

        let currentJob = null;
        if (sk.status === 'busy') {
            currentJob = await Company.findOne({ assignedStorekeeper: sk._id, status: 'receiving' }).populate('dock');
        }
        res.json({ storekeeper: sk, currentJob, vapidKey: getPublicKey() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const finishJob = async (req, res) => {
    const { id } = req.params; // Storekeeper ID
    try {
        const sk = await Storekeeper.findById(id);
        if (!sk) return res.status(404).json({ message: 'Not found' });
        
        if (sk.status !== 'busy') return res.status(400).json({ message: 'Not busy' });

        // Find the job
        const job = await Company.findOne({ assignedStorekeeper: sk._id, status: 'receiving' });
        if (job) {
            job.status = 'finished';
            job.completedAt = new Date();
            await job.save();

            // Free the Dock
            const dock = await Dock.findById(job.dock);
            if (dock) {
                dock.status = 'available';
                dock.currentShipment = null;
                await dock.save();
            }
        }

        // Free the SK
        sk.status = 'available';
        await sk.save();

        // Trigger next assignment
        await tryAssign();

        res.json({ message: 'Job finished' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const subscribePush = async (req, res) => {
    const { storekeeperId, subscription } = req.body;
    try {
        await PushSubscription.findOneAndUpdate(
            { storekeeperId },
            { 
                storekeeperId,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            },
            { upsert: true, new: true }
        );
        res.status(201).json({ message: 'Subscribed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
