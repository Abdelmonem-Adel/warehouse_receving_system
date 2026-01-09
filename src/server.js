import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Static Folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Routes placeholders
import apiRoutes from './routes/api.js';
app.use('/api', apiRoutes);

app.get('/api/status', (req, res) => res.json({ status: 'Server is running' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
