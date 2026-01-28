import express from 'express';
import { getDocks, toggleDockStatus } from '../controllers/dockController.js';
import { 
    login, 
    createUser, 
    updateUser,
    deleteUser,
    listUsers,
    manualAssign,
    manualReassign,
    reorderStorekeepers,
    getStorekeepers,
    getStorekeeperStatus, 
    setBreakStatus,
    finishJob, 
    subscribePush,
    resumeWork,
} from '../controllers/userController.js';
import { createReceipt, completeReceipt, getAllReceipts } from '../controllers/storekeeperController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';


const router = express.Router();


// Auth & Users
router.post('/login', login); 
router.get('/users',authMiddleware, roleMiddleware('admin'), listUsers); 
router.post('/users',authMiddleware, roleMiddleware('admin'), createUser); 
router.put('/users/:id',authMiddleware, roleMiddleware('admin'), updateUser);
router.delete('/users/:id',authMiddleware, roleMiddleware('admin'), deleteUser);

router.post('/storekeepers/:id/status',authMiddleware, roleMiddleware('storekeeper'), setBreakStatus); // Toggle Break

// Docks'
router.get('/docks',authMiddleware,roleMiddleware(['supervisor', 'gate']),getDocks);
router.post('/docks/:id/status',authMiddleware,roleMiddleware(['supervisor', 'gate']),toggleDockStatus);

// Supervisor
router.post('/supervisor/assign',authMiddleware, roleMiddleware('supervisor'), manualAssign);
router.post('/supervisor/transfer',authMiddleware, roleMiddleware('supervisor'), manualReassign);
router.post('/supervisor/reorder',authMiddleware, roleMiddleware('supervisor'), reorderStorekeepers);
router.get('/storekeepers',authMiddleware, roleMiddleware('supervisor'), getStorekeepers); 

// Let's keep /storekeepers/ for consistency with frontend
router.get('/storekeepers/:id/status',authMiddleware, roleMiddleware('storekeeper'), getStorekeeperStatus);
router.post('/storekeepers/:id/finish',authMiddleware, roleMiddleware('storekeeper'), finishJob);
router.post('/storekeepers/:id/resume',authMiddleware, roleMiddleware('storekeeper'), resumeWork);
router.post('/storekeepers/subscribe',authMiddleware, roleMiddleware('storekeeper'), subscribePush);

// Receipts
router.post('/receipts',authMiddleware, roleMiddleware('storekeeper'), createReceipt);
router.put('/receipts/:id/complete',authMiddleware, roleMiddleware('storekeeper'), completeReceipt);
router.get('/receipts',authMiddleware, roleMiddleware('supervisor'), getAllReceipts);

// API 404 Handler
router.use((req, res) => {
    console.warn(`API 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `API Route not found: ${req.method} ${req.url}` });
});

export default router;
