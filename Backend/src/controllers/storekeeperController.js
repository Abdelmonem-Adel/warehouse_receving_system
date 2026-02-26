import User from '../models/User.js';
import Receipts from '../models/Receipts.js';
import Dock from '../models/Dock.js';
import { tryAssign } from '../services/assignmentService.js';

export const login = async (req, res) => {
    const { username, password } = req.body;
    const sk = await User.findOne({ username });

    if (sk && sk.password === password) {
        res.json(sk);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};


export const createReceipt = async (req, res) => {
    console.log('API: Create Receipt', req.body);
    try {
        const sk = await User.findById(req.user.id).select('name');
        if (!sk) {
            console.error('CreateReceipt: User not found', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        const { companyName, dockNumber, poNumber, truckType, category } = req.body;

        // Find Dock
        const dock = await Dock.findOne({ number: dockNumber });
        if (!dock) {
            return res.status(404).json({ message: `Dock ${dockNumber} not found` });
        }

        if (dock.status === 'busy') {
            return res.status(400).json({ message: `Dock ${dockNumber} is already in use` });
        }

        const receipt = new Receipts({
            keeperName: sk.name,
            keeperId: sk._id,
            companyName,
            dockNumber: dock._id, // Use ID for ref
            poNumber,
            truckType,
            category,
            startedAt: new Date()
        });
        console.log('Attempting to save receipt:', receipt);
        await receipt.save();

        // Update Dock Status
        dock.status = 'busy';
        dock.assignedStorekeeper = sk._id;
        dock.currentShipment = receipt._id;
        await dock.save();

        // Update User status to busy
        await User.findByIdAndUpdate(req.user.id, { status: 'busy' });

        console.log('CreateReceipt: Success', receipt._id);
        res.status(201).json(receipt);
    } catch (error) {
        console.error('CreateReceipt: Error', error);
        res.status(500).json({ message: error.message });
    }
};

export const completeReceipt = async (req, res) => {
    console.log('API: Complete Receipt', req.params.id);
    try {
        const { id } = req.params;
        const { totalItems, cartonNumber, truckNumber, skuNumber, palletNumber, comment, mode } = req.body; // mode: 'full' or 'dock_only'

        const receipt = await Receipts.findById(id);
        if (!receipt) {
            console.error('CompleteReceipt: Receipt NOT FOUND', id);
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Verify the receipt belongs to the logged-in keeper using ID (or name for legacy)
        const currentUserId = req.user.id.toString();
        const receiptKeeperId = receipt.keeperId ? receipt.keeperId.toString() : null;

        let isAuthorized = false;
        if (receiptKeeperId) {
            isAuthorized = (receiptKeeperId === currentUserId);
        } else {
            // Legacy fallback: Fetch user name
            const user = await User.findById(currentUserId);
            isAuthorized = (user && receipt.keeperName === user.name);
        }

        if (!isAuthorized) {
            console.error('CompleteReceipt: Unauthorized', {
                receiptKeeperId,
                receiptKeeperName: receipt.keeperName,
                requestId: currentUserId
            });
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (receipt.status === 'completed') {
            return res.status(400).json({ message: 'Receipt already completed' });
        }

        // --- DOCK ONLY MODE ---
        if (mode === 'dock_only') {
            const dock = await Dock.findOne({ assignedStorekeeper: currentUserId });
            if (dock) {
                console.log(`Releasing Dock ${dock.number} (Dock Only Mode)`);
                dock.status = 'available';
                dock.assignedStorekeeper = null;
                dock.currentShipment = null;
                await dock.save();
            }
            return res.json({ message: 'Dock released, continuing receipt count' });
        }

        // --- FULL COMPLETE MODE ---
        // Relaxed validation: Allow missing or 0 totalItems
        const finalTotalItems = totalItems || 0;

        // Update Receipt data
        receipt.totalItems = finalTotalItems;
        receipt.cartonNumber = cartonNumber || 0;
        receipt.truckNumber = truckNumber || 1;
        receipt.skuNumber = skuNumber || 0;
        receipt.palletNumber = palletNumber || 0;
        receipt.comment = comment || "";
        receipt.endedAt = new Date();
        if (receipt.startedAt) {
            const durationMs = receipt.endedAt - receipt.startedAt;
            receipt.durationMinutes = Math.round(durationMs / 60000);
        }
        receipt.status = 'completed';
        await receipt.save();

        const dock = await Dock.findOne({ assignedStorekeeper: currentUserId });
        if (dock) {
            console.log(`Releasing Dock ${dock.number} (Full Completion)`);
            dock.status = 'available';
            dock.assignedStorekeeper = null;
            dock.currentShipment = null;
            await dock.save();
        }

        // Update User status
        await User.findByIdAndUpdate(currentUserId, { status: 'available' });

        try {
            await tryAssign();
        } catch (assignError) {
            console.error('CompleteReceipt: tryAssign() error (non-fatal)', assignError);
        }

        res.json(receipt);
    } catch (error) {
        console.error('[DEBUG] CompleteReceipt: CRITICAL ERROR', error);
        res.status(500).json({ message: error.message });
    }
};

export const getAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipts.find()
            .sort({ createdAt: -1 })
            .limit(1000)
            .populate('dockNumber');
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
