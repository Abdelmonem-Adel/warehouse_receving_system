import Dock from '../models/Dock.js';

export const getDocks = async (req, res) => {
    try {
        const docks = await Dock.find().sort({ number: 1 }).populate('currentShipment');
        res.json(docks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleDockStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const dock = await Dock.findById(id);
        if (!dock) return res.status(404).json({ message: 'Dock not found' });
        
        dock.status = status;
        await dock.save();
        res.json(dock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};