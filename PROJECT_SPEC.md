Talkrift web app

🎯 Core Features
Authentication

JWT-based login/register (access: 60min, refresh: 1-day with rotation + blacklist on logout)
Google OAuth via token verification against Google's userinfo endpoint
Protected routes using Next.js middleware

Messaging

One-on-one and group chat rooms
Real-time messaging via Django Channels (WebSocket) + Redis as the channel layer
Message types: text, emoji reactions, file/image attachments
Read receipts and online/typing indicators
Message pagination (cursor-based) via DRF

Video & Audio Calls

Peer-to-peer video/audio calls using WebRTC
Signaling server via Django Channels WebSocket
ICE candidate exchange + STUN/TURN server support
In-call controls: mute, camera toggle, screen share, hang up

Contacts & User Discovery

Search users by username or email
Send/accept/reject friend requests
Contact list with online status

🗂️ Suggested Project Structure
Talkrift/
├── frontend/ # Next.js 15 App
│ ├── src/
│ │ ├── api/client.ts # Centralized Axios/fetch client (JWT auto-inject)
│ │ ├── app/
│ │ │ ├── (auth)/ # login, register pages
│ │ │ ├── (main)/ # dashboard, chat, calls
│ │ │ └── layout.tsx
│ │ ├── components/
│ │ │ ├── ui/ # shadcn/ui components
│ │ │ ├── chat/ # MessageBubble, ChatInput, ChatHeader
│ │ │ ├── call/ # VideoPlayer, CallControls, CallModal
│ │ │ └── layout/ # Sidebar, ContactList
│ │ ├── hooks/
│ │ │ ├── useWebSocket.ts
│ │ │ ├── useWebRTC.ts
│ │ │ └── useAuth.ts
│ │ └── store/ # Zustand for global state (auth, chat, call)
│
├── backend/ # Django 4.2
│ ├── apps/
│ │ ├── accounts/ # User model, JWT auth, Google OAuth
│ │ ├── chat/ # Room, Message models + DRF views
│ │ ├── calls/ # Call session tracking
│ │ └── contacts/ # FriendRequest, Contact models
│ ├── routing.py # Django Channels WebSocket routing
│ └── consumers/
│ ├── chat_consumer.py # WS: messages, typing, read receipts
│ └── signal_consumer.py # WS: WebRTC signaling (offer/answer/ICE)

🛠️ Key Technical Implementations
Frontend Hooks
ts// useWebSocket.ts — manages WS connection lifecycle
// useWebRTC.ts — handles RTCPeerConnection, offer/answer/ICE flow
// useAuth.ts — token refresh logic, persisted auth state
API Client (src/api/client.ts)
ts// Auto-injects Authorization: Bearer <token>
// Handles 401 → silent token refresh → retry original request
Django Channels Consumers
python# ChatConsumer: broadcast messages, typing events, online presence

# SignalingConsumer: relay WebRTC offer/answer/ICE between peers

```

**WebRTC Flow**
```

Caller sends offer → SignalingConsumer → Callee receives offer
Callee sends answer → SignalingConsumer → Caller receives answer
Both exchange ICE candidates → P2P connection established

🎨 UI/UX Design Direction

Color: Deep crimson red #DC2626 as primary accent on a dark (#0F0F0F) background
Component library: shadcn/ui (Dialog, Avatar, Badge, Tooltip, ScrollArea)
Animations: Framer Motion for message slide-in, call modal entrance, sidebar transitions
Layout: Fixed sidebar (contacts) + main chat panel + floating call overlay
Responsive: Mobile-first, collapsible sidebar on small screens

🔌 Tech Stack Summary
Layer: Tech
Frontend: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui, Framer Motion
State: Zustand
Real-time (FE): Native WebSocket API + WebRTC
Backend: Django 4.2, DRF, Django Channels
Database: PostgreSQL
Cache/Broker: Redis (Channel layer)
Auth: JWT (simplejwt) + Google OAuth

📦 Suggested Build Order

Auth system — register, login, Google OAuth, JWT refresh
Contact system — user search, friend requests, contact list
Chat system — REST API for rooms/messages + WebSocket for real-time delivery
Presence system — online status, typing indicators via WebSocket
Video calls — WebRTC + signaling via Django Channels
Polish — animations, notifications, mobile responsiveness

🧪 Portfolio Highlights to Emphasize in README

WebRTC peer-to-peer video calling with custom signaling server
Django Channels WebSocket consumers for real-time features
JWT silent refresh with request retry interceptor
Google OAuth integration (frontend token → backend verification)
Cursor-based pagination for chat history
