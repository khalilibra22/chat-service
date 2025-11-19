# Distributed Chat Features - Implementation Summary

## Overview
This document summarizes the distributed chat enhancements implemented in the chat service, including message view tracking and user profile integration.

## Changes Made

### 1. Data Models

#### Message Model (`src/models/message.model.ts`)
- Added `views` field: Array of view records with `userId` and `viewedAt` timestamp
- Added database index for efficient view lookups: `{ _id: 1, "views.userId": 1 }`

#### User Model (`src/models/user.model.ts`) - NEW
- Created new model to cache user profiles from external user service
- Fields:
  - `userId`: Unique user identifier (indexed)
  - `name`: User's display name
  - `profileImageUrl`: URL to profile image
  - `email`: User's email address
  - `metadata`: Additional user data
  - `lastFetchedAt`: Cache timestamp
- Static methods:
  - `upsertProfile()`: Update or insert user profile
  - `findByUserId()`: Find user by userId

### 2. Services

#### User Service (`src/services/user.service.ts`) - NEW
- Integrates with external user service via REST API
- Implements intelligent caching strategy:
  - Fetches profiles from `USER_SERVICE_URL` environment variable
  - Caches profiles in MongoDB for `USER_CACHE_EXPIRY_HOURS` (default: 24)
  - Falls back to stale cache if external service is unavailable
- Key methods:
  - `ensureUserProfile(userId)`: Get or fetch single user profile
  - `ensureUserProfiles(userIds)`: Batch fetch multiple profiles
  - `invalidateUserCache(userId)`: Force refresh on next fetch
  - `updateUserProfile(profile)`: Manually update cache

#### Message Service (`src/services/message.service.ts`)
- Enhanced message creation to automatically fetch and cache user profiles
- Added message enrichment with user profile data
- New view management methods:
  - `markMessageViewed(messageId, userId)`: Mark message as viewed (idempotent)
  - `getMessageViews(messageId)`: Get all view records
  - `hasUserViewedMessage(messageId, userId)`: Check view status
- Private helper methods:
  - `enrichMessageWithProfiles()`: Add user profiles to single message
  - `enrichMessagesWithProfiles()`: Batch enrich multiple messages

### 3. Controllers

#### Message Controller (`src/controllers/message.controller.ts`)
- Added three new endpoints:
  - `markMessageAsViewed()`: PATCH /:messageId/view
  - `getMessageViews()`: GET /:messageId/views
  - `checkMessageViewed()`: GET /:messageId/viewed

### 4. Routes

#### Message Routes (`src/routes/v1/message.routes.ts`)
- Added view management routes:
  - `PATCH /messages/:messageId/view` - Mark message as viewed
  - `GET /messages/:messageId/views` - Get all views for a message
  - `GET /messages/:messageId/viewed` - Check if current user viewed message

### 5. Socket Handlers

#### Private Chat Socket (`src/sockets/privateChat.socket.ts`)
- Added `message-viewed` event handler
- Broadcasts `message-view-updated` event to sender and receiver
- Real-time view status synchronization

#### Group Chat Socket (`src/sockets/groupChat.socket.ts`)
- Added `group-message-viewed` event handler
- Verifies group membership before marking as viewed
- Broadcasts `message-view-updated` event to all group members

### 6. DTOs and Types

#### Message DTO (`src/dtos/message.dto.ts`)
- Added `MessageViewDto` class for view records
- Added `UserProfileDto` class for user profile data
- Extended `MessageDto` with:
  - `views`: Array of view records
  - `senderProfile`: Sender's user profile
  - `receiverProfile`: Receiver's user profile (private messages only)

#### Chat Types (`src/types/chat.types.ts`)
- Added `MessageView` interface
- Added `UserProfile` interface
- Extended `CreateMessageData` with optional `views` field

### 7. Documentation

#### README.md
- Updated features list
- Added environment variable documentation
- Documented new Socket.IO events
- Added REST API endpoint documentation
- Created "Distributed Features" section with:
  - User Profile Integration explanation
  - Message View Tracking features
  - Example message response format

## Environment Variables

New environment variables required:

```env
USER_SERVICE_URL=http://localhost:3001
USER_CACHE_EXPIRY_HOURS=24
```

## API Usage Examples

### REST API

#### Mark Message as Viewed
```bash
curl -X PATCH http://localhost:5002/v1/messages/{messageId}/view \
  -H "Authorization: Bearer {token}"
```

#### Get Message Views
```bash
curl http://localhost:5002/v1/messages/{messageId}/views \
  -H "Authorization: Bearer {token}"
```

### Socket.IO

#### Private Message View
```javascript
socket.emit('message-viewed', {
  messageId: 'messageId123'
});

socket.on('message-view-updated', (data) => {
  console.log(`Message ${data.messageId} viewed by ${data.userId}`);
});
```

#### Group Message View
```javascript
socket.emit('group-message-viewed', {
  messageId: 'messageId123',
  groupId: 'groupId123'
});
```

## Database Schema Changes

### Messages Collection
```javascript
{
  // ... existing fields ...
  views: [
    {
      userId: String,
      viewedAt: Date
    }
  ]
}
```

### Users Collection (New)
```javascript
{
  userId: String,        // indexed, unique
  name: String,
  profileImageUrl: String,
  email: String,         // indexed (sparse)
  metadata: Mixed,
  lastFetchedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
1. **`{ userId: 1 }`** - Unique index for fast user lookups by ID
2. **`{ email: 1 }`** - Sparse index for optional email lookups (future-proofing)
3. **`{ userId: 1, lastFetchedAt: 1 }`** - Compound index optimizing cache validity checks

## Performance Considerations

1. **User Profile Caching**: Reduces external API calls by caching profiles locally
2. **Batch Profile Fetching**: `ensureUserProfiles()` fetches multiple profiles in parallel
3. **Database Indexes**: Optimized indexes for view lookups and user queries
   - **User Model Indexes:**
     - `userId` unique index: Primary lookup for all user queries
     - `email` sparse index: Enables future email-based lookups without indexing null values
     - `userId + lastFetchedAt` compound: Optimizes cache validity checks by combining the two most frequently queried fields
   - **Message Model Indexes:**
     - `_id + views.userId`: Fast lookups for checking if a specific user viewed a message
     - Existing indexes on `chatType`, `senderId`, `receiverId`, `groupId`, and `timestamp`
4. **Idempotent View Marking**: Prevents duplicate view records
5. **Stale Cache Fallback**: Service remains functional even if user service is down

## Testing Recommendations

1. Test user profile fetching and caching
2. Test cache expiry and refresh logic
3. Test fallback to stale cache when user service is unavailable
4. Test view marking idempotency
5. Test real-time view status broadcasts
6. Test batch profile fetching performance
7. Test with missing or invalid user profiles

## Migration Notes

- No database migration required (MongoDB schema is flexible)
- Existing messages will have empty `views` arrays by default
- User profiles will be populated on-demand as messages are created
- Consider pre-populating user cache for active users

## Group Type Classification

### Overview
Groups now support different types to categorize the purpose and nature of each group chat.

### Group Types
- **one-on-one**: Direct one-on-one conversations
- **pre-booking**: Pre-scheduled booking sessions (default)
- **group-lesson**: Group learning sessions
- **live-course**: Live course discussions

### Implementation Details

#### Model Changes (`src/models/group.model.ts`)
- Added `groupType` field with enum validation
- Default value: `pre-booking`
- Allowed values: `one-on-one`, `pre-booking`, `group-lesson`, `live-course`

#### API Changes
- `POST /v1/groups` now accepts optional `groupType` parameter
- If omitted, defaults to `pre-booking`
- Validated against allowed enum values

#### Response Format
```json
{
  "id": "groupId123",
  "name": "Math Study Group",
  "members": ["user1", "user2", "user3"],
  "groupType": "group-lesson"
}
```

## Future Enhancements

1. Add view analytics and reporting
2. Implement message delivery status (sent, delivered, read)
3. Add bulk view marking for conversation threads
4. Implement view notifications/webhooks
5. Add user profile update webhooks from user service
6. Implement profile picture caching/CDN integration
7. Add group type filtering and search capabilities
8. Implement type-specific group features and permissions

