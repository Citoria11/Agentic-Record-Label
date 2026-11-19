# Arcana Records OS

An autonomous AI record label HQ with a retro 2.5D isometric office interface where 4 specialized AI agents operate a 6-stage music production and distribution pipeline under human CEO supervision.

## Features

- **2.5D Isometric Office Floorplan**: Interactive 5-room HQ (`CEO Office`, `Studio A`, `Writers Lounge`, `Marketing & Distro Desk`, `Boardroom`) with animated agent sprites, room handoffs, and a collapsible **Live Studio Comms** dialogue feed.
- **4 Specialized AI Agents** (powered by `@google/genai` with structured JSON outputs):
  - **Miles (Label Manager)**: Compiles Morning CEO Briefings, pitches new single concepts across genres, and routes pipeline transitions.
  - **Nova (Producer & Audio Coder)**: Synthesizes chord progressions, Suno v4 parameter cards, and full 16-step polyphonic note sequences playable in Studio A's Tone.js mini-DAW with 4-bar/8-bar `.WAV` seed export.
  - **Lyra (A&R Lyricist)**: Writes complete 9-section lyrics with Suno structural/vocal metatags and bilingual phrasing support (`English`, `Spanish`, `Bilingual EN/ES`, `Bilingual EN/JP`).
  - **Vance (TuneCore & Marketing Lead)**: Audits TuneCore distribution metadata (UPC/ISRC, C-Line/P-Line, 3000×3000px cover art prompt) and builds a 14-day short-form video rollout plan.
- **CEO Command Center & Approval Gates**: Inbox queue pausing autonomous progression at Concept, Master, and Release gates for human sign-off or revision requests.
- **6-Stage Catalog Kanban & Heartbeat Controller**: Track singles across every stage, clear/restore demo tracks, and trigger manual or scheduled label ticks.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Tone.js (`audiobuffer-to-wav`)
- **Backend**: Express + Vite middleware (`server.ts`), `@google/genai` (`gemini-2.5-flash` / `gemini-2.5-pro`)

## Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The app runs on `http://localhost:3000`.

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

5. **Run pipeline & validator tests**
   ```bash
   npx tsx --test src/utils/pipelineRules.test.ts src/utils/tuneCoreValidator.test.ts
   ```
