# StudySync

StudySync is a collaborative study guide application where users can create, share, and collaborate on study materials. The app features a clean, responsive UI, real-time updates, AI-powered summarization, and flashcard generation.

## Features

- **User Authentication**: Secure login and registration using NextAuth.js
- **Study Guide Creation & Collaboration**: Create and edit study guides with real-time collaboration
- **Upvoting & Ranking System**: Surface the best content through community upvotes
- **AI-Powered Summarization & Flashcard Generation**: Leverage Claude API for intelligent content processing
- **Real-Time Updates**: Instant notifications for new guides, upvotes, and edits
- **Search & Filtering**: Find study guides by subject, keywords, or popularity
- **Responsive UI**: Clean design with dark mode support

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB for data storage
- Socket.io for real-time updates
- JWT for authentication

### Frontend
- React with Next.js
- Tailwind CSS for styling
- NextAuth.js for authentication
- Socket.io client for real-time updates

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Claude API key (for AI features)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/studysync.git
cd studysync
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables

Backend (.env):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studysync
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
CLAUDE_API_KEY=your_claude_api_key_here
FRONTEND_URL=http://localhost:3000
```

Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here
```

4. Start the development servers

**Option 1: Using the convenience scripts (recommended)**

We've provided scripts that automatically find available ports to avoid port conflicts:

Windows:
```bash
# Double-click start-studysync.bat or run:
start-studysync.bat
```

macOS/Linux:
```bash
# Make the script executable first (one-time setup)
chmod +x start-studysync.sh

# Then run:
./start-studysync.sh
```

This will start both the backend and frontend servers using available ports.

**Option 2: Starting servers manually**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

5. Open your browser and navigate to the URL shown in the console (typically `http://localhost:3000` or another port if 3000 is in use)

## Project Structure

```
studysync/
├── backend/                # Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.io setup
│   │   └── utils/          # Utility functions
│   └── server.ts           # Main server file
│
└── frontend/               # Next.js frontend
    ├── public/             # Static assets
    └── src/
        ├── app/            # Next.js app router
        ├── components/     # React components
        ├── lib/            # Utility functions and API client
        └── styles/         # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
