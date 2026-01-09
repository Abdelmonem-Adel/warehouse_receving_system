import express from 'express';
import { getDocks, toggleDockStatus } from '../controllers/dockController.js';
import { registerCompany, getQueue, getFullHistory } from '../controllers/companyController.js';
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
    subscribePush 
} from '../controllers/userController.js';

const router = express.Router();

// Docks
router.get('/docks', getDocks);

// Company / Queue
router.post('/companies', registerCompany);
router.get('/queue', getQueue);

// Auth & Users
router.post('/login', login); 
router.get('/users', listUsers); 
router.post('/users', createUser); 
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.post('/storekeepers/:id/status', setBreakStatus); // Toggle Break

// Docks
router.get('/docks', getDocks);
router.post('/docks/:id/status', toggleDockStatus);

// Supervisor
router.post('/supervisor/assign', manualAssign);
router.post('/supervisor/transfer', manualReassign);
router.post('/supervisor/reorder', reorderStorekeepers);
router.get('/storekeepers', getStorekeepers); 
router.get('/history', getFullHistory); // Full Data

// Storekeeper Specific (Keep URLs consistent or update?)
// Let's keep /storekeepers/ for consistency with frontend
router.get('/storekeepers/:id/status', getStorekeeperStatus);
router.post('/storekeepers/:id/finish', finishJob);
router.post('/storekeepers/subscribe', subscribePush);

export default router;
