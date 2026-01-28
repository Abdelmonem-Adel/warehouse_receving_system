// import Company from '../models/Company.js';
// import { tryAssign } from '../services/assignmentService.js';

// export const registerCompany = async (req, res) => {
//     const { companyName, invoiceNumber, invoiceImage, dockId } = req.body;
//     try {
//         const company = await Company.create({
//             companyName,
//             invoiceNumber,
//             invoiceImage,
//             status: 'waiting',
//             dock: dockId || null,
//             startedAt: dockId ? new Date() : null
//         });
        
//         await tryAssign();

//         res.status(201).json(company);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// export const getQueue = async (req, res) => {
//     try {
//         const queue = await Company.find({ status: 'waiting' }).populate('dock').sort({ createdAt: 1 });
//         res.json(queue);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// export const getFullHistory = async (req, res) => {
//     try {
//          const waiting = await Company.find({ status: 'waiting' }).populate('dock');
//          const receiving = await Company.find({ status: 'receiving' }).populate('dock').populate('assignedStorekeeper');
//          const finished = await Company.find({ status: 'finished' }).populate('dock').populate('assignedStorekeeper').sort({ completedAt: -1 }).limit(50);
         
//          res.json({ waiting, receiving, finished });
//     } catch (error) {
//          res.status(500).json({ message: error.message });
//     }
// };
