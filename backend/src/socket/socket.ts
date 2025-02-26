import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';

export const initializeSocket = (server: Server): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join study guide room
    socket.on('joinStudyGuide', (studyGuideId: string) => {
      socket.join(`studyGuide:${studyGuideId}`);
      console.log(`Socket ${socket.id} joined room: studyGuide:${studyGuideId}`);
    });

    // Leave study guide room
    socket.on('leaveStudyGuide', (studyGuideId: string) => {
      socket.leave(`studyGuide:${studyGuideId}`);
      console.log(`Socket ${socket.id} left room: studyGuide:${studyGuideId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Define socket event emitters
  const emitStudyGuideCreated = (studyGuide: any) => {
    io.emit('studyGuide:created', studyGuide);
  };

  const emitStudyGuideUpdated = (studyGuideId: string, updatedBy: string, updatedAt: Date) => {
    io.to(`studyGuide:${studyGuideId}`).emit('studyGuide:updated', {
      studyGuideId,
      updatedBy,
      updatedAt
    });
  };

  const emitStudyGuideDeleted = (studyGuideId: string) => {
    io.to(`studyGuide:${studyGuideId}`).emit('studyGuide:deleted', {
      studyGuideId
    });
  };

  const emitStudyGuideUpvoted = (studyGuideId: string, upvotes: number, upvotedBy: string[]) => {
    io.to(`studyGuide:${studyGuideId}`).emit('studyGuide:upvoted', {
      studyGuideId,
      upvotes,
      upvotedBy
    });
  };

  return io;
};

export const socketEvents = {
  STUDY_GUIDE_CREATED: 'studyGuide:created',
  STUDY_GUIDE_UPDATED: 'studyGuide:updated',
  STUDY_GUIDE_DELETED: 'studyGuide:deleted',
  STUDY_GUIDE_UPVOTED: 'studyGuide:upvoted'
};
