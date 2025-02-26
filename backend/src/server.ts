import express, { Express, Request, Response } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Import routes
import userRoutes from './routes/userRoutes';
import studyGuideRoutes from './routes/studyGuideRoutes';

// Import socket.io initialization
import { initializeSocket } from './socket/socket';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studysync')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error: Error) => {
    console.error('MongoDB connection error:', error);
  });


// Make io available to our routes
app.set('io', io);

// API routes
app.get('/', (req: Request, res: Response) => {
  res.send('StudySync API is running');
});

// Use route files
app.use('/api/users', userRoutes);
app.use('/api/study-guides', studyGuideRoutes);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - Ready for connections`);
});

// Export for testing purposes
export { app, server, io };
