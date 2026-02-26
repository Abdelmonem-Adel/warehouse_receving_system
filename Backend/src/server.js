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

// ===== API Routes =====
app.use('/api', apiRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// ===== Serve Frontend =====
app.use(express.static(path.join(__dirname, '../../Frontend')));

// ===== Frontend Fallback =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/index.html'));
});

// ===== Start Server =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
