import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/authRoutes';
import todoRoutes from './routes/todoRoutes';
import { auth } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/todos', auth, todoRoutes); // Apply auth middleware to all todo routes

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 