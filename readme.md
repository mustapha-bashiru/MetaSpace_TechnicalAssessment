# technical-assessment
A trust-minimised implementation of a multiplayer online game on-chain.

## Motivation
Video games are supposed to be **fun** and **challenging**, not mindless, boring staking disguised as _"gameplay"_.

Here, I aim to design a _trust-minimized_ crypto game implementation that can support both single and live multiplayer gameplay. It utilises the blockchain to build the player progression/rewards system and act as the game's decentralised, immutable database layer.

---

## Requirements

### Why These Specific Versions?

- **Node.js v20+**: Supports all modern JavaScript features required for this architecture
  - ⭐ **Development**: v26 (latest features, better performance)
  - ✅ **Production**: v24 LTS (stable, long-term support)
- **npm v10+**: Dependency resolution for monorepo structure (root + server + client)
- **Git**: Version control for tracking changes and collaboration

### Minimum System Requirements

```bash
node --version    # Must be v20.0.0 or higher
npm --version     # Must be v10.0.0 or higher
```

---

## Installation & Setup

### Step 1: Prepare Your Environment

**Why This Step Matters:**
- Different Node versions behave differently
- Game server requires specific packages that aren't compatible with old Node
- Prevents "works on my machine" issues

**1a. Install Node.js**

```bash
# Option A: Download from nodejs.org
# - Development: v26 (latest, with cutting-edge features)
# - Production: v24 LTS (stable, tested thoroughly)
Visit: https://nodejs.org/

# Option B: Use version manager (Recommended)
# For Mac/Linux:
nvm install 24
nvm use 24

# For Windows:
nvm install 24.0.0
nvm use 24.0.0
```

**1b. Verify Installation**

```bash
node --version    # Should show v20.0.0 or higher
npm --version     # Should show v10.0.0 or higher
```

**What These Check:**
- Node.js: Runtime environment for server and build tools
- npm: Package manager for installing dependencies

**1c. Clone and Install Project**
```bash
git clone https://github.com/davideliasdev09/MetaSpace_TechnicalAssessment.git
cd MetaSpace_TechnicalAssessment
npm install
```

This command automatically:
- Installs root dependencies
- Installs server dependencies (including devDependencies)
- Installs client dependencies

---

### Step 2: Start the Game (Open 2 terminals)

**Terminal 1** - Start multiplayer game server (port 9208)
```bash
npm run server
```

**Terminal 2** - Start client development server (port 3000)
```bash
npm run client
```

---

### Step 3: Access the Game

Open your browser and navigate to:
```
http://localhost:3000
```

**What You See:**
- 2D multiplayer game environment
- Your character (rendered based on server validation)
- Objectives to collect (coins, items, etc.)
- Real-time updates from other connected players

---

## Architecture Deep Dive

### Why We Chose Each Technology

#### **PhaserJS (v4.2.1) - Game Engine**
**Problem Solved:**
- Complex 2D graphics, sprite management, collision detection needed
- Building from scratch would take months

**Why Phaser:**
- Mature library (20+ years in game development)
- Built for web games specifically
- Handles rendering, physics, animations efficiently
- Works identically on server (for logic) and client (for rendering)

#### **Geckos.io (v3.1.0) - Real-Time Communication**
**Problem Solved:**
- HTTP is too slow for multiplayer games (request-response model)
- Need real-time, bidirectional communication

**Why Geckos.io:**
- Uses WebRTC (peer-to-peer, ultra-low latency)
- Fallback to WebSocket for compatibility
- Built specifically for multiplayer games
- Handles thousands of messages per second

#### **Express.js (v4.19.2) - Web Server**
**Problem Solved:**
- Need HTTP endpoints for:
  - Fetching game configuration
  - Authentication/challenge system
  - Serving static assets

**Why Express:**
- Lightweight and focused
- Industry standard for Node.js backends
- Easy to extend with middleware
- Well-documented

#### **Ethers.js (v6.13.0) - Blockchain Interaction**
**Problem Solved:**
- Need to interact with smart contracts
- Need to verify player addresses and signatures

**Why Ethers.js:**
- Modern replacement for Web3.js
- Better TypeScript support
- Cleaner API for signing/verification
- Smaller bundle size

---

## Gameplay Flow (How It All Works Together)

```
1. Player Action
   └─→ "I want to move right"
   
2. Client Sends to Server
   └─→ WebRTC: "Player input: moveRight"
   
3. Server Validates
   └─→ "Is this player authorized?"
   └─→ "Is this move legal?"
   └─→ "Any collision detection issues?"
   
4. Server Updates Game State
   └─→ Player position: (100, 200)
   └─→ Check objective: "Did player collect coin?"
   
5. Server Broadcasts to All Clients
   └─→ "Player 1 is now at (100, 200)"
   └─→ "All other players, here's the updated world state"
   
6. Client Renders
   └─→ Shows all players at their validated positions
   
7. Achievement Detected
   └─→ Server: "Player collected the coin!"
   └─→ Server signs proof of achievement
   └─→ Sends signed message to player
   
8. Player Claims Reward
   └─→ Calls smart contract with signed message
   └─→ Smart contract verifies server signature
   └─→ Rewards distributed on-chain
```

---

## Security Model

### What Makes This Secure?

**Server-Side Validation:**
- No client action is trusted without server verification
- Players cannot forge achievements
- All state changes are logged and verified

**Cryptographic Signatures:**
- Only the server can sign achievement messages
- Smart contracts verify signatures before awarding rewards
- Private keys never leave the server

**Hybrid Architecture:**
- Game logic stays fast and flexible on server
- Final rewards are immutable on blockchain
- Best of both worlds: performance + security

---

## Troubleshooting

### "Port 9208 already in use"
**Why This Happens:**
- Another game server instance is running
- Node process didn't shut down cleanly

**Fix:**
```bash
# Windows:
Get-Process node | Stop-Process

# Mac/Linux:
killall node
```

### "Cannot connect to server"
**Why This Happens:**
- Server isn't running
- Client/Server on different machines (network issues)

**Fix:**
```bash
# Terminal 1: Make sure server is running
npm run server

# Terminal 2: Client should auto-connect
npm run client
```

### Dependencies installation fails
**Why This Happens:**
- Node version too old
- npm cache corruption

**Fix:**
```bash
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest

# Reinstall
npm install
```

---

## Technology Stack Rationale

| Component | Technology | Why This Choice |
|-----------|-----------|-----------------|
| Game Engine | PhaserJS | Industry standard, web-optimized |
| Real-Time Communication | Geckos.io + WebRTC | Ultra-low latency, peer-to-peer |
| Backend | Express.js + Node.js | Fast, JavaScript, event-driven |
| Blockchain | Ethers.js | Modern, secure, TypeScript-ready |
| Development | Vite + TypeScript | Fast builds, type safety |
| Monitoring | Nodemon | Auto-reload during development |

---

## Summary: Problems We Solve

This project addresses **four critical challenges** in gaming:

### ✅ **Unvalidated Rewards**
Players cannot claim rewards they haven't earned. Server-signed messages prove achievement before blockchain distribution.

### ✅ **Slow, Laggy Gameplay**
Real-time WebRTC communication + client-side prediction = smooth 60fps gameplay without sacrificing validation.

### ✅ **Scalability Limitations**
Hybrid architecture lets you handle thousands of concurrent players without gas fees or blockchain congestion.

### ✅ **Inflexible Smart Contracts**
Game logic stays flexible on the server. Smart contracts only handle final reward distribution (the part that needs to be immutable).

**The Result:** A playable, fair, scalable blockchain game that actually feels good to play.

---

## Final thoughts

Although this approach may not seem to be the most trustless, decentralised solution to building crypto games since we rely on a centralised game server to handle the game engine, in my opinion, I think that's rarely an issue. Not everything needs to be on-chain. Having your players' progression and items stored there is more than enough. This even provides you an advantage in the form of flexibility, upgradability, control and most importantly, being able to build fun and engaging games for your players. Thank you! 🎮✨