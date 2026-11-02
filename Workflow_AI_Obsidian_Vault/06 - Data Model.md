---
tags:
- database
- firestore
- schema
title: Data Model
---

# 1. Storage decision

The submitted plan specifies Firebase/Firestore and Firebase Storage.
The following is a logical data model; implement it using Firestore
collections/documents unless the team formally changes database
technology.

## 2. Collections

### `users/{userId}`

-   `displayName`
-   `email`
-   `timezone` (IANA string)
-   `createdAt`
-   `updatedAt`
-   `preferences`: theme, workingHours, breakDuration

### `users/{userId}/googleConnections/{connectionId}`

-   `googleEmail`
-   `grantedScopes`
-   `encryptedRefreshToken` --- server-only access
-   `connectedAt`
-   `updatedAt`
-   `status`

Do not expose this collection to client SDK reads. Prefer a separate
server-only credential store if Firestore security rules cannot
guarantee isolation.

### `users/{userId}/notes/{noteId}`

-   `title`
-   `content`
-   `format` (`markdown`)
-   `pinned`
-   `tags` (array or subcollection)
-   `createdAt`
-   `updatedAt`

### `users/{userId}/tasks/{taskId}`

-   `title`
-   `description`
-   `status`
-   `userPriority`
-   `predictedPriority`
-   `priorityScore`
-   `dueAt`
-   `estimatedMinutes`
-   `sourceType` (`manual`, `email`, `note`, `ai`)
-   `sourceReference`
-   `createdAt`
-   `updatedAt`
-   `completedAt`

### `users/{userId}/dailyPlans/{planId}`

-   `planDate`
-   `timezone`
-   `blocks` (array)
-   `assumptions`
-   `conflicts`
-   `modelVersion`
-   `createdAt`
-   `updatedAt`

A block should include `taskId`, `startAt`, `endAt`, `reason`, and
`kind` (`proposed_focus`, `break`, `fixed_event_reference`). Do not
duplicate Google event records as if they were owned calendar events.

### `users/{userId}/activity/{activityId}`

-   `entityType`
-   `entityId`
-   `action`
-   `metadata`
-   `createdAt`

### `users/{userId}/workspaceLinks/{linkId}`

-   `sourceType`
-   `sourceId`
-   `targetType`
-   `targetId`
-   `createdAt`

### `users/{userId}/documents/{documentId}`

-   `fileName`
-   `storagePath`
-   `mimeType`
-   `sizeBytes`
-   `extractionStatus`
-   `createdAt`

## 3. Relationships

-   User owns notes, tasks, plans, documents and preferences.
-   A task may reference an email message or note as its source.
-   A note may link to multiple tasks and source references.
-   A daily plan references tasks and includes read-only calendar event
    references.
-   Google messages/events remain owned by Google; Workflow AI stores
    minimal references, not authoritative copies.

## 4. Data lifecycle

-   Delete or revoke stored Google credentials when the user
    disconnects.
-   Define retention for AI request logs and extracted metadata.
-   Avoid retaining full email bodies.
-   Allow user deletion of notes, tasks, plans and uploaded documents.
-   Keep activity logs minimal and avoid sensitive content.
-   Back up application-owned data according to the deployment plan.

## 5. Firestore security rules

-   Default deny.
-   Users can read/write only their own notes, tasks, plans, preferences
    and documents metadata.
-   Never permit client access to refresh tokens or server secrets.
-   Validate ownership for both ends of workspace links.
-   Validate allowed enum values and basic field types.
-   Use Firebase Admin SDK only on trusted server code.
