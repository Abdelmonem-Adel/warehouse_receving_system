import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Resolve __dirname (ES Modules) =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Connect Database =====
connectDB();

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());

// ===== Serve Frontend =====
app.use(express.static(path.join(__dirname, '../public')));

// ===== API Routes =====
app.use('/api', apiRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// ===== Frontend Fallback =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ===== Start Server =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
