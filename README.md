# Talkrift

A full-stack real-time communication app featuring messaging, emoji reactions, file sharing, and peer-to-peer video/audio calls.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Django](https://img.shields.io/badge/Django-4.2-green?logo=django) ![WebRTC](https://img.shields.io/badge/WebRTC-P2P-blue) ![WebSocket](https://img.shields.io/badge/WebSocket-Django_Channels-purple)

---

## Features

- **Real-time messaging** — one-on-one and group chat via WebSocket (Django Channels + Redis)
- **Emoji reactions** — react to any message; reactions sync live across all participants
- **File & image sharing** — send images (inline preview) or files (PDF, DOCX, ZIP, etc.)
- **Read receipts & typing indicators** — live "seen" status and typing dots
- **Peer-to-peer video/audio calls** — WebRTC with offer/answer/ICE signaling through Django Channels
- **In-call controls** — mute, camera toggle, screen share, hang up
- **Online presence** — live green dot on contacts who are currently active
- **Group chat** — create named group rooms with multiple contacts
- **Contact system** — search users, send/accept/reject friend requests
- **Google OAuth** — sign in with Google in addition to email/password
- **JWT auth** — 60-min access token with silent refresh and rotation; logout blacklists the token
- **Cursor-based pagination** — efficient chat history loading, load-more on scroll to top
- **Browser notifications** — desktop push when a message arrives in a background tab
- **Message animations** — Framer Motion slide-in for new messages, animated typing indicator

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui, Framer Motion, Lucide icons |
| State | Zustand |
| Real-time (FE) | Native WebSocket API, WebRTC |
| Backend | Django 4.2, Django REST Framework |
| Real-time (BE) | Django Channels, Redis (channel layer) |
| Database | PostgreSQL |
| Auth | JWT (simplejwt) + Google OAuth |

---

## Architecture Highlights

### WebSocket messaging
Each chat room has a dedicated `ChatConsumer` over Django Channels. The frontend connects via native WebSocket using a short-lived JWT token in the query string. Events: `message`, `typing`, `read_receipt`, `reaction`, `presence`.

### WebRTC calling
A `SignalingConsumer` relays WebRTC offer/answer/ICE candidates between peers. ICE server config (STUN + optional TURN) is fetched from the backend at call time — TURN credentials are never exposed in frontend env vars.

```
Caller → offer → SignalingConsumer → Callee
Callee → answer → SignalingConsumer → Caller
Both peers exchange ICE candidates → P2P connection
```

### JWT silent refresh
The Axios client intercepts 401 responses, calls `/auth/token/refresh/`, stores the new rotated token, and retries the original request — all transparently.

### Optimistic UI
Messages appear instantly with a temporary ID. When the server echo arrives (via WebSocket or REST), it replaces the optimistic entry in-place with the real message.

---

## Project Structure

```
Talkrift/
├── frontend/                   # Next.js app
│   └── src/
│       ├── api/                # Axios client + per-domain API functions
│       ├── app/
│       │   ├── (auth)/         # Login, register pages
│       │   └── (main)/         # Dashboard, chat rooms
│       ├── components/
│       │   ├── chat/           # MessageBubble, ChatInput, ChatHeader, MessageList
│       │   ├── call/           # CallModal, VideoPlayer, CallControls
│       │   └── layout/         # Sidebar, ChatsPanel, ContactsPanel
│       ├── hooks/
│       │   ├── useWebSocket.ts # WS lifecycle, reconnect, event dispatch
│       │   ├── useWebRTC.ts    # RTCPeerConnection, offer/answer/ICE, screen share
│       │   └── useAuth.ts      # Login, register, Google OAuth, logout
│       └── store/              # Zustand stores (auth, chat, call, contacts)
│
└── backend/                    # Django project
    ├── apps/
    │   ├── accounts/           # Custom User model, JWT endpoints, Google OAuth
    │   ├── chat/               # Room + Message + Reaction models, DRF views
    │   ├── calls/              # CallSession model, ICE servers endpoint
    │   └── contacts/           # FriendRequest + Contact models, user search
    └── consumers/
        ├── chat_consumer.py    # WS: messages, typing, read receipts, reactions, presence
        └── signal_consumer.py  # WS: WebRTC signaling relay
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL
- Redis (see note below for Windows)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in DB/Redis creds
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 project.asgi:application
```

> **Note:** `runserver` does not support WebSockets — Daphne (ASGI) is required.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL
npm run dev
```

### Redis on Windows

Redis runs inside WSL:

```bash
wsl
sudo service redis-server start
redis-cli ping   # should return PONG
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=talkrift
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

CORS_ALLOWED_ORIGINS=http://localhost:3000

GOOGLE_CLIENT_ID=

# TURN server for cross-network WebRTC calls (optional)
TURN_URL=
TURN_USERNAME=
TURN_CREDENTIAL=
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register with email + password |
| POST | `/api/auth/login/` | Login → access + refresh tokens |
| POST | `/api/auth/token/refresh/` | Rotate refresh token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| POST | `/api/auth/google/` | Google OAuth (frontend token → backend verify) |
| GET | `/api/auth/me/` | Current user profile |
| GET | `/api/contacts/` | List contacts |
| GET | `/api/contacts/search/?q=` | Search users |
| POST | `/api/contacts/requests/` | Send friend request |
| POST | `/api/contacts/requests/{id}/accept/` | Accept friend request |
| GET | `/api/chat/rooms/` | List chat rooms |
| POST | `/api/chat/rooms/` | Create DM or group room |
| GET | `/api/chat/rooms/{id}/messages/` | Paginated message history |
| POST | `/api/chat/rooms/{id}/messages/` | Send message (REST fallback) |
| GET | `/api/calls/ice-servers/` | STUN/TURN config for WebRTC |

---

## WebSocket Events

**Chat** — `ws://host/ws/chat/{roomId}/?token=<access_token>`

| Direction | Event | Payload |
|---|---|---|
| Send | `message` | `{ type, content }` |
| Send | `typing` | `{ type, is_typing }` |
| Send | `read_receipt` | `{ type, message_id }` |
| Send | `reaction` | `{ type, message_id, emoji }` |
| Receive | `message` | `{ type, message: {...} }` |
| Receive | `typing` | `{ type, user_id, display_name, is_typing }` |
| Receive | `reaction` | `{ type, message_id, emoji, user_id, action }` |
| Receive | `presence` | `{ type, user_id, is_online }` |

**Signaling** — `ws://host/ws/signal/{roomId}/?token=<access_token>`

| Direction | Event |
|---|---|
| Send/Receive | `offer`, `answer`, `ice_candidate` |
