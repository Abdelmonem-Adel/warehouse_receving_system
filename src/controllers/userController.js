import User from '../models/User.js';
import Dock from '../models/Dock.js';
import Receipts from '../models/Receipts.js';
import AuditLog from '../models/AuditLog.js';
import { tryAssign, manualOverride, transferJob } from '../services/assignmentService.js';
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
    const { supervisorName, dockId, storekeeperId } = req.body;
    try {
        await manualOverride(supervisorName, dockId, storekeeperId);
        res.json({ message: 'Manual assignment successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const manualReassign = async (req, res) => {
    const { supervisorName, dockId, storekeeperId } = req.body;
    try {
        await transferJob(supervisorName, dockId, storekeeperId);
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
        let activeReceiptId = null;
        if (sk.status === 'busy') {
            const dock = await Dock.findOne({ assignedStorekeeper: sk._id, status: 'busy' });

            // Find the active receipt
            const receipt = await Receipts.findOne({ keeperId: sk._id, status: 'in-progress' }).sort({ createdAt: -1 });

            if (dock || receipt) {
                currentJob = {
                    dock: dock,
                    companyName: receipt ? receipt.companyName : 'Unknown',
                    poNumber: receipt ? receipt.poNumber : '-'
                };
                if (receipt) activeReceiptId = receipt._id;
            }
        }
        res.json({ storekeeper: sk, currentJob, activeReceiptId });
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

        const dock = await Dock.findOne({ assignedStorekeeper: sk._id });

        if (mode === 'dock_only') {
            if (dock) {
                dock.status = 'available';
                dock.assignedStorekeeper = null;
                dock.currentShipment = null;
                await dock.save();
            }
            return res.json({ message: 'Dock released, job continues' });
        }

        if (dock) {
            dock.status = 'available';
            dock.assignedStorekeeper = null;
            dock.currentShipment = null;
            await dock.save();
        }

        sk.status = 'available';
        await sk.save();

        await tryAssign();

        res.json({ message: 'Job finished' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
