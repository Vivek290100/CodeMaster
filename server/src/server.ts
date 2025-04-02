import express from 'express';
import { connectDB } from './config/database';
import problemRoutes from './routes/problemRoutes';
import cors from "cors"

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); 
app.use(express.json());
app.use('/api/problems', problemRoutes);

const PORT = 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});