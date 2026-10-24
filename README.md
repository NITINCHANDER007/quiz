# ⚡ Wayground - Production-Ready Real-Time Multiplayer Quiz Web App

A modern, high-energy, Kahoot-style real-time multiplayer quiz web application built with the **MERN Stack (MongoDB, Express, React, Node.js) + Socket.IO**.

---

## 🚀 Features & Architecture

### 👑 Roles & Flows
1. **Host / Admin**:
   - Authenticated via simple password + JWT token (expires in 7 days).
   - Create, edit, and delete 20-question quizzes with full validation.
   - Bulk import and export quiz questions in JSON format.
   - Click **"Create Game Room"** to launch a session with an auto-generated 6-character room PIN, join link (`/join/:code`), and QR code.
   - Host lobby with live player counters, animated bouncing avatars, and start quiz control (disabled when 0 players).
   - Full question control with server-authoritative 20-second countdown timer.
   - Real-time answer distribution bar charts (A, B, C, D) and cumulative leaderboard table with ranks, scores, total response times, and last answer markers.
   - Final Olympic-style champions podium (top 3) and one-click **"Download Results CSV"**.

2. **Player**:
   - Zero signup required: join via link or PIN with a custom nickname.
   - Auto-assigned a unique fun emoji avatar from a pool of 50 characters (no duplicates per room).
   - Live lobby with "Waiting for host to start..." pulsating status.
   - 4 large Kahoot-style color buttons (▲ Red, ◆ Blue, ● Yellow, ■ Green).
   - Instant answer locking with feedback ("Answer locked! Waiting for others...").
   - Instant reveal animations: celebratory confetti burst and green banner for correct answers (+10 pts), shake animation and correct answer highlighting for wrong answers.
   - Individual score & rank feedback (leaderboard is host-only during questions).
   - Reconnect support: refreshes or reconnects seamlessly using `playerId` stored in `localStorage`.

---

## 📁 Complete Folder Structure

```
wayground/
├── package.json                   # Root orchestrator scripts
├── README.md                      # Project documentation & deployment guide
├── server/                        # Express + Socket.IO + Mongoose Backend
│   ├── .env                       # Local environment variables
│   ├── .env.example               # Environment variables template
│   ├── package.json               # Backend dependencies
│   └── src/
│       ├── index.js               # Express app & Socket.IO server initialization
│       ├── config/
│       │   └── db.js              # MongoDB connection with retry handling
│       ├── models/
│       │   ├── Quiz.js            # Mongoose Quiz & 20 Questions Schema
│       │   └── GameRoom.js        # Mongoose GameRoom, Players & Answer records
│       ├── middleware/
│       │   └── auth.js            # JWT admin verification middleware
│       ├── routes/
│       │   ├── authRoutes.js      # Admin login and verify endpoints
│       │   ├── quizRoutes.js      # Quiz CRUD & JSON bulk import
│       │   └── gameRoutes.js      # Game room check, history & CSV export
│       ├── sockets/
│       │   ├── gameState.js       # Fast in-memory state, ranking & DB sync
│       │   └── socketHandler.js   # Authoritative real-time event handlers
│       ├── utils/
│       │   ├── avatars.js         # 50-character avatar pool & assigner
│       │   └── codeGenerator.js   # 6-character clean room code generator
│       └── seed/
│           ├── sampleQuiz.json    # 20-question general knowledge quiz data
│           └── seed.js            # MongoDB automated database seed script
└── client/                        # React (Vite) + Tailwind CSS Frontend
    ├── .env                       # Client environment variables
    ├── .env.example               # Client environment template
    ├── index.html                 # App shell with Google Fonts (Outfit & Inter)
    ├── package.json               # Frontend dependencies
    ├── postcss.config.js          # PostCSS configuration
    ├── tailwind.config.js         # Tailwind configuration with Kahoot theme
    ├── vite.config.js             # Vite build configuration
    └── src/
        ├── index.css              # Global styles, glassmorphism & glow classes
        ├── main.jsx               # React DOM entry point
        ├── App.jsx                # Router & Protected Admin Routes
        ├── context/
        │   ├── AuthContext.jsx    # Admin JWT authentication context
        │   ├── SocketContext.jsx  # Socket.IO connection manager
        │   └── SoundContext.jsx   # Global sound mute/unmute toggle state
        ├── components/
        │   ├── Navbar.jsx         # Header with branding and sound controls
        │   ├── AnswerOption.jsx   # 4 Kahoot colored buttons with shapes
        │   ├── CircularTimer.jsx  # SVG countdown timer with tick sounds
        │   ├── AvatarBadge.jsx    # Bouncing avatar card with name & rank
        │   ├── DistributionChart.jsx # A/B/C/D live answer bar chart
        │   ├── LeaderboardTable.jsx  # Cumulative leaderboard table
        │   ├── QRCodeModal.jsx    # Mobile scan join modal
        │   └── SoundToggle.jsx    # Volume toggle button
        ├── pages/
        │   ├── AdminLogin.jsx     # Host password login screen
        │   ├── AdminDashboard.jsx # Quizzes list, room creation & CSV history
        │   ├── QuizEditor.jsx     # 20-question editor with bulk JSON import
        │   ├── HostLobby.jsx      # Live PIN, QR code & joined players lobby
        │   ├── HostGame.jsx       # Host presentation screen with timer & stats
        │   ├── PlayerJoin.jsx     # Player PIN & nickname entry screen
        │   ├── PlayerLobby.jsx    # Player waiting room with avatar display
        │   ├── PlayerGame.jsx     # Player question & result screen
        │   └── FinalPodium.jsx    # Olympic-style 3D podium & CSV download
        └── utils/
            ├── api.js             # REST API helper functions
            ├── soundEffects.js    # Web Audio API synthesizer (zero audio lag)
            └── confetti.js        # Canvas-confetti celebration fireworks
```

---

## 🛠️ Local Setup & Running Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.

### 2. Install Dependencies
In the root directory, run:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration
**Server (`server/.env`)**:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/wayground
JWT_SECRET=supersecret_quizmaster_jwt_key_2026!
ADMIN_PASSWORD=admin123
CLIENT_URL=http://localhost:5173
```

**Client (`client/.env`)**:
```env
VITE_SERVER_URL=http://localhost:5000
```

### 4. Seed Database with 20-Question Sample Quiz
Populate MongoDB with the included 20-question General Knowledge, Science & Tech quiz:
```bash
cd server
npm run seed
```

### 5. Run the Application
In separate terminal windows:
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:5173)
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🎮 How to Test the Game Locally

1. **Host Screen**:
   - Navigate to `http://localhost:5173/admin/login` and log in with password `admin123`.
   - On the Admin Dashboard, click **"Create Room"** on the sample quiz.
   - The **Host Lobby** will open displaying a 6-character PIN (e.g. `ABC123`).

2. **Player Screen**:
   - Open an incognito window or another browser tab at `http://localhost:5173`.
   - Enter the room PIN and a nickname (e.g. `Alex`).
   - The player is automatically assigned a fun avatar and appears live on both screens.
   - Open a third tab to add a second player (e.g. `Sam`) with another unique avatar.

3. **Gameplay**:
   - On the Host Lobby screen, click **"Start Quiz Now"**.
   - Click **"Send Question 1"**:
     - Both players receive the question with 4 colored buttons and a 20-second timer.
     - As each player picks an option, it locks instantly.
     - When all players answer (or 20s expires), the question reveals:
       - Correct players see confetti and `+10 pts`.
       - Wrong players see the shake animation and the highlighted correct answer.
       - Host sees the answer distribution chart and cumulative leaderboard.
   - Host clicks **"Next Question"** until Question 20.
   - After Question 20, everyone sees the **Champions Podium (Top 3)** and Host can click **"Download Results CSV"**.

---

## 📡 Socket.IO Real-Time Events Protocol

| Event Name | Direction | Payload Description | Security & Notes |
|------------|-----------|---------------------|------------------|
| `admin:createRoom` | Client -> Server | `{ quizId, token }` | Requires Admin JWT token. Creates room in memory. |
| `admin:roomCreated` | Server -> Client | `{ roomCode, quizTitle, totalQuestions }` | Confirms room creation to host. |
| `player:join` | Client -> Server | `{ roomCode, name }` | Rejects duplicates, assigns unique avatar, joins room. |
| `room:playersUpdate` | Server -> Room | `Array<Player>` | Broadcasts live roster to all participants. |
| `player:reconnect` | Client -> Server | `{ roomCode, playerId }` | Restores player socket and returns full state snapshot. |
| `admin:startGame` | Client -> Server | `{ roomCode }` | Requires Admin. Locks lobby and starts quiz session. |
| `room:gameStarted` | Server -> Room | `{ roomCode, totalQuestions }` | Transitions clients to game screen. |
| `admin:sendQuestion` | Client -> Server | `{ roomCode }` | Starts 20s timer and broadcasts question. |
| `question:new` | Server -> Room | `{ questionIndex, totalQuestions, text, options, duration }` | **Never sends correctIndex to players!** |
| `question:adminNew` | Server -> Host | `{ ..., correctIndex }` | Sends correct answer index to host only. |
| `player:answer` | Client -> Server | `{ roomCode, playerId, questionIndex, selectedOption }` | Server computes response time, locks choice, calculates points. |
| `question:answerCount`| Server -> Room | `{ answeredCount, totalPlayers }` | Updates live answered count. |
| `question:reveal` | Server -> Player | `{ isCorrect, correctIndex, currentScore, currentRank }` | Sent individually to each player upon question end. |
| `admin:leaderboardUpdate`| Server -> Host | `{ correctIndex, distribution, leaderboard, isLastQuestion }` | Cumulative rankings & bar chart stats sent to host. |
| `admin:nextQuestion` | Client -> Server | `{ roomCode }` | Advances to next question or triggers game finish. |
| `game:finished` | Server -> Room | `{ podium, fullLeaderboard, quizTitle }` | Saves final results in MongoDB and triggers podium. |
| `disconnect` | Socket lifecycle | - | Flags player disconnected without destroying session. |

---

## 🌐 Production Deployment Guide

### 1. Database: MongoDB Atlas
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0).
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so Render/Railway can connect.
4. Under **Database Access**, create a user with read/write privileges.
5. Copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/wayground?retryWrites=true&w=majority
   ```

### 2. Backend Deployment: Render or Railway

#### Option A: Render
1. Create a **New Web Service** pointing to your repository.
2. Set **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `node src/index.js`
5. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or let Render set default `$PORT`)
   - `MONGO_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: A strong 64-character secret key
   - `ADMIN_PASSWORD`: Your custom production admin password
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://wayground.vercel.app`)

#### Option B: Railway
1. Create a **New Project** from GitHub repo.
2. Set root directory to `/server`.
3. Add the environment variables (`MONGO_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENT_URL`).
4. Generate a public domain (e.g. `https://wayground-server.up.railway.app`).

### 3. Frontend Deployment: Vercel
1. Import your GitHub repository into Vercel.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Configure Environment Variable:
   - `VITE_SERVER_URL`: Your backend URL (e.g. `https://wayground-server.onrender.com` or Railway URL, with NO trailing slash).
5. Deploy!

### 4. CORS Notes
- The server CORS configuration in `server/src/index.js` automatically permits requests from:
  - Localhost during development (`http://localhost:5173`)
  - Any domain specified in `CLIENT_URL`
  - All standard `.vercel.app`, `.onrender.com`, and `.railway.app` production domains.
- Both Express HTTP routes and Socket.IO handshakes use this unified CORS policy.

---

## 📄 License
MIT License. Built for production-grade real-time multiplayer performance.
