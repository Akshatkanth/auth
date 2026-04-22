# MongoDB Schema

## User Collection

Collection name: `users`

Fields:

- `email` (String, required, unique, lowercase, trimmed)
- `passwordHash` (String, required)
- `role` (String enum: `user` | `admin`, default: `user`)
- `refreshTokenHash` (String, optional)
- `createdAt` (Date, auto)
- `updatedAt` (Date, auto)

Indexes:

- Unique index on `email`

## Note Collection

Collection name: `notes`

Fields:

- `title` (String, required, max 150)
- `content` (String, required, max 5000)
- `owner` (ObjectId ref -> `users`, required)
- `isArchived` (Boolean, default: `false`)
- `createdAt` (Date, auto)
- `updatedAt` (Date, auto)

Indexes:

- Compound index `{ owner: 1, createdAt: -1 }` for fast user note listing

## Access Rules

- Regular users can CRUD only their own notes.
- Admin users can access notes across all users.
