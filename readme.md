# MetaSpace Technical Assessment

A real-time, multiplayer dungeon crawler built with Phaser 3, Node.js, `@geckos.io`, and an asynchronous EIP-712 reward claim system for blockchain-backed asset ownership.

## Overview

MetaSpace is designed around a server-authoritative game loop with low-latency real-time networking and a trust-minimized rewards layer. The gameplay experience remains smooth and responsive while blockchain-based rewards are settled asynchronously when the player chooses to claim them.

### Core goals

- Real-time multiplayer dungeon exploration
- Server-controlled game state and validation
- Low-latency WebRTC transport for movement and room sync
- Off-chain gameplay with on-chain reward settlement
- Scalable backend architecture for room provisioning and state orchestration

---

## Architecture Documentation

The repository includes dedicated architecture notes for both the backend and blockchain layers:

- [Backend & Infrastructure Architecture](../Backend_Architechture.md) — networking topology, server-authoritative loop, Redis/PostgreSQL strategy, and scaling design
- [Blockchain & Economic Architecture](../Blockchain_Architechture.md) — EIP-712 claim flow, smart contract logic, security checks, and L2 deployment strategy

---

## Tech Stack

- Frontend: Phaser 3 + Vite
- Game networking: `@geckos.io` with WebRTC/UDP transport
- Backend: Node.js + Express + headless Phaser runtime
- State & coordination: Redis + Redis Streams
- Persistence: PostgreSQL
- Blockchain: EIP-712 signed claims, smart contract verification, NFT reward minting

---

## Local Development Setup

### Prerequisites

- Node.js `v20.x` or newer
- npm or pnpm

### Install dependencies

```bash
# install root and client dependencies
npm install

# install server dependencies
cd server && npm install && cd ..
```

### Run the app

Start the backend in one terminal:

```bash
npm run server
```

Start the frontend in another terminal:

```bash
npm run client
```

The backend serves the game runtime on `http://localhost:9208` and the client is typically served by Vite on `http://localhost:5173`.

---

## Runtime Compatibility Notes

During local setup and execution, several targeted fixes were applied to improve reliability across environments:

- Updated WebRTC signal configuration to enforce explicit `http://` schemes for browser-safe handshake behavior
- Resolved cross-platform path issues in dungeon asset loading using normalized path resolution
- Corrected headless Phaser initialization in Node.js runtime flows
- Added local mock reward-signature fallbacks to support fast playtesting without requiring wallet extension setup

---

## Project Structure

```text
MetaSpace_TechnicalAssessment/
├── client/
├── server/
├── contracts/
├── commons/
├── package.json
├── start-server.js
├── readme.md
├── BACKEND_ARCHITECTURE.md
├── BLOCKCHAIN_ARCHITECTURE.md
└── ...
```

---

## Summary

MetaSpace combines responsive multiplayer gameplay with a secure, asynchronous blockchain settlement model. This creates a strong foundation for a dungeon game that feels fast and smooth while still enabling verifiable digital ownership and reward claims.
