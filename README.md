# SpeakX Search Quest

A full-stack application built with Next.js and Express.js that enables searching and filtering questions using gRPC communication.

## Features

- 🔍 Real-time search functionality
- 🎯 Filter questions by type (ANAGRAM, MCQ, READ_ALONG, etc.)
- 📱 Responsive design with modern UI components
- 🚀 Server-side rendering with Next.js
- 🔄 gRPC integration for efficient client-server communication
- 📋 Pagination support
- 🎨 Theme customization (light/dark mode)

## Tech Stack

### Frontend
- [Next.js 15.1](https://nextjs.org/)
- [React 19.0](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [NUQS](https://github.com/nuqs/nuqs) for URL search params management

### Backend
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- [gRPC](https://grpc.io/) for client-server communication
- [Protocol Buffers](https://protobuf.dev/)

## Getting Started

### Prerequisites
- Node.js (>=18.x)
- pnpm (package manager)
- MongoDB instance

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/speakx-search-quest.git
cd speakx-search-quest
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

3. Configure environment variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env)
MONGODB_URI=your_mongodb_connection_string
GRPC_PORT=50052
PORT=4000
```

4. Import sample data (optional)
```bash
cd backend
pnpm run importData
```

5. Start the development servers
```bash
# Start backend server
cd backend
pnpm start

# Start frontend development server
cd frontend
pnpm dev
```

The application should now be running at `http://localhost:3000`

## Project Structure

```
.
├── backend/
│   ├── config/         # Database configuration
│   ├── models/         # Mongoose models
│   ├── proto/          # Protocol Buffers definitions
│   ├── scripts/        # Database scripts
│   └── server.js       # Express server setup
├── frontend/
│   ├── src/
│   │   ├── app/       # Next.js pages & layouts
│   │   ├── components/# Reusable components
│   │   ├── features/  # Feature-specific components
│   │   └── lib/       # Utilities and helpers
│   └── public/        # Static assets
```