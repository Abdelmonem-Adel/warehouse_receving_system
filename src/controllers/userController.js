import User from '../models/User.js';
import Dock from '../models/Dock.js';
import Company from '../models/Company.js';
import PushSubscription from '../models/PushSubscription.js';
import AuditLog from '../models/AuditLog.js';
import { tryAssign, manualOverride } from '../services/assignmentService.js';
import { getPublicKey } from '../services/notificationService.js';

// Auth
export const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (user && user.password === password) {
        res.json(user);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

// Admin
export const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // prevent update if plain password implementation causes issues? we just update fields sent
        const updated = await User.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const listUsers = async (req, res) => {
    const users = await User.find().sort({ role: 1 });
    res.json(users);
};

// Supervisor
export const manualAssign = async (req, res) => {
    const { supervisorName, companyId, dockId, storekeeperId } = req.body;
    try {
        await manualOverride(supervisorName, companyId, dockId, storekeeperId);
        res.json({ message: 'Manual assignment successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const manualReassign = async (req, res) => {
    const { supervisorName, companyId, dockId, storekeeperId } = req.body;
    try {
        // Check local import or export manualReassign? It's in assignmentService called transferJob
        // I need to import transferJob first.
        const { transferJob } = await import('../services/assignmentService.js');
        await transferJob(supervisorName, companyId, dockId, storekeeperId);
        res.json({ message: 'Job Re-assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reorderStorekeepers = async (req, res) => {
    const { order } = req.body; 
    try {
        for (let i = 0; i < order.length; i++) {
            await User.findByIdAndUpdate(order[i], { priorityIndex: i + 1 });
        }
        res.json({ message: 'Order updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStorekeepers = async (req, res) => {
    const sks = await User.find({ role: 'storekeeper' }).sort({ priorityIndex: 1 });
    res.json(sks);
};

// Storekeeper Specific
export const getStorekeeperStatus = async (req, res) => {
    try {
        const sk = await User.findById(req.params.id);
        if (!sk) return res.status(404).json({ message: 'Not found' }); // User might be deleted

        let currentJob = null;
        if (sk.status === 'busy') {
            currentJob = await Company.findOne({ assignedStorekeeper: sk._id, status: 'receiving' }).populate('dock');
        }
        res.json({ storekeeper: sk, currentJob, vapidKey: getPublicKey() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setBreakStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'available' or 'break'
    
    try {
        const sk = await User.findById(id);
        if (!sk) return res.status(404).json({ message: 'Not found' });

        if (sk.status === 'busy') {
            return res.status(400).json({ message: 'Cannot go entirely to break while busy (Finish job first)' });
        }

        sk.status = status;
        await sk.save();

        if (status === 'available') await tryAssign();

        res.json(sk);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const finishJob = async (req, res) => {
    const { id } = req.params; 
    const { mode } = req.body; 

    try {
        const sk = await User.findById(id);
        if (!sk) return res.status(404).json({ message: 'Not found' });
        
        await AuditLog.create({
            supervisorName: sk.name, 
            action: 'FINISH_JOB',
            details: `Finished job with mode: ${mode}`
        });

        const job = await Company.findOne({ assignedStorekeeper: sk._id, status: 'receiving' });
        if (job) {
            job.status = 'finished';
            job.completedAt = new Date();
            await job.save();

            const dock = await Dock.findById(job.dock);
            if (dock) {
                dock.status = 'available';
                dock.currentShipment = null;
                await dock.save();
            }
        }

        if (mode === 'dock_only') {
            // Keep SK Busy (Conceptually). 
            // In DB they are still 'busy'.
            // They need to click "Available" (handled by setBreakStatus logic or similar?)
            // Or we just leave them 'busy'.
            // Storekeeper UI "Become Available" uses setBreakStatus('available') or similar?
            // Wait, previous V3 logic relied on User seeing "Busy" screen and clicking "Become Available".
            // We should reuse setBreakStatus('available') for that button logic now.
        } else {
            sk.status = 'available';
            await sk.save();
        }

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
