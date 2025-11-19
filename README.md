# Chat Service

A real-time chat microservice built with Socket.IO, Express, and MongoDB. Supports private messaging, group chats, and typing indicators.

## Features

- **Private Messaging**: One-on-one real-time chat between users
- **Group Chat**: Multi-user group conversations
- **Typing Indicators**: Real-time typing status for both private and group chats
- **Message View Tracking**: Track which users have viewed each message
- **User Profile Integration**: Cached user profiles from external user service
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

# User Service Integration
USER_SERVICE_URL=http://localhost:3001
USER_CACHE_EXPIRY_HOURS=24
```

**Environment Variable Descriptions:**
- `PORT`: Port number for the chat service
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token verification
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins
- `USER_SERVICE_URL`: Base URL of the external user service for fetching user profiles
- `USER_CACHE_EXPIRY_HOURS`: Number of hours before cached user profiles expire (default: 24)

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
- `message-view-updated`: Receive notification when a message is viewed
  ```javascript
  socket.on('message-view-updated', (data) => {
    console.log(`Message ${data.messageId} viewed by ${data.userId}`);
  });
  ```

**Message View Tracking:**
- `message-viewed`: Mark a message as viewed
  ```javascript
  socket.emit('message-viewed', {
    messageId: 'messageId123'
  });
  ```

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
- `message-view-updated`: Receive notification when a group message is viewed

**Group Message View Tracking:**
- `group-message-viewed`: Mark a group message as viewed
  ```javascript
  socket.emit('group-message-viewed', {
    messageId: 'messageId123',
    groupId: 'groupId123'
  });
  ```

### Future Versions

When new versions are introduced (e.g., `/ws/v2`), they will be documented here. Older versions will be maintained for backward compatibility with a deprecation timeline announced in advance.

## REST API

The service also provides RESTful endpoints for message and group management:

- **Base URL**: `http://localhost:5002/v1`
- **Authentication**: Bearer token in Authorization header

### Endpoints

#### Messages
- `POST /v1/messages/private/:otherUserId`: Send a private message
- `GET /v1/messages/private/:otherUserId`: Get private message history (paginated)
- `POST /v1/messages/group/:groupId`: Send a group message
- `GET /v1/messages/group/:groupId`: Get group message history (paginated)
- `GET /v1/messages/chats`: Get all user chats (private and group)

#### Message Views
- `PATCH /v1/messages/:messageId/view`: Mark a message as viewed by current user
- `GET /v1/messages/:messageId/views`: Get all view records for a message
- `GET /v1/messages/:messageId/viewed`: Check if current user has viewed a message

#### Groups
- `POST /v1/groups`: Create a new group
  - Request body:
    ```json
    {
      "name": "Group Name",
      "members": ["userId1", "userId2"],
      "groupType": "pre-booking"
    }
    ```
  - `groupType` options: `one-on-one`, `pre-booking` (default), `group-lesson`, `live-course`
- `GET /v1/groups`: List user's groups
- Additional group management endpoints available in the routes directory

## Distributed Features

### User Profile Integration

The chat service integrates with an external user service to fetch and cache user profile information. This enables rich message displays with sender/receiver details.

**How it works:**
1. When a message is created, the service automatically fetches user profiles from the configured `USER_SERVICE_URL`
2. User profiles are cached in the local MongoDB database to reduce external API calls
3. Cached profiles expire after `USER_CACHE_EXPIRY_HOURS` (default: 24 hours)
4. If the user service is unavailable, the chat service falls back to stale cache data

**User Profile Data:**
- `userId`: Unique user identifier
- `name`: User's display name
- `profileImageUrl`: URL to user's profile image
- `email`: User's email address
- `metadata`: Additional user metadata

**Message Response Format:**
```json
{
  "id": "messageId123",
  "content": "Hello!",
  "senderId": "user123",
  "receiverId": "user456",
  "timestamp": "2024-01-01T12:00:00Z",
  "senderProfile": {
    "userId": "user123",
    "name": "John Doe",
    "profileImageUrl": "https://example.com/avatar.jpg",
    "email": "john@example.com"
  },
  "receiverProfile": {
    "userId": "user456",
    "name": "Jane Smith",
    "profileImageUrl": "https://example.com/avatar2.jpg",
    "email": "jane@example.com"
  },
  "views": [
    {
      "userId": "user456",
      "viewedAt": "2024-01-01T12:05:00Z"
    }
  ]
}
```

### Message View Tracking

The service tracks which users have viewed each message, enabling read receipts and message status indicators.

**Features:**
- Per-user view tracking with timestamps
- Idempotent view marking (duplicate views are ignored)
- Real-time view status updates via Socket.IO
- REST API endpoints for view management
- Optimized database indexes for fast view lookups

**Use Cases:**
- Read receipts in private chats
- Message status indicators (sent, delivered, read)
- Group message read tracking
- Analytics on message engagement

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
