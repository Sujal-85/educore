# EduCore: Advanced AI-Powered Student Portal

EduCore is a modern, high-performance educational management system designed to bridge the gap between students and teachers through intelligent automation, real-time data tracking, and a premium glassmorphic user interface.

## 🚀 Quick Overview
- **System Name**: EduCore (also referred to as FAMT Edu / EduCore Portal)
- **Primary Goal**: To provide students with personalized AI learning paths and teachers with data-driven classroom management tools.
- **Design Philosophy**: Adaptive glassmorphism, fluid animations, and high accessibility in both light and dark modes.

---

## 🛠 Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Core** | React 18, Vite, TypeScript |
| **State Management** | Zustand (Persistent & Real-time) |
| **Styling** | Tailwind CSS, Framer Motion, Vanilla CSS Variables |
| **Backend/BaaS** | Firebase (Auth, Firestore, Cloud Storage) |
| **AI Integration** | Google Generative AI (Gemini 1.5 Flash) |
| **Utilities** | Lucide Icons, Recharts, React-Hot-Toast |

---

## 💎 Core Feature Modules

### 1. Unified Authentication & Onboarding
- **Google OAuth Integration**: seamless login with automatic profile data extraction (Name, Email, Profile Picture).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Teacher` and `Student` roles.
- **Dynamic Onboarding**: Detects new users and guides them through account setup (Class, Section, etc.).

### 2. Intelligent Dashboard
- **Teacher View**: Class-wide performance metrics, attendance trends, and behavioral alerts.
- **Student View**: Individual progress tracking, upcoming assignments, and personalized notices.
- **AI Performance Insights**: Integrated "FAMTBot" provides real-time commentary on academic trends using Gemini.

### 3. AI Learning Hub
- **Personalized Study Plans**: Generates custom week-long study schedules based on a student's weak subjects and learning preferences.
- **FAMTBot AI Assistant**: A persistent chatbot capable of answering academic questions, explaining site features, and providing administrative help.
- **Smart Reports**: Analyzes student marks to generate professional academic summaries with AI-suggested improvement areas.

### 4. Classroom Management
- **Attendance Tracking**: Simple, date-based attendance logging for teachers with historical viewing for students.
- **Assignment System**: Teachers can post assignments with file attachments; students can submit work for grading.
- **Marks & Grading**: Centralized gradebook supporting Mid-Term, Final, and Unit Test cycles.
- **Behavior Scoring**: Gamified behavioral tracking system that impacts leaderboard rankings.

### 5. Smart Library (Book-Buddy)
- **Inventory Management**: Real-time tracking of book availability and subject categories.
- **Request Workflow**: Digital "Issue", "Return", and "Renew" requests synchronized across student and teacher panels.
- **AI Voice Search**: Integrated voice assistant for hands-free book discovery.

### 6. Administrative Tools
- **Fee Management**: Real-time payment tracking, receipt generation, and "Paid/Pending" status monitoring.
- **Notice Board**: Targeted broadcast system (Everyone, Teachers, or Specific Classes).
- **Timetable Engine**: Dynamic schedule management for different classes and sections.
- **Seed System**: Teacher-only capability to populate the system with high-quality demo data for testing.

---

## 🏗 Architecture & Data Flow

### State Management (Zustand)
The application uses a centralized store (`useAppStore.js`) that manages:
- **Global Real-time Sync**: Uses Firebase `onSnapshot` to keep the UI in sync without manual refreshes.
- **Persistent Local State**: Theme preferences and sidebar status are persisted across sessions.

### Database Schema (Firestore Collections)
- `users`: Stores profiles for both teachers and students.
- `assignments`: Task details, deadlines, and resource links.
- `submissions`: Links students to their completed assignments with grading data.
- `notifications`: User-specific and global broadcast alerts.
- `books`: Library inventory.
- `bookRequests`: Workflow tracking for library operations.
- `attendance`: Date-stamped records grouped by class/section.
- `notices`: Administrative announcements.

### Design System
- **Theme Variables**: All components use a CSS variable system (`--background`, `--text-primary`, etc.) for instant light/dark switching.
- **Glassmorphism**: Standardized `.glass` class for semi-transparent, blur-heavy containers.
- **Animations**: Reusable `motion` patterns from Framer Motion for page transitions and card hover states.

---

## 🔒 Security & Performance
- **Firestore Security Rules**: Ensures users can only access data relevant to their role and UID.
- **Lazy Loading**: All core pages are chunked using `React.lazy` to improve initial load speed.
- **AI Rate Limiting**: Optimized model usage (Gemini 1.5 Flash) to maximize quota availability.

---

> [!NOTE]
> This project is designed for FAMT Edu. All AI features require a valid `VITE_GEMINI_API_KEY` for full functionality.
