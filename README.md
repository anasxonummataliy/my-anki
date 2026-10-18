# MyAnki - Personal Offline Vocabulary Learning App

A modern, minimal, local-first vocabulary learning mobile application built with React Native, Expo, and TypeScript for iOS. Inspired by Anki's spaced repetition power, crafted with an intuitive, aesthetic iPhone experience.

---

## Highlights

- **Local-First & Offline**: Powered by `expo-sqlite` with WAL mode and foreign key integrity. Zero cloud dependencies, zero external APIs, zero tracking.
- **FSRS Spaced Repetition**: Modern Free Spaced Repetition Scheduler (`ts-fsrs`) replacing legacy SM-2. Calculates stability, difficulty, review intervals, and retention probability.
- **Hierarchical Decks**: Supports parent decks and subdecks (e.g. *4000 Essential English Words* → *Unit 1*, *Unit 2*). Study individual subdecks or entire parent trees.
- **Interactive Flashcards**: Fluid 3D card flips with `react-native-reanimated`, haptic feedback, and live interval previews on Again / Hard / Good / Easy buttons.
- **5 Quiz Modes**:
  1. Multiple Choice (English → Uzbek)
  2. Multiple Choice (Uzbek → English)
  3. Active Recall Typing (with smart punctuation & case-insensitive normalization)
  4. Matching Pairs (interactive connection grid)
  5. Mistakes Review (targeted drill on previously missed words)
- **JSON Backup & Restore**: Full transactional export and restore with Zod schema validation (`AppBackupSchema`) and native iOS Share Sheet / Files integration.
- **Learning Analytics**: Streaks, daily progress bars, 7-day review activity charts, FSRS rating distribution, and quiz accuracy.
- **iOS-First UI**: Dark and Light themes with automatic system appearance detection, safe area support, and accessible touch targets.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 57 (React Native 0.86, React 19, TypeScript) |
| **Navigation** | Expo Router (File-based navigation with `src/app/`) |
| **Database** | `expo-sqlite` (WAL mode, SQLite indexes, schema migrations) |
| **Spaced Repetition** | `ts-fsrs` (Free Spaced Repetition Scheduler) |
| **State Management** | Zustand (Persistent theme, active study & quiz sessions) |
| **Forms & Validation** | React Hook Form + Zod |
| **Animations** | React Native Reanimated 4 & `react-native-worklets` |
| **Icons** | `lucide-react-native` + `react-native-svg` |
| **Files & Sharing** | `expo-file-system`, `expo-sharing`, `expo-document-picker` |
| **Testing** | Jest + `ts-jest` |

---

## Quick Start & Installation

### Prerequisites
- macOS machine with **Node.js 18+** installed.
- Physical iPhone with the **Expo Go** app installed from the App Store.
- Both your Mac and iPhone must be connected to the **same Wi-Fi network** (or connected via USB).

### 1. Install Dependencies
```bash
cd /Users/anasxonummataliyev/projects/my-anki
npm install
```

### 2. Run Quality Checks
```bash
# Typecheck TypeScript
npx tsc --noEmit

# Run unit tests (FSRS scheduling, quiz generator, backup validation)
npm test

# Diagnose Expo configuration & dependencies
npx expo-doctor
```

### 3. Start the Development Server
```bash
npx expo start
```

---

## Connecting an iPhone via Expo Go

1. **Launch Expo Server**:
   ```bash
   npx expo start
   ```
2. **Open Camera on iPhone**:
   - Point your iPhone camera at the QR code displayed in the terminal.
   - Tap the yellow prompt: **"Open in Expo Go"**.
3. **Tunnel Mode (If Wi-Fi firewalls block local connections)**:
   ```bash
   npx expo start --tunnel
   ```
4. Once loaded, the initial database will automatically seed with sample decks (*4000 Essential English Words - Unit 1 & Unit 2*, *Travel & Conversation*) so you can start reviewing flashcards, taking quizzes, and testing backups immediately.

---

## Offline Limitations & Behavior

It is important to understand the difference between **running inside Expo Go** and a **standalone compiled iOS application**:

| Dimension | Inside Expo Go | Standalone iOS App (`eas build`) |
|---|---|---|
| **JavaScript Bundle** | Downloaded from the Mac Metro dev server on app launch over Wi-Fi / Tunnel. | Compiled and bundled into the native `.ipa` binary. |
| **Cold Launch Offline** | Requires the dev server connection when cold-starting the app session. | Launches instantly on iPhone in Airplane mode with no network. |
| **Session Inactivity** | Once the app is loaded, **all features** (adding words, FSRS reviews, quizzes, statistics, JSON backup/restore) work 100% offline without any network calls. | 100% offline, persistent on home screen forever. |
| **Data Storage** | SQLite database file is stored locally in the iPhone's application container. | SQLite database file is stored locally in the iPhone's application container. |

---

## Database Architecture

The application uses local SQLite with foreign keys enforced (`PRAGMA foreign_keys = ON`) and Write-Ahead Logging (`PRAGMA journal_mode = WAL`).

```
┌──────────────────┐          ┌─────────────────────────┐
│      decks       │ 1      * │          words          │
│──────────────────│─────────▶│─────────────────────────│
│ id (UUID, PK)    │          │ id (UUID, PK)           │
│ name             │          │ deck_id (FK -> decks)   │
│ description      │          │ word (English)          │
│ parent_id (FK)   │          │ translation (Uzbek)     │
│ color            │          │ definition, example     │
│ created_at       │          │ part_of_speech, notes   │
└──────────────────┘          └─────────────────────────┘
                                           │ 1
                                           │
                       ┌───────────────────┴───────────────────┐
                       │ 1                                     │ 1
                       ▼                                       ▼
       ┌─────────────────────────┐             ┌─────────────────────────┐
       │      review_states      │             │       review_logs       │
       │─────────────────────────│             │─────────────────────────│
       │ word_id (PK, FK)        │             │ id (UUID, PK)           │
       │ state (New/Learn/Review)│             │ word_id (FK)            │
       │ due (timestamp ms)      │             │ rating (1:Again - 4:Easy│
       │ stability, difficulty   │             │ state, due, stability   │
       │ reps, lapses            │             │ elapsed_days, review ms │
       │ last_review             │             └─────────────────────────┘
       └─────────────────────────┘
```

### Tables Overview
1. **`decks`**: Deck hierarchy with `parent_id` foreign key. Deleting a parent deck cascades safely to words and subdecks.
2. **`words`**: Stores English vocabulary, Uzbek translation, grammatical part of speech, definition, and example sentences.
3. **`review_states`**: Holds the current FSRS card parameters for each word (due date, stability, difficulty, repetitions, lapses, and memory state).
4. **`review_logs`**: Historical ledger of every flashcard review submission for analytics, streak calculations, and retention rate formulas.
5. **`quiz_sessions` & `quiz_answers`**: Stores completed quiz results and answers for each question mode, completely isolated from FSRS scheduling.
6. **`app_settings`**: Key-value store for preferences like daily learning goals and UI theme.

---

## Backup and Restore Flow

### Exporting Backups
1. Navigate to **Settings** → tap **Export JSON**.
2. The app queries the local SQLite database and serializes all decks, words, review schedules, review logs, quiz sessions, and settings into a validated JSON structure.
3. The JSON file is saved to the document filesystem and passed to `expo-sharing`.
4. The iOS Share Sheet opens, allowing you to save the file to **iCloud Drive**, the **Files** app, AirDrop it to your Mac, or send it via message.

### Restoring Backups
1. Navigate to **Settings** → tap **Import JSON**.
2. A confirmation alert warns that local data will be replaced.
3. The native iOS document picker (`expo-document-picker`) lets you choose any `.json` backup file.
4. The file is validated using Zod against `AppBackupSchema`. If invalid or corrupt, the transaction halts and displays specific validation errors.
5. Restoration executes within an atomic SQLite transaction (`db.withTransactionAsync`). If any error occurs, all changes roll back to prevent database corruption.

---

## Unit Testing

Unit tests run with Jest and `ts-jest` for fast, offline execution:

```bash
npm test
```

### Covered Test Suites:
- `__tests__/fsrs.test.ts`: Validates new card initialization, FSRS rating outcomes, stability growth on Good/Easy ratings, and interval text previews (`10m`, `5h`, `3d`).
- `__tests__/quiz.test.ts`: Validates multiple-choice question generation, duplicate distractor prevention, matching pair construction, and active recall typing answer normalization.
- `__tests__/backup.test.ts`: Validates Zod backup schema compliance, schema versioning, and rejection of malformed or corrupted backup payloads.

---

## Project Structure

```
my-anki/
├── __tests__/                  # Unit tests (FSRS, Quiz, Backup)
├── assets/                     # App icons and splash assets
├── src/
│   ├── app/                    # Expo Router file-based screens
│   │   ├── _layout.tsx         # Root provider, DB init, status bar
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx     # 5-tab bar (Home, Decks, Study, Stats, Settings)
│   │   │   ├── index.tsx       # Dashboard with streak, progress, and quick study
│   │   │   ├── decks.tsx       # Deck management & subdeck trees
│   │   │   ├── study.tsx       # Study hub & 5 quiz modes launcher
│   │   │   ├── stats.tsx       # Local learning analytics & FSRS distribution
│   │   │   └── settings.tsx    # Backup & Restore, Theme, and Offline explainer
│   │   ├── deck/
│   │   │   ├── [id].tsx        # Deck detail, search, POS filter, word list
│   │   │   └── form.tsx        # Create & edit deck modal
│   │   ├── word/
│   │   │   ├── form.tsx        # Fast mobile word entry form (RHF + Zod)
│   │   │   └── [id].tsx        # Word detail & FSRS stability/difficulty inspector
│   │   ├── review/
│   │   │   └── [deckId].tsx    # Interactive FSRS flashcard study session
│   │   └── quiz/
│   │       ├── [deckId].tsx    # Quiz setup & question count selector
│   │       ├── session.tsx     # Active quiz session (MC, Typing, Matching)
│   │       └── summary.tsx     # Quiz score, missed words list, retry action
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Button, Card, Header, Input, Badge, EmptyState
│   │   ├── flashcard/          # 3D Flip Card & FSRS Rating Buttons
│   │   └── quiz/               # Multiple Choice, Typing, and Matching quiz views
│   ├── constants/              # Light & Dark color palettes
│   ├── db/                     # SQLite client, schema, migrations, seed data
│   │   └── repositories/       # Typed DB repositories (deck, word, review, quiz, settings)
│   ├── services/               # FSRS scheduling, quiz generator, backup & stats
│   ├── store/                  # Zustand themeStore & studyStore
│   ├── types/                  # TypeScript interfaces and Zod schemas
│   └── utils/                  # Haptic triggers and date formatters
├── app.json                    # Expo project configuration
├── package.json
└── tsconfig.json
```
