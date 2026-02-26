import Dock from '../models/Dock.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const tryAssign = async () => {
    try {
        console.log('Running Automatic Assignment logic (Currently Disabled - Manual Only)...');
        return;
    } catch (e) {
        console.error('Assignment Error:', e);
    }
};

const executeAssignment = async (dock, sk) => {
    console.log(`Assigning -> Dock ${dock.number} -> SK ${sk.name}`);
    
    dock.status = 'busy';
    dock.assignedStorekeeper = sk._id;
    await dock.save();

    sk.status = 'busy';
    sk.lastTurnAt = new Date();
    await sk.save();
};

export const manualOverride = async (supervisorName, dockId, storekeeperId) => {
    // Force Assignment
    const dock = await Dock.findById(dockId);
    const sk = await User.findById(storekeeperId);

    if (!dock || !sk) throw new Error('Invalid IDs');

    // Logs
    await AuditLog.create({
        supervisorName,
        action: 'MANUAL_ASSIGN',
        details: `Assigned Dock ${dock.number} to SK ${sk.name}`
    });

    await executeAssignment(dock, sk);
};

export const transferJob = async (supervisorName, newDockId, newSkId) => {
    const newDock = await Dock.findById(newDockId);
    const newSk = await User.findById(newSkId);

    if (!newDock || !newSk) throw new Error('Invalid IDs');

    // 1. Release whoever was on that dock
    if (newDock.assignedStorekeeper) {
        const oldSk = await User.findById(newDock.assignedStorekeeper);
        if (oldSk) {
            oldSk.status = 'available';
            await oldSk.save();
        }
    }

    // 2. Release the new SK from any dock they might have been on
    const existingDock = await Dock.findOne({ assignedStorekeeper: newSk._id });
    if (existingDock) {
        existingDock.status = 'available';
        existingDock.assignedStorekeeper = null;
        await existingDock.save();
    }

    // 3. Update & Execute
    await AuditLog.create({
        supervisorName,
        action: 'TRANSFER_JOB',
        details: `Transferred Dock ${newDock.number} to SK ${newSk.name}`
    });

    await executeAssignment(newDock, newSk);
};
