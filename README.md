# Chat Service

A real-time chat microservice built with Socket.IO, Express, and MongoDB. Supports private messaging, group chats, and typing indicators.

## Features

- **Private Messaging**: One-on-one real-time chat between users
- **Group Chat**: Multi-user group conversations
- **Typing Indicators**: Real-time typing status for both private and group chats
- **JWT Authentication**: Secure socket connections with JWT tokens
- **Versioned API**: Socket.IO namespaces for API versioning
- **RESTful Endpoints**: HTTP API for message and group management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- JWT_SECRET environment variable

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/chat-service
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Socket.IO Namespaces

The service uses versioned Socket.IO namespaces to allow independent evolution of the API. Each namespace represents a different protocol version.

### Available Namespaces

- **`/ws/v1`**: Initial API version with private and group chat support

### Client Connection

To connect to a specific namespace version:

```javascript
import { io } from 'socket.io-client';

// Connect to v1 namespace
const socket = io('https://your-server.com/ws/v1', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to chat service');
});
```

### Authentication

All socket connections require JWT authentication. Pass your token in the `auth` object when connecting:

```javascript
const socket = io('https://your-server.com/ws/v1', {
  auth: {
    token: yourJwtToken
  }
});
```

### Events (v1)

#### Private Chat

**Client → Server:**
- `join`: Join your personal room
- `private-message`: Send a private message
  ```javascript
  socket.emit('private-message', {
    to: 'recipientUserId',
    content: 'Hello!'
  });
  ```
- `private-typing-start`: Notify recipient you're typing
- `private-typing-stop`: Notify recipient you stopped typing

**Server → Client:**
- `receive-private-message`: Receive a private message
- `receive-private-typing`: Receive typing status updates

#### Group Chat

**Client → Server:**
- `join-group`: Join a group room
  ```javascript
  socket.emit('join-group', {
    groupId: 'groupId123'
  });
  ```
- `group-message`: Send a message to a group
  ```javascript
  socket.emit('group-message', {
    groupId: 'groupId123',
    content: 'Hello everyone!'
  });
  ```
- `group-typing-start`: Notify group you're typing
- `group-typing-stop`: Notify group you stopped typing

**Server → Client:**
- `receive-group-message`: Receive a group message
- `receive-group-typing`: Receive typing status updates from group members

### Future Versions

When new versions are introduced (e.g., `/ws/v2`), they will be documented here. Older versions will be maintained for backward compatibility with a deprecation timeline announced in advance.

## REST API

The service also provides RESTful endpoints for message and group management:

- **Base URL**: `http://localhost:5002/v1`
- **Authentication**: Bearer token in Authorization header

### Endpoints

- `GET /messages`: Retrieve messages
- `POST /groups`: Create a new group
- `GET /groups`: List groups
- Additional endpoints available in the routes directory

## Architecture

### Directory Structure

```
src/
├── app/           # Application setup and configuration
├── config/        # Database and service configuration
├── controllers/   # HTTP request handlers
├── dtos/          # Data transfer objects
├── models/        # MongoDB models
├── routes/        # REST API routes (versioned)
├── services/      # Business logic layer
├── sockets/       # Socket.IO handlers (versioned namespaces)
├── types/         # TypeScript type definitions
├── utils/         # Middleware and utilities
└── validations/   # Input validation schemas
```

### Versioning Strategy

The service uses namespace-based versioning for Socket.IO connections:

- Each version has its own namespace (e.g., `/ws/v1`, `/ws/v2`)
- Clients connect to the namespace matching their supported version
- Authentication middleware is applied per-namespace
- Handlers can be shared or version-specific as needed
- Old versions can be deprecated gradually with advance notice

To add a new version, update `src/sockets/namespaces.ts` with the new version configuration.

## Development

### Project Structure

- **TypeScript**: The project is written in TypeScript and compiled to JavaScript
- **MongoDB**: Uses Mongoose for database operations
- **Socket.IO**: Real-time bidirectional communication
- **Express**: RESTful API endpoints

### Building

```bash
npm run build
```

Compiled output will be in the `dist/` directory.

## License

This project is part of the E-Learning Platform Project.
