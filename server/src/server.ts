import express from 'express';
import dotenv from 'dotenv'
import { connectDB } from './config/database';
import problemRoutes from './routes/problemRoutes';
import cors from "cors"

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:4173', credentials: true })); 
app.use(express.json());
app.use('/api/problems', problemRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}); 