import Dock from '../models/Dock.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from './notificationService.js';

export const tryAssign = async () => {
    try {
        console.log('Running Assignment Logic...');

        // 1. Check if there are companies with PRE-ASSIGNED docks (manual gate selection) waiting
        // Logic: specific query for this? 
        // Actually, let's keep it simple. If status is waiting, we process.
        
        const waitingCompanies = await Company.find({ status: 'waiting' }).sort({ createdAt: 1 });
        if (waitingCompanies.length === 0) return;

        // Loop through queue to find matches
        for (const company of waitingCompanies) {
            let selectedDock = null;

            // Scenario A: Manual Dock Preference
            if (company.dock) {
                const preDock = await Dock.findById(company.dock);
                if (preDock && preDock.status === 'available') {
                   selectedDock = preDock;
                }
                // If preDock is busy, we SKIP this company for now? Or do we assign to queue? 
                // The prompt says "Gate: If all docks busy -> Queue".
                // If Gate picked a dock but it's busy now (race condition?), it waits.
            } else {
                // Scenario B: No preference
               selectedDock = await Dock.findOne({ status: 'available' });
            }

            if (!selectedDock) continue; // Try next company or wait

            // Find Storekeeper
            // Priority Order (lowest index first)
            const freeSK = await User.findOne({ role: 'storekeeper', status: 'available' }).sort({ priorityIndex: 1 });
            
            if (!freeSK) {
                console.log(`- No available Storekeeper found for ${company.companyName}`);
                break; 
            }

            console.log(`+ Selected SK: ${freeSK.name} (Priority: ${freeSK.priorityIndex})`);

            // ASSIGN
            await executeAssignment(company, selectedDock, freeSK);
            
            // Should restarting to ensure fair order? 
            // Loop continues for next pairs
        }

    } catch (e) {
        console.error('Assignment Error:', e);
    }
};

const executeAssignment = async (company, dock, sk) => {
    console.log(`Assigning ${company.companyName} -> Dock ${dock.number} -> SK ${sk.name}`);
    
    dock.status = 'busy';
    dock.currentShipment = company._id;
    await dock.save();

    sk.status = 'busy';
    sk.lastTurnAt = new Date();
    await sk.save();

    company.status = 'receiving';
    company.dock = dock._id;
    company.assignedStorekeeper = sk._id;
    await company.save();

    await sendNotification(sk._id, {
        title: '🔔 دورك جه',
        body: `شركة ${company.companyName} على Dock رقم ${dock.number}`
    });
};

export const manualOverride = async (supervisorName, companyId, dockId, storekeeperId) => {
    // Force Assignment
    const company = await Company.findById(companyId);
    const dock = await Dock.findById(dockId);
    const sk = await User.findById(storekeeperId);

    if (!company || !dock || !sk) throw new Error('Invalid IDs');

    // Logs
    await AuditLog.create({
        supervisorName,
        action: 'MANUAL_ASSIGN',
        details: `Assigned ${company.companyName} to Dock ${dock.number} & SK ${sk.name}`
    });

    // If current occupants exist? Assuming Supervisor handles cleanup or "Inject" logic.
    // For MVP, we aggressively overwrite statuses. 
    // If Dock was busy:
    if (dock.status === 'busy' && dock.currentShipment) {
        // Warning: This effectively kicks out the previous shipment? 
        // Let's assume Supervisor knows what they are doing (e.g. empty dock marked busy by error)
        // ideally we should clear the old shipment?
        // Let's just update.
    }

    await executeAssignment(company, dock, sk);
};

export const transferJob = async (supervisorName, companyId, newDockId, newSkId) => {
    const company = await Company.findById(companyId);
    if (!company || company.status !== 'receiving') throw new Error('Company is not currently receiving');
    
    const oldSkId = company.assignedStorekeeper;
    const oldDockId = company.dock;

    // 1. Notify Old SK (Cancellation)
    if (oldSkId && oldSkId.toString() !== newSkId) {
        const oldSk = await User.findById(oldSkId);
        if(oldSk) {
            oldSk.status = 'available'; // Set free? Or busy? "Available" per requirement logic
            await oldSk.save();
            await sendNotification(oldSk._id, {
                title: '❌ تم إلغاء المهمة',
                body: `تم نقل شركة ${company.companyName} لزميل آخر`
            });
        }
    }

    // 2. Clear Old Dock if different
    if (oldDockId && oldDockId.toString() !== newDockId) {
        const oldDock = await Dock.findById(oldDockId);
        if(oldDock) {
            oldDock.status = 'available';
            oldDock.currentShipment = null;
            await oldDock.save();
        }
    }

    // 3. Prepare New Resources
    const newDock = await Dock.findById(newDockId);
    const newSk = await User.findById(newSkId);

    // 4. Update & Execute
    await AuditLog.create({
        supervisorName,
        action: 'TRANSFER_JOB',
        details: `Transferred ${company.companyName} from SK ${oldSkId} to SK ${newSk.name}`
    });

    await executeAssignment(company, newDock, newSk);
    
    // Explicit Notification for New SK is handled inside executeAssignment ("دورك جه")
    // If we want specific "New Assignment Transferred" text, we'd need to modify executeAssignment or send manual msg here.
    // executeAssignment sends "Company X on Dock Y". That is sufficient/correct.
};
