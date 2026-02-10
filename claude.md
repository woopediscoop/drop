# Project: Drop – Ephemeral File Transfer

## Overview

A minimal web app for transferring files between my iPhone and Linux PC. Upload a file on one device, download it on the other. Files auto-expire after 30 minutes. That's it.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Hosting**: Vercel (free tier)
- **Storage**: Vercel Blob (free tier: 500MB). Files stored temporarily with 30-min TTL.
- **Database**: None unless needed. If state tracking becomes necessary, use Neon PostgreSQL (free tier).
- **Auth**: None. Use a short PIN or room code to pair devices (e.g. 4-digit code). No accounts.

## Core Behavior

1. User opens the app on any device.
2. User either creates a "room" (gets a short code like `A7X3`) or joins one by entering a code.
3. Inside a room, any device can upload files. All devices in the room see the file list.
4. Files are downloadable by any device in the room.
5. Files and rooms auto-expire after 30 minutes. No persistence beyond that.
6. Show a countdown timer on each file so users know how long it's available.

## File Handling

- Use **Vercel Blob** for file storage (`@vercel/blob`).
- On upload, store the blob and record metadata (filename, size, upload time, blob URL) in a lightweight store.
- If Vercel Blob doesn't support TTL natively, use a Vercel Cron Job (free tier supports 1/day) or check expiry on read and delete stale files lazily.
- Max file size: 50MB per file (Vercel Blob free tier limit considerations).
- If Vercel Blob is insufficient or awkward, fall back to **Neon** for metadata + presigned URLs, or use `/tmp` with caveats about serverless ephemerality.

## API Routes (Next.js Route Handlers)

- `POST /api/rooms` – Create a room, return room code
- `GET /api/rooms/[code]` – Get room info + file list (filter out expired)
- `POST /api/rooms/[code]/upload` – Upload file to room
- `GET /api/rooms/[code]/files/[id]/download` – Download a file
- `DELETE /api/rooms/[code]/files/[id]` – Manual delete (optional)

## Data Model (in-memory or Neon if needed)

```
Room {
  code: string (4 chars, alphanumeric uppercase)
  createdAt: timestamp
  expiresAt: timestamp (createdAt + 30min)
}

File {
  id: string (nanoid)
  roomCode: string
  filename: string
  size: number
  blobUrl: string
  uploadedAt: timestamp
  expiresAt: timestamp (uploadedAt + 30min)
}
```

If we can get away without a database (e.g. encoding metadata in blob keys/metadata or using Vercel KV), prefer that for simplicity. Only bring in Neon if there's no clean alternative.

## UI / UX

- **Single page app feel.** Two states: lobby (create/join room) and room view (file list + upload).
- Mobile-first design. Must work great on iPhone Safari.
- Drag-and-drop upload on desktop, file picker on mobile.
- Show upload progress.
- Show file size, time remaining, and a download button per file.
- PWA-capable: add a `manifest.json` and service worker so it can be added to iPhone home screen.
- Minimal, clean design. Dark theme preferred. No clutter.

## Constraints & Preferences

- **No Mac available** – everything is developed and tested on Linux.
- **Keep it simple.** This is a personal utility, not a product. Fewer dependencies = better.
- **No auth system.** Room codes provide sufficient access control for personal use.
- **No WebSocket requirement.** Polling every 5-10 seconds for the file list is fine. If real-time is trivial to add (e.g. Vercel's AI SDK streaming or server-sent events), go for it, but don't over-engineer.
- Prefer `pnpm` as package manager.
- Use TypeScript throughout.
- Use Tailwind CSS for styling.

## Nice-to-Haves (only if trivial)

- QR code on desktop that opens the room URL on phone (avoid typing codes).
- Copy room link to clipboard button.
- Notification sound or visual pulse when a new file appears in the room.

## Out of Scope

- User accounts or persistent history
- File previews or image thumbnails
- End-to-end encryption (would be nice eventually, not now)
- Native app packaging
