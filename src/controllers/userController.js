import User from '../models/User.js';
import Dock from '../models/Dock.js';
import Company from '../models/Company.js';
import PushSubscription from '../models/PushSubscription.js';
import AuditLog from '../models/AuditLog.js';
import { tryAssign, manualOverride } from '../services/assignmentService.js';
import { getPublicKey } from '../services/notificationService.js';

import jwt from 'jsonwebtoken';

export const login = async (req, res) => {


    const username = req.body.username ? req.body.username.trim() : null;
    const password = req.body.password ? req.body.password.trim() : null;

    if (!username || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    
    const user = await User.findOne({ username });
    console.log('DB USER FOUND:', user ? user.username : 'NULL');

    if (!user) {
        console.log('FAIL: User not found');
        return res.status(401).json({ message: 'Invalid credentials' });
    }

   
    if (String(user.password) !== String(password)) {
        console.log('FAIL: Password mismatch');
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('SUCCESS: Login valid');
    const token = jwt.sign(
        {
          id: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          role: user.role
        }
    });

    
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

        // If trying to take a break while busy
        if (status === 'break' && sk.status === 'busy') {
            // Allow break BUT keep status busy? Or Fail?
            // User requirement: "Resume work (status='busy', onBreak=false)" implies a "Break while Busy" state might exist?
            // Or maybe "Resume" is just "Back to work".
            // Let's stick to standard behavior: Cannot break while busy active job.
            // BUT if they are "BusyNoJob" (released dock)?
            return res.status(400).json({ message: 'Cannot go to break while busy.' });
        }

        sk.status = status;
        sk.onBreak = (status === 'break');
        await sk.save();

        if (status === 'available') await tryAssign();

        res.json(sk);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resumeWork = async (req, res) => {
    const { id } = req.params;
    try {
        const sk = await User.findById(id);
        if (!sk) return res.status(404).json({ message: 'Not found' });

        // Requirement: status = 'busy', onBreak = false
        sk.status = 'busy';
        sk.onBreak = false;
        await sk.save();

        // Should we trigger tryAssign? 
        // If they became busy, they are NOT available for new tasks.
        // So NO tryAssign.

        res.json({ message: 'Resumed work (Busy)' });
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
        
        if (mode === 'dock_only') {
            if (job && job.dock) {
                const dock = await Dock.findById(job.dock);
                if (dock) {
                    dock.status = 'available';
                    dock.currentShipment = null;
                    await dock.save();
                }
                // IMPORTANT: disassociate dock so we don't accidentally free it again later if reassigned
                job.dock = null;
                await job.save();
            }
            // Job stays 'receiving', SK stays 'busy'
            return res.json({ message: 'Dock released, job continues' });
        }

        // Normal Finish (or cleanup if job lost)
        if (job) {
            job.status = 'finished';
            job.completedAt = new Date();
            job.finishedAt = new Date();
            
            // Free dock if still held
            if (job.dock) {
                const dock = await Dock.findById(job.dock);
                if (dock) {
                    dock.status = 'available';
                    dock.currentShipment = null;
                    await dock.save();
                }
            }
            await job.save();
        }

        sk.status = 'available';
        await sk.save();

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


