# MetaSpace Backend & Infrastructure Architecture

This architecture is designed for a real-time, authoritative multiplayer game platform with a lightweight blockchain reward layer. The backend prioritizes low-latency session handling, scalable matchmaking, and reliable claim processing.

## Table of Contents

- [System Overview](#system-overview)
- [Networking and State Synchronization](#networking-and-state-synchronization)
- [Data and Caching Strategy](#data-and-caching-strategy)
- [Horizontal Scalability and Orchestration](#horizontal-scalability-and-orchestration)
- [Container Example](#container-example)

---

## System Overview

The backend combines a stateless API layer, a real-time game node layer, and a persistent data layer. This allows MetaSpace to support both interactive dungeon play and asynchronous blockchain claim settlement without overloading the game loop.

### High-level architecture

```text
                             [ Client / Phaser 3 ]
                                      |
                    ┌─────────────────┴─────────────────┐
                    │ HTTP + WebRTC / UDP via Geckos.io │
                    ▼                                  ▼
          [ API Gateway / NGINX ]              [ UDP Load Balancer ]
                    │                                  │
        ┌───────────┴────────────┐            ┌─────────────┴────────────┐
        ▼                       ▼            ▼                          ▼
[ Auth Service ]      [ Matchmaker ]     [ Game Nodes (1..N) ]
(Express / REST)    (Redis Streams)   (Headless Phaser / Node)
        │                       │                     │
        └───────────────┬───────┴─────────────────────┘
                        ▼
              [ Data & Caching Layer ]
      ┌────────────────────────────────────────────┐
      │ Redis Cluster (state + pub/sub)            │
      │ PostgreSQL (profiles, inventory, claims)   │
      └────────────────────────────────────────────┘
```

### Design goals

- keep gameplay authoritative on the server
- minimize client-side trust in reward issuance
- support many concurrent dungeon sessions and room assignments
- provide predictable scaling through container orchestration

---

## Networking and State Synchronization

### Transport model

- Real-time movement uses WebRTC over UDP via Geckos.io for low-latency state transport.
- Reliable events such as room creation and auth handshakes use HTTP/TCP.
- The server enforces authoritative simulation rules, not the client.

### Server-authoritative loop

The headless Phaser runtime executes the canonical game simulation at a fixed tick rate. Client input is validated against world constraints before being applied in the simulation.

### Snapshot interpolation

The server sends compressed snapshots containing player positions such as $(x, y)$ to the client. The client interpolates between updates to maintain smooth movement while preserving authoritative server control.

---

## Data and Caching Strategy

| Layer | Technology | Primary purpose | Lifecycle |
| --- | --- | --- | --- |
| Relational database | PostgreSQL | User profiles, account bindings, claim logs, inventory state | Persistent |
| Session cache | Redis (in-memory) | Active WebRTC channels, room assignments, auth challenges | Ephemeral, ~15 min TTL |
| Pub/Sub broker | Redis Streams | Cross-node room coordination, matchmaking queues, health heartbeats | Real-time |

### Data responsibilities

- PostgreSQL stores durable state and historical records.
- Redis handles fast session coordination and transient state.
- Redis Streams enable queue-based room assignment and node communication.

This split keeps the system fast during runtime while retaining persistence for player and economic records.

---

## Horizontal Scalability and Orchestration

### Stateless services

User authentication, challenge generation, leaderboard queries, and static asset delivery are naturally stateless and can scale horizontally behind an NGINX or ingress layer.

### Stateful game nodes

Dungeon instances run as containerized Node.js game server workers. These can be orchestrated with Kubernetes and Agones for dynamic room provisioning.

### Room provisioning flow

1. The client requests a room via the matchmaker API.
2. The matchmaker chooses a game node from the available pool.
3. The assigned node IP and port are returned to the player.
4. The client connects directly to the game node over WebRTC.

This preserves low-latency gameplay while keeping the control plane separated from the simulation plane.

---

## Container Example

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: always

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: metaspace_game
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    restart: always

  game-server:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      PORT: 9208
      NODE_ENV: production
      REDIS_HOST: redis
      DB_HOST: postgres
    ports:
      - "9208:9208/udp"
      - "9208:9208/tcp"
    depends_on:
      - redis
      - postgres
```

### Operational notes

- Use Redis and PostgreSQL as separate services to prevent coupling stateful gameplay logic with persistent account data.
- Keep game nodes horizontally scalable and stateless at the service boundary.
- Add health checks and autoscaling rules around the room worker pool as the session count grows.

This backend design is suitable for a real-time game with asynchronous blockchain reward logic and room-based multiplayer scaling.
