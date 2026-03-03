# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Talkrift** is a full-stack real-time communication app (messaging, voice/video, contacts). Portfolio project. Currently in specification phase — see `PROJECT_SPEC.md` for the full design.

**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui + Framer Motion (frontend) / Django 4.2 + DRF + Django Channels + PostgreSQL + Redis (backend). Auth: JWT (simplejwt) + Google OAuth.

## Development Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
```

### Backend (`backend/`)
```bash
python manage.py runserver              # Dev server (HTTP only)
daphne -b 0.0.0.0 -p 8000 project.asgi:application  # Dev with WebSocket support
python manage.py migrate
pytest                                  # Run tests
```

## Architecture

### Frontend Structure (`frontend/src/`)
- `api/client.ts` — Centralized HTTP client: auto-injects `Authorization: Bearer <token>`, handles 401 → silent token refresh → retry original request
- `app/(auth)/` — Login and register pages (unprotected routes)
- `app/(main)/` — Dashboard, chat, calls (protected routes via Next.js middleware)
- `components/ui/` — shadcn/ui primitives (Dialog, Avatar, Badge, Tooltip, ScrollArea)
- `components/chat/` — MessageBubble, ChatInput, ChatHeader
- `components/call/` — VideoPlayer, CallControls, CallModal (floating overlay)
- `components/layout/` — Sidebar (fixed, collapsible on mobile), ContactList
- `hooks/useWebSocket.ts` — WebSocket connection lifecycle management
- `hooks/useWebRTC.ts` — RTCPeerConnection, offer/answer/ICE flow
- `hooks/useAuth.ts` — Token refresh logic, persisted auth state
- `store/` — Zustand stores for auth, chat, and call state

### Backend Structure (`backend/`)
- `apps/accounts/` — Custom User model, JWT auth endpoints, Google OAuth (verifies token against Google's userinfo endpoint)
- `apps/chat/` — Room + Message models, DRF views with cursor-based pagination
- `apps/calls/` — Call session tracking
- `apps/contacts/` — FriendRequest + Contact models, user search
- `consumers/chat_consumer.py` — Django Channels WS: broadcasts messages, typing events, read receipts, online presence
- `consumers/signal_consumer.py` — Django Channels WS: relays WebRTC offer/answer/ICE candidates between peers
- `routing.py` — Django Channels WebSocket URL routing

### Real-time Architecture
- Redis acts as the Django Channels channel layer (pub/sub broker)
- Frontend uses native WebSocket API (not a library)
- WebRTC signaling flow: Caller → `SignalingConsumer` → Callee for offer/answer exchange, then both peers exchange ICE candidates directly through the signaling server

### Auth Flow
- JWT: 60-min access token, 1-day refresh token with rotation; logout blacklists the refresh token
- Google OAuth: frontend receives Google token → sends to backend → backend verifies against `https://www.googleapis.com/oauth2/v3/userinfo`
- Protected routes enforced by Next.js middleware (not just client-side redirects)

## UI Design Conventions
- **Colors:** Primary accent `#DC2626` (deep crimson red) on dark background `#0F0F0F`
- **Animations:** Framer Motion for message slide-in, call modal entrance, sidebar transitions
- **Layout:** Fixed sidebar + main chat panel + floating call overlay

## Build Order (for new features)
Auth → Contacts → Chat (REST) → Chat (WebSocket) → Presence → Video calls → Polish
