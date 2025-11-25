# Socket.IO API Documentation for Frontend Developers

## Table of Contents

1. [Overview](#overview)
2. [Connection Setup](#connection-setup)
3. [Authentication](#authentication)
4. [Namespaces](#namespaces)
5. [Private Chat Events](#private-chat-events)
6. [Group Chat Events](#group-chat-events)
7. [Data Structures](#data-structures)
8. [Error Handling](#error-handling)
9. [Complete Examples](#complete-examples)
10. [Best Practices](#best-practices)

---

## Overview

This chat service uses Socket.IO for real-time communication. The API supports:

- **Private (1-on-1) Chat**: Direct messaging between two users
- **Group Chat**: Messaging within groups
- **Typing Indicators**: Real-time typing status
- **Message View Tracking**: Track when messages are viewed
- **Versioned API**: Currently supports `/ws/v1` namespace

---

## Connection Setup

### Installation

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Basic Connection

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('https://chat-service-6zak.onrender.com/ws/v1', {
  auth: {
    token: 'your-jwt-token-here'
  },
  transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### Connection Events

```typescript
// Connection successful
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  // Join your personal room after connection
  socket.emit('join');
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Reconnection attempt
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt:', attemptNumber);
});

// Reconnection successful
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

---

## Authentication

Authentication is handled via JWT token in the connection handshake. The token must be provided in the `auth.token` field when connecting.

```typescript
const socket = io('https://chat-service-6zak.onrender.com/ws/v1', {
  auth: {
    token: localStorage.getItem('jwt_token') // or from your auth context
  }
});
```

**Important**: If authentication fails, the connection will be rejected. Ensure your token is valid and not expired.

---

## Namespaces

The service uses versioned namespaces:

- **v1**: `/ws/v1` - Current stable version

All events must be emitted and listened to within the connected namespace.

---

## Private Chat Events

### 1. Join Personal Room

Join your personal room to receive private messages.

```typescript
socket.emit('join');
```

**When to use**: Immediately after successful connection.

---

### 2. Send Private Message

Send a message to another user.

**Emit Event**: `private-message`

```typescript
socket.emit('private-message', {
  to: 'recipient-user-id',
  content: 'Hello, how are you?'
}, (response) => {
  if (response?.error) {
    console.error('Error sending message:', response.error);
  } else {
    console.log('Message sent successfully');
  }
});
```

**Payload**:
```typescript
interface PrivateMessageData {
  to: string;        // Recipient user ID (required)
  content: string;   // Message content (required, max 1000 chars)
}
```

**Callback Response**:
```typescript
{
  error?: string;    // Error message if validation/sending fails
}
```

**Listen Event**: `receive-private-message`

```typescript
socket.on('receive-private-message', (message: MessageDto) => {
  console.log('Received message:', message);
  // Update your UI with the new message
});
```

**Message DTO Structure**:
```typescript
interface MessageDto {
  id?: string;                    // Message ID
  content?: string;               // Message content
  timestamp?: Date;                // When message was sent
  senderId?: string;              // Sender user ID
  receiverId?: string;            // Receiver user ID (for private messages)
  senderProfile?: UserProfileDto;  // Sender profile info
  receiverProfile?: UserProfileDto; // Receiver profile info
  views?: MessageViewDto[];        // Array of users who viewed the message
}

interface UserProfileDto {
  userId?: string;
  name?: string;
  profileImageUrl?: string;
  email?: string;
}

interface MessageViewDto {
  userId?: string;
  viewedAt?: Date;
}
```

---

### 3. Typing Indicators (Private Chat)

#### Start Typing

Notify the recipient that you're typing.

**Emit Event**: `private-typing-start`

```typescript
socket.emit('private-typing-start', {
  to: 'recipient-user-id',
  userName: 'Your Name',  // Optional
  isTyping: true
});
```

**Payload**:
```typescript
interface PrivateTypingData {
  to: string;           // Recipient user ID (required)
  userName?: string;    // Your display name (optional)
  isTyping: boolean;     // Always true for start
}
```

#### Stop Typing

Notify the recipient that you stopped typing.

**Emit Event**: `private-typing-stop`

```typescript
socket.emit('private-typing-stop', {
  to: 'recipient-user-id',
  userName: 'Your Name',  // Optional
  isTyping: false
});
```

**Listen Event**: `receive-private-typing`

```typescript
socket.on('receive-private-typing', (data) => {
  const { userId, userName, isTyping, to } = data;
  
  if (isTyping) {
    // Show typing indicator for this user
    showTypingIndicator(userId, userName);
  } else {
    // Hide typing indicator for this user
    hideTypingIndicator(userId);
  }
});
```

**Typing Data Structure**:
```typescript
interface TypingData {
  userId: string;       // User who is typing
  userName?: string;    // Display name
  isTyping: boolean;    // true = typing, false = stopped
  to: string;           // Your user ID (for private chats)
}
```

**Best Practice**: Use a debounce mechanism to avoid spamming typing events:

```typescript
let typingTimeout: NodeJS.Timeout;

function handleTypingStart(recipientId: string) {
  socket.emit('private-typing-start', { to: recipientId });
  
  // Auto-stop after 3 seconds of inactivity
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('private-typing-stop', { to: recipientId });
  }, 3000);
}
```

---

### 4. Mark Message as Viewed (Private Chat)

Mark a private message as viewed.

**Emit Event**: `message-viewed`

```typescript
socket.emit('message-viewed', {
  messageId: 'message-id-here'
}, (response) => {
  if (response?.error) {
    console.error('Error marking message as viewed:', response.error);
  } else {
    console.log('Message marked as viewed');
  }
});
```

**Payload**:
```typescript
{
  messageId: string;  // Message ID to mark as viewed (required)
}
```

**Callback Response**:
```typescript
{
  success?: boolean;
  message?: MessageDto;
  view?: {
    messageId: string;
    userId: string;
    viewedAt: Date;
  };
  error?: string;
}
```

**Listen Event**: `message-view-updated`

```typescript
socket.on('message-view-updated', (data) => {
  const { messageId, userId, viewedAt } = data;
  // Update UI to show message as viewed by this user
  updateMessageViewStatus(messageId, userId, viewedAt);
});
```

**View Update Data Structure**:
```typescript
{
  messageId: string;   // Message ID
  userId: string;      // User who viewed the message
  viewedAt: Date;      // When the message was viewed
}
```

---

## Group Chat Events

### 1. Join Group Room

Join a group to receive and send group messages.

**Emit Event**: `join-group`

```typescript
socket.emit('join-group', {
  groupId: 'group-id-here'
});
```

**Payload**:
```typescript
{
  groupId: string;  // Group ID to join (required)
}
```

**Important**: 
- You must be a member of the group to join
- If you're not a member, the join will be silently rejected
- Join each group room you want to participate in

---

### 2. Send Group Message

Send a message to a group.

**Emit Event**: `group-message`

```typescript
socket.emit('group-message', {
  groupId: 'group-id-here',
  content: 'Hello everyone!'
}, (response) => {
  if (response?.error) {
    console.error('Error sending group message:', response.error);
  } else {
    console.log('Group message sent successfully');
  }
});
```

**Payload**:
```typescript
interface GroupMessageData {
  groupId: string;   // Group ID (required)
  content: string;    // Message content (required, max 1000 chars)
}
```

**Listen Event**: `receive-group-message`

```typescript
socket.on('receive-group-message', (message: MessageDto) => {
  console.log('Received group message:', message);
  // Update your UI with the new group message
  // message.groupId will contain the group ID
});
```

**Message DTO** (same structure as private messages, but includes `groupId`):
```typescript
interface MessageDto {
  id?: string;
  content?: string;
  timestamp?: Date;
  senderId?: string;
  groupId?: string;              // Group ID (for group messages)
  senderProfile?: UserProfileDto;
  views?: MessageViewDto[];
}
```

---

### 3. Typing Indicators (Group Chat)

#### Start Typing in Group

**Emit Event**: `group-typing-start`

```typescript
socket.emit('group-typing-start', {
  groupId: 'group-id-here',
  userName: 'Your Name',  // Optional
  isTyping: true
});
```

#### Stop Typing in Group

**Emit Event**: `group-typing-stop`

```typescript
socket.emit('group-typing-stop', {
  groupId: 'group-id-here',
  userName: 'Your Name',  // Optional
  isTyping: false
});
```

**Listen Event**: `receive-group-typing`

```typescript
socket.on('receive-group-typing', (data) => {
  const { userId, userName, isTyping, groupId } = data;
  
  if (isTyping) {
    // Show typing indicator for this user in the group
    showGroupTypingIndicator(groupId, userId, userName);
  } else {
    // Hide typing indicator for this user in the group
    hideGroupTypingIndicator(groupId, userId);
  }
});
```

**Group Typing Data Structure**:
```typescript
interface GroupTypingData {
  userId: string;
  userName?: string;
  isTyping: boolean;
  groupId: string;  // Group ID
}
```

---

### 4. Mark Group Message as Viewed

Mark a group message as viewed.

**Emit Event**: `group-message-viewed`

```typescript
socket.emit('group-message-viewed', {
  messageId: 'message-id-here',
  groupId: 'group-id-here'
}, (response) => {
  if (response?.error) {
    console.error('Error marking group message as viewed:', response.error);
  } else {
    console.log('Group message marked as viewed');
  }
});
```

**Payload**:
```typescript
{
  messageId: string;  // Message ID (required)
  groupId: string;     // Group ID (required)
}
```

**Callback Response**:
```typescript
{
  success?: boolean;
  message?: MessageDto;
  error?: string;  // e.g., "User is not a member of the group"
}
```

**Listen Event**: `message-view-updated`

```typescript
socket.on('message-view-updated', (data) => {
  const { messageId, userId, viewedAt, groupId } = data;
  // Update UI to show message as viewed by this user in the group
  updateGroupMessageViewStatus(groupId, messageId, userId, viewedAt);
});
```

**View Update Data Structure** (for group messages):
```typescript
{
  messageId: string;
  userId: string;
  viewedAt: Date;
  groupId?: string;  // Present for group messages
}
```

---

## Data Structures

### Complete TypeScript Interfaces

```typescript
// Private Message Data
interface PrivateMessageData {
  to: string;        // Recipient user ID
  content: string;   // Message content (max 1000 chars)
}

// Group Message Data
interface GroupMessageData {
  groupId: string;  // Group ID
  content: string;  // Message content (max 1000 chars)
}

// Message DTO (received from server)
interface MessageDto {
  id?: string;
  content?: string;
  timestamp?: Date;
  senderId?: string;
  receiverId?: string;    // For private messages
  groupId?: string;        // For group messages
  senderProfile?: {
    userId?: string;
    name?: string;
    profileImageUrl?: string;
    email?: string;
  };
  receiverProfile?: {
    userId?: string;
    name?: string;
    profileImageUrl?: string;
    email?: string;
  };
  views?: Array<{
    userId?: string;
    viewedAt?: Date;
  }>;
}

// Typing Data (Private)
interface PrivateTypingData {
  to: string;
  userName?: string;
  isTyping: boolean;
}

// Typing Data (Group)
interface GroupTypingData {
  groupId: string;
  userName?: string;
  isTyping: boolean;
}

// View Update Data
interface MessageViewUpdate {
  messageId: string;
  userId: string;
  viewedAt: Date;
  groupId?: string;  // Present for group messages
}
```

---

## Error Handling

### Common Error Scenarios

1. **Authentication Failed**
   - Connection will be rejected
   - Check your JWT token validity

2. **Validation Errors**
   - Emitted events with invalid data will return error in callback
   - Always check `response.error` in callbacks

3. **Not a Group Member**
   - Trying to join a group you're not a member of will silently fail
   - Trying to mark a group message as viewed without membership returns error

4. **Message Not Found**
   - Marking a non-existent message as viewed will return error

### Error Handling Pattern

```typescript
socket.emit('private-message', messageData, (response) => {
  if (response?.error) {
    // Handle error
    showErrorNotification(response.error);
    return;
  }
  
  // Success
  console.log('Message sent');
});

// Also handle connection errors
socket.on('connect_error', (error) => {
  if (error.message === 'Invalid or expired token') {
    // Redirect to login or refresh token
    handleAuthError();
  }
});
```

---

## Complete Examples

### React Hook Example

```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseChatSocketProps {
  token: string;
  serverUrl: string;
}

export function useChatSocket({ token, serverUrl }: UseChatSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newSocket = io(`${serverUrl}/ws/v1`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected');
      setIsConnected(true);
      newSocket.emit('join');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected');
      setIsConnected(false);
    });

    // Listen for private messages
    newSocket.on('receive-private-message', (message: MessageDto) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicators
    newSocket.on('receive-private-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    // Listen for view updates
    newSocket.on('message-view-updated', (data) => {
      // Update message view status in your state
      updateMessageViews(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, serverUrl]);

  const sendPrivateMessage = (to: string, content: string) => {
    if (!socket || !isConnected) return;

    socket.emit('private-message', { to, content }, (response) => {
      if (response?.error) {
        console.error('Error:', response.error);
      }
    });
  };

  const markMessageViewed = (messageId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('message-viewed', { messageId }, (response) => {
      if (response?.error) {
        console.error('Error:', response.error);
      }
    });
  };

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    sendPrivateMessage,
    markMessageViewed,
  };
}

// Usage example:
// const { sendPrivateMessage, messages, isConnected } = useChatSocket({
//   token: 'your-jwt-token',
//   serverUrl: 'https://chat-service-6zak.onrender.com'
// });
```

### Vue 3 Composition API Example

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

export function useChatSocket(token: string, serverUrl: string) {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const messages = ref<MessageDto[]>([]);

  onMounted(() => {
    socket.value = io(`${serverUrl}/ws/v1`, {
      auth: { token },
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
      socket.value?.emit('join');
    });

    socket.value.on('receive-private-message', (message: MessageDto) => {
      messages.value.push(message);
    });
  });

  onUnmounted(() => {
    socket.value?.close();
  });

  const sendMessage = (to: string, content: string) => {
    socket.value?.emit('private-message', { to, content });
  };

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
  };
}

// Usage example:
// const { sendMessage, messages, isConnected } = useChatSocket(
//   'your-jwt-token',
//   'https://chat-service-6zak.onrender.com'
// );
```

### Vanilla JavaScript Example

```javascript
const socket = io('https://chat-service-6zak.onrender.com/ws/v1', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join');
});

socket.on('receive-private-message', (message) => {
  console.log('New message:', message);
  // Add message to UI
  addMessageToChat(message);
});

socket.on('receive-private-typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId, data.userName);
  } else {
    hideTypingIndicator(data.userId);
  }
});

// Send a message
function sendMessage(recipientId, content) {
  socket.emit('private-message', {
    to: recipientId,
    content: content
  }, (response) => {
    if (response?.error) {
      alert('Error: ' + response.error);
    }
  });
}

// Join a group
function joinGroup(groupId) {
  socket.emit('join-group', { groupId });
}

// Send group message
function sendGroupMessage(groupId, content) {
  socket.emit('group-message', {
    groupId: groupId,
    content: content
  });
}
```

---

## Best Practices

### 1. Connection Management

- **Reconnect on token refresh**: If your token expires, disconnect and reconnect with a new token
- **Handle connection states**: Show appropriate UI states (connecting, connected, disconnected)
- **Clean up on unmount**: Always close socket connections when component unmounts

```typescript
useEffect(() => {
  const socket = io(serverUrl, { auth: { token } });
  
  return () => {
    socket.close();
  };
}, [token]); // Reconnect if token changes
```

### 2. Typing Indicators

- **Debounce typing events**: Don't emit on every keystroke
- **Auto-stop after inactivity**: Automatically stop typing indicator after 3-5 seconds
- **Clear on message send**: Stop typing indicator when message is sent

```typescript
let typingTimeout: NodeJS.Timeout;
const TYPING_TIMEOUT = 3000;

function handleInputChange(recipientId: string) {
  socket.emit('private-typing-start', { to: recipientId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('private-typing-stop', { to: recipientId });
  }, TYPING_TIMEOUT);
}

function handleSendMessage(recipientId: string) {
  clearTimeout(typingTimeout);
  socket.emit('private-typing-stop', { to: recipientId });
  // Send message...
}
```

### 3. Message View Tracking

- **Mark messages as viewed when visible**: Use Intersection Observer API
- **Batch view updates**: Don't mark every message individually if scrolling quickly
- **Handle view updates**: Update UI when other users view your messages

```typescript
// Using Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const messageId = entry.target.dataset.messageId;
      markMessageViewed(messageId);
    }
  });
}, { threshold: 0.5 });

// Observe message elements
messageElements.forEach(el => observer.observe(el));
```

### 4. Error Handling

- **Always check callbacks**: Check for errors in emit callbacks
- **Handle connection errors**: Implement retry logic for connection failures
- **Validate data before emitting**: Validate on client side before sending

### 5. Performance

- **Limit message history**: Don't keep unlimited message history in memory
- **Virtual scrolling**: Use virtual scrolling for long message lists
- **Debounce rapid events**: Debounce typing and view update events

### 6. Security

- **Never expose tokens**: Keep JWT tokens secure
- **Validate on client**: Client-side validation is for UX, server validates everything
- **Handle token expiration**: Implement token refresh mechanism

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to server
- **Solution**: Check server URL, verify token is valid, check network connectivity

**Problem**: Connection rejected
- **Solution**: Token may be expired or invalid, refresh token and reconnect

### Message Not Received

**Problem**: Messages not appearing
- **Solution**: 
  - Verify you've emitted `join` event after connection
  - Check you're listening to the correct event name
  - Verify recipient has joined their personal room

### Group Messages Not Working

**Problem**: Cannot send/receive group messages
- **Solution**:
  - Verify you've emitted `join-group` with correct groupId
  - Ensure you're a member of the group
  - Check you're listening to `receive-group-message` event

### Typing Indicators Not Showing

**Problem**: Typing indicators not appearing
- **Solution**:
  - Verify you're emitting typing events correctly
  - Check you're listening to the correct event (`receive-private-typing` or `receive-group-typing`)
  - Ensure recipient has joined their room/group

---

## API Versioning

The service uses versioned namespaces. Currently available:

- **v1**: `/ws/v1` - Stable API

When connecting, always specify the namespace:

```typescript
const socket = io('https://chat-service-6zak.onrender.com/ws/v1', { auth: { token } });
```

Future versions will be available at `/ws/v2`, `/ws/v3`, etc.

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify your implementation matches the examples
- Ensure all required fields are provided in event payloads
- Check that you're using the correct namespace version

---

**Last Updated**: 2024
**API Version**: v1

