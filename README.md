# ExamForge

ExamForge is a locally runnable online exam platform for instructors and students. Instructors manage question banks, publish timed exams, and review results; students complete a single saved attempt with automatic scoring.

## Technology

- Frontend: React, TypeScript, React Router, Redux Toolkit, and Vite
- Backend: Node.js, Express, and TypeScript REST API
- Database: MongoDB with Mongoose
- Authentication: password hashing and JWT-backed sessions

## Features

- Student and instructor accounts with protected role-based pages
- Exam creation and publication with duration, question count, total and passing marks, availability dates, and optional negative marking
- Single-correct and multi-select questions with a question bank
- Random question selection saved to each attempt for refresh-safe resume
- One attempt per student and exam, enforced by a MongoDB unique index
- Server-calculated time from the stored attempt start time; expired attempts are scored and closed on the next attempt request
- Answers saved as they are selected and scored on the backend
- Instructor attempt summaries and per-question answer review

## Run locally

Requirements: Node.js 20.19+ or 22.12+, npm, and a MongoDB database accessible from the machine.

1. Create `server/.env` from `server/.env.example` and set `MONGO_URI`, `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET`.
2. Create `frontend/.env` from `frontend/.env.example`. The default API URL is `http://localhost:5000/api`.
3. In a terminal, install and start the API:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

4. In a second terminal, install and start the web app:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite and register instructor and student accounts. New accounts remain pending until an administrator approves them. Once approved, create and publish an exam from the instructor account.

Password reset email requires valid SMTP settings in `server/.env`. Do not commit either `.env` file or real credentials.

## Project structure

Frontend pages and components are grouped by the feature they belong to, so the student exam list and attempt screen have predictable locations.

```text
frontend/src/
  app/                         App routes and protected-route wrapper
  config/                      Shared frontend configuration
  features/
    admin/pages/               Admin screens
    auth/pages/                Login, registration, password recovery
    auth/components/            Login and authentication UI
    auth/types.ts              Authentication types
    exam/pages/                 Exam setup, question bank, active attempt
    exam/components/            Exam and question UI
    exam/hooks/                 Attempt state and API interactions
    instructor/pages/           Instructor dashboard, exams, results
    instructor/components/      Instructor result UI
    student/pages/              Student dashboard, profile, preferences
    student/components/         Student exam list and dashboard UI
  redux/                       Shared application state
  services/                    Shared API services

server/
  config/                       Database and app configuration
  middleware/                   Authentication and request middleware
  models/                       MongoDB models
  routes/
    admin/ auth/                 Admin and authentication endpoints
    attempts/                    Attempt lifecycle, scoring, results
    exams/                       Exam creation, publishing, and access
    profiles/ questions/         Profile and question-bank endpoints
  scripts/                      Local database and seed utilities
```

For example, start with `frontend/src/features/student/pages/StudentDashboard.tsx` for the student dashboard, `frontend/src/features/student/components/StudentExamFeed.tsx` for the available exam list, and `frontend/src/features/exam/pages/ExamPage.tsx` for the active exam screen. Matching backend endpoints are grouped under `server/routes/exams/` and `server/routes/attempts/`.
