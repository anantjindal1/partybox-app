# PartyBox

A lightweight social microgame container PWA designed for low-bandwidth, low-end Android devices with low-literacy users. Supports Hindi/English toggle, offline-first gameplay via IndexedDB, and real-time multiplayer via Firebase Firestore.

## Prerequisites

- Node.js 20+
- A Firebase project with Firestore enabled

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy the example env file and fill in your Firebase project values:

```bash
cp .env.example .env
```

**To get your Firebase config:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or select an existing one)
3. Add a Web App to your project (</> icon)
4. Copy the `firebaseConfig` values into your `.env` file

### 3. Enable Firestore

In the Firebase Console:
1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (or apply the security rules below)
4. Select a region and click **Enable**

### 4. Firestore Security Rules

Apply these rules in **Firestore → Rules** tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{code} {
      allow read, write: if true;   // open for now — tighten before prod
    }
    match /profiles/{userId} {
      allow read, write: if true;
    }
  }
}
```

## Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173)

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The build includes:
- Service worker (`dist/sw.js`) with precached app shell
- Web manifest linked in `index.html`
- Optimized React bundle

Preview the production build:

```bash
npm run preview
```

## Testing

### Unit tests (Jest)

```bash
npm test
```

Runs tests in `tests/` with jsdom environment. Mocks Firebase and IndexedDB.

### E2E tests (Cypress)

First start the dev server, then:

```bash
npm run cypress
```

## Project Structure

```
src/
├── components/     # Reusable UI (Button, RoomCode, LangToggle)
├── games/          # Game registry + individual games
│   └── lucky-number/
├── hooks/          # useProfile, useRoom, useOnlineStatus
├── pages/          # Home, Room, Profile
├── services/       # db, profile, room, xp, contentPack
├── store/          # LangContext (language + i18n)
└── utils/          # id generation
```

## Adding a New Game

1. Create `src/games/your-game/` with:
   - `metadata.js` — slug, title (en/hi), icon, minPlayers, maxPlayers
   - `index.jsx` — the game component (`props: { room, playerId }`)
   - `rules.js` — rules strings keyed by lang
   - `scoring.js` — pure scoring function

2. Import and add to `src/games/registry.js`

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Language | Plain JS (no TS) | Lower complexity |
| Tailwind | v3 | Stable, well-documented |
| State mgmt | React Context only | No Redux needed |
| SW strategy | injectManifest | Custom content-pack caching |
| ID generation | `crypto.randomUUID()` | No extra library |
| Room codes | 4-char alphanumeric | Easy to share verbally |
| Sample game | Lucky Number | Works offline, demos the pattern |
