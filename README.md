# TaskFlow 🎯

A full-stack student productivity app built with the MERN stack. Manage tasks, track study sessions, prep for exams, and take brain breaks — all in one place.

---

## Tech Stack

- **Frontend:** React, React Router v6, CSS Modules
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens)

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
npm install
# Add your MongoDB URI and JWT secret to .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`, backend at `http://localhost:5000`.

### .env (backend)
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## Features

### Auth
- Register and login with JWT-protected routes
- Password change and email update from settings

### Task Management
- Create, edit, delete tasks with due dates, subjects, tags, and subtasks
- Recurring tasks and task templates
- **Eisenhower Matrix** — tasks auto-sorted into 4 quadrants (Do First / Schedule / Quick Do / Do Later) based on urgency and importance
- Overdue task handling — must update due date before marking done

### Today & All Tasks Views
- See only today's tasks or browse everything
- Search and filter by subject or tag

### By Subject
- Tasks grouped by subject for easy navigation

### Analytics
- Donut charts for task distribution by priority and subject
- Completion trends over time
- Mini bar breakdowns across categories

### Flashcards
- Create decks and cards with front/back content
- **Spaced repetition** — cards resurface at intervals (Again / Hard / Good / Easy: 0, 1, 3, 7 days)
- XP rewards for review sessions

### Gamification
- XP system — earn points for completing tasks, Pomodoro sessions, and flashcard reviews
- Level roadmap with titles (Beginner → Legend)
- Daily challenges with XP rewards
- XP gain overlay animations

### Achievements
- Milestone badges for streaks, tasks completed, and Pomodoro sessions

### Pomodoro Timer
- 25-min focus / 5-min break cycle with a circular progress ring
- Skip and reset controls
- **Ambient Sounds** — Rain, Café, Forest, Waves, Fireplace, Space Hum (Web Audio API, no files needed), with volume control
- Session heatmap — 18-week history of daily Pomodoro activity

### Brain Break
- **Reaction Test** — click when it turns green, tracks your best time
- **Memory Tiles** — emoji flip-and-match game, three difficulty levels
- **Word Scramble** — CS/student-themed words with hints and score tracking

### Templates
- Save reusable task templates and apply them when adding tasks

### Calendar Sync
- Google Calendar integration via OAuth (gapi)
- View and sync upcoming tasks and exam deadlines to your calendar
- Setup: create a Google Cloud project, enable Calendar API, add your Client ID

### Profile
- View your stats and export profile as PDF

### Settings
- Dark mode toggle
- 12 accent colour themes (Charcoal, Ocean, Forest, Sunset, Rose, Purple, Teal, Amber, Indigo, Crimson, Slate, Mint)
- Change email and password


### Other
- **Keyboard shortcuts** — global shortcut panel for quick navigation
- **Notification bell** — in-app reminders and updates
- **Study streak** — complete at least one task per day to keep your streak going

---

## Project Structure

```
taskflow-enhanced/
├── backend/
│   ├── models/        # Mongoose schemas (Task, User, Exam, PomodoroSession, Template)
│   ├── routes/        # Express routes (auth, tasks, exams, pomodoro, templates, profile, ai)
│   ├── middleware/    # JWT auth middleware
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Sidebar, Topbar, AppLayout, StudyBuddy, FocusMode, Toast, etc.
        ├── context/     # AuthContext, ThemeContext, GamificationContext
        ├── pages/       # One file per route/page
        └── styles/      # CSS Modules per component
```