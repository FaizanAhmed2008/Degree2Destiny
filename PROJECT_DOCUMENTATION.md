# Degree2Destiny - Project Documentation

## 🎯 Project Overview

Degree2Destiny is a production-grade, AI-powered platform connecting ambitious students, dedicated professors, and forward-thinking recruiters. Built with Next.js, TypeScript, Firebase, and Google Gemini AI.

The platform enables:
- **Students**: Complete onboarding, skill tracking, verification, and career development
- **Professors/Mentors**: Student management, skill verification, and feedback
- **Recruiters/HR**: Candidate discovery, filtering, and interview management

---

## 🚀 Core Features

### 🔐 Authentication & Role-Based System
- **Secure role-based system** with three distinct roles:
  - **Student**: Complete onboarding, skill tracking, and career development
  - **Professor/Mentor**: Student management, skill verification, and feedback
  - **Recruiter/HR**: Candidate discovery, filtering, and interview management
- Protected routes and isolated dashboards for each role
- Firebase Authentication integration

### 🧑‍🎓 Student Module

#### Smart Onboarding Flow
- Career interests and role preferences
- Job type selection (internship, full-time, remote, etc.)
- Skills with self-assessment levels
- Projects, achievements, and certifications
- Portfolio and GitHub integration

#### Skill Verification System
- **AI-Powered Skill Interviews**: Practical assessments through AI mock interviews
- **Traditional Verification**: Professor-based manual verification
- No MCQ-based tests - real-world challenges only
- Submission handling and professor evaluation
- Auto skill scoring and job readiness indicator

#### AI Interview Feature
The platform includes a comprehensive AI-powered interview system:

**Interview Component** (`src/components/AIInterview.tsx`):
- Modal-based interview interface
- Real-time message display with role-based styling
- Question counter showing progress (1/5)
- Live evaluation results display with:
  - Overall score (0-100)
  - Skill level assessment
  - Strengths identified
  - Areas for improvement
  - Question-by-question feedback
- Dark mode support
- Keyboard shortcut (Ctrl+Enter) for quick submission
- Error handling with user-friendly messages

**Interview Workflow**:
1. Student enters skill name and proficiency level
2. Clicks "🤖 AI Interview" button
3. AI Interview modal launches
4. Student completes 5-question interview
5. Receives immediate evaluation
6. Skill is automatically saved as "AI-verified"

**Interview Progression**:
- Q1-Q2: Basic conceptual questions
- Q3-Q4: Intermediate problem-solving questions
- Q5: Advanced scenario question
- Final evaluation in JSON format with scoring

#### Student Dashboard
- Real-time skill scores and progress tracking
- AI-generated insights (strengths, weaknesses, recommendations)
- Suggested roles based on skills and interests
- Learning roadmap generation
- Readiness score visualization with charts
- Portfolio and GitHub integration
- Top skills showcase

#### Skill Management
- Add skills with self-assessment levels
- Proof links (GitHub, portfolio)
- Set skill points (0-100) using slider
- Verification status tracking (Pending/Verified/Rejected)
- Edit and delete skills
- View AI interview transcripts

### 👨‍🏫 Professor/Mentor Module

#### Professor Dashboard
- View all assigned students
- Review assessment submissions
- Verify/reject student skills
- Provide structured feedback
- Progress tracking with analytics
- Student verification badges
- AI-assisted feedback generation
- Filter students by:
  - Skill name
  - Min/max skill points
  - Readiness level
- View pending skill verification requests
- Accept or reject verification requests with feedback

### 🧑‍💼 Recruiter/HR Module

#### Recruiter Dashboard
- Browse and search students
- Advanced filtering:
  - Skill and score filters
  - Verified students only
  - Job readiness level
  - Role preferences
  - Job type preferences
  - Verification status dropdown (All/Verified/Pending/Rejected)
- Clean recruiter-friendly student profiles
- Shortlist and save candidates
- Interview request system
- Anti-spam controls
- Skill verification status visibility

### 🧠 AI Integration (Google Gemini)

#### AI-Powered Features
- Student skill analysis and insights
- Strengths and weaknesses identification
- Personalized learning roadmaps
- Role matching and recommendations
- Professor feedback assistance
- Recruiter candidate matching
- AI-powered skill interviews (5 progressive questions with evaluation)

#### AI Services
- **aiService.ts**: Core AI analysis and insights
- **aiInterviewService.ts**: Interview session management and evaluation parsing
- **matchingService.ts**: Student-to-job matching engine

#### API Endpoints
- `/api/ai/chat` - AI chat endpoint
- `/api/destiny-ai/chat` - Destiny AI assistant
- `/api/students/insights` - Generate student insights
- `/api/matching/job` - Match students to jobs
- `/api/interviews/ai-interview` - AI interview endpoints (start, answer, transcript, end)
- `/api/interviews/save-transcript` - Save interview transcripts
- `/api/skills/verify-request` - Skill verification request management

#### All AI outputs are explainable and controlled
- Sanitized data only - no direct database access
- Proper error handling with retry logic
- Input validation and sanitization
- Response validation before processing

### 🎨 UI/UX
- Modern, clean, professional design
- Fully responsive (mobile, tablet, desktop)
- Light & dark mode support
- Smooth animations and transitions
- Intuitive dashboards
- Accessible components
- Theme toggle with localStorage persistence

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini Pro API (gemini-1.5-flash model)
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Build Tool**: Next.js with TypeScript support

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Firebase account
- Google Gemini API key

### Quick Start - Commands to Run After Cloning

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/Degree2Destiny.git
cd Degree2Destiny
```

#### 2️⃣ Install Dependencies
```bash
npm install
```

**What it does**: Installs all required packages from `package.json` including:
- Next.js 14
- React 18
- Firebase SDKs
- Google Generative AI
- Tailwind CSS
- Other utilities

**Time**: ~2-3 minutes

#### 3️⃣ Set Up Environment Variables
Create a `.env.local` file in the root directory with your credentials:

```bash
# Firebase Configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API Key (for AI features including interview feature)
GEMINI_API_KEY=your_gemini_api_key
```

#### How to Get These Values

**Firebase Credentials**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings → Service Accounts
4. Copy the credentials

**Gemini API Key**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy and paste into `.env.local`

#### 4️⃣ Run Development Server
```bash
npm run dev
```

**What it does**:
- Starts Next.js dev server on http://localhost:3000
- Hot reloads on file changes
- Shows any build errors in terminal

**Expected output**:
```
> next dev

  ▲ Next.js 14.2.35
  - Environments: .env.local

   Linting and checking validity of types ...
   ✓ Ready in 3.2s
   ✓ Ready in 3200ms

   → Local:        http://localhost:3000
   → Environments: .env.local
```

#### 5️⃣ Open in Browser
Visit: http://localhost:3000

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Create production build |
| `npm run start` | Run production build locally |
| `npm run lint` | Check for code issues |

---

## 📁 Project Structure

```
Degree2Destiny/
├── src/
│   ├── components/
│   │   ├── AIInterview.tsx           # AI Interview modal interface
│   │   ├── AIInsightsCard.tsx        # AI insights display component
│   │   ├── Chatbot.tsx               # Role-specific chatbot
│   │   ├── Logo.tsx                  # Reusable logo component
│   │   ├── Navbar.tsx                # Navigation bar
│   │   ├── ProfileDropdown.tsx       # User profile menu
│   │   ├── ProtectedRoute.tsx        # Role-based route protection
│   │   ├── RoleBadge.tsx            # Role indicator badge
│   │   ├── SkillCard.tsx            # Individual skill display
│   │   └── ThemeToggle.tsx          # Dark/light mode toggle
│   ├── context/
│   │   ├── AuthContext.tsx           # Authentication and role management
│   │   └── ThemeContext.tsx          # Theme state management
│   ├── firebase/
│   │   └── firebaseConfig.ts         # Firebase initialization
│   ├── pages/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── chat.ts          # AI chat endpoint
│   │   │   ├── destiny-ai/
│   │   │   │   └── chat.ts          # Destiny AI endpoint
│   │   │   ├── interviews/
│   │   │   │   ├── ai-interview.ts  # AI interview API
│   │   │   │   └── save-transcript.ts # Transcript storage
│   │   │   ├── matching/
│   │   │   │   └── job.ts           # Job matching endpoint
│   │   │   ├── skills/
│   │   │   │   └── verify-request.ts# Skill verification API
│   │   │   └── students/
│   │   │       └── insights.ts      # Student insights endpoint
│   │   ├── company/
│   │   │   ├── dashboard.tsx
│   │   │   └── profile.tsx
│   │   ├── professor/
│   │   │   ├── dashboard.tsx
│   │   │   └── profile.tsx
│   │   ├── recruiter/
│   │   │   ├── dashboard.tsx
│   │   │   └── profile.tsx
│   │   ├── student/
│   │   │   ├── assessments.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── onboarding.tsx
│   │   │   ├── profile.tsx
│   │   │   └── skills-manage.tsx
│   │   ├── student-profile/
│   │   │   └── [studentId].tsx
│   │   ├── _app.tsx
│   │   ├── index.tsx                # Landing page
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── system-status.tsx        # System health and demo utilities
│   │   ├── admin-demo-utils.tsx     # Demo data seeding
│   │   └── under-development.tsx    # Feature placeholder page
│   ├── services/
│   │   ├── aiService.ts             # AI analysis services
│   │   ├── aiInterviewService.ts    # AI interview session management
│   │   ├── matchingService.ts       # Job matching logic
│   │   └── studentService.ts        # Student data services
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── utils/
│   │   └── seedDemoData.ts          # Demo data generator
│   └── styles/
│       └── globals.css              # Global styles
├── public/
│   ├── D2D_logo.png                # Main logo
│   ├── file.svg
│   ├── logo.svg
│   └── videos/
│       ├── hero-video.mp4          # Hero section video
│       └── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── next-env.d.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md                        # Backup of main documentation
```

---

## 👥 User Roles & Workflows

### Student Role
1. **Registration**: Create account and select "Student" role
2. **Onboarding**: Complete multi-step onboarding form
3. **Skill Management**: Add skills and submit for verification
4. **AI Verification**: Complete AI interview for skill verification
5. **Dashboard**: Track progress and view AI insights
6. **Job Matching**: Discover matched job opportunities

### Professor Role
1. **Registration**: Create account and select "Professor" role
2. **Student Management**: View assigned students
3. **Skill Verification**: Review and approve/reject skill verifications
4. **Feedback**: Provide detailed feedback on student submissions
5. **Analytics**: Track student progress and readiness

### Recruiter Role
1. **Registration**: Create account and select "Recruiter" role
2. **Candidate Search**: Browse and filter students
3. **Skill Filtering**: Find students with specific verified skills
4. **Candidate Profiles**: View comprehensive student profiles
5. **Interview Requests**: Request interviews with candidates
6. **Shortlisting**: Save and manage candidate lists

---

## 🧪 Testing & Demo Preparation

### Seed Demo Data
1. Navigate to System Status page (link in navbar after login)
2. Click "Demo Utilities"
3. Click "Seed Demo Data"
4. Wait for confirmation

### Testing Checklist
- [ ] Landing page loads at `http://localhost:3000`
- [ ] Can click "Learn More" button (smooth scroll works)
- [ ] Can toggle dark/light theme
- [ ] Can navigate to Login page
- [ ] Can navigate to Register page
- [ ] No errors in browser console
- [ ] No errors in terminal

### Demo Students Info
The demo data creates students with:
- Names: Alex Johnson, Sarah Chen, Michael Brown, Emily Davis, James Wilson
- Email format: demo.student[1-5]@degree2destiny.com
- 10 varied skills per student (React, Node.js, Python, JavaScript, TypeScript, MongoDB, SQL, Docker, AWS, Git)
- Skill points range from 55 to 90 (different for each student)
- Mix of verified and pending skills
- Realistic readiness scores

---

## 🔒 Security

- Firebase Authentication for secure user management
- Protected routes based on user roles
- Input validation and sanitization (especially for AI features)
- Rate limiting on API endpoints
- Secure API key management via environment variables
- No direct database access from client-side

---

## 🐛 Known Issues & Fixes

### AI Interview Feature
All critical bugs have been fixed:
1. ✅ Input sanitization prevents control character crashes
2. ✅ System prompt enforces one question per message
3. ✅ Error handling with retry logic for network failures
4. ✅ Model updated to `gemini-1.5-flash` (stable, current)
5. ✅ Response validation before JSON parsing

### Build & Dev Server
All issues resolved:
1. ✅ Browser-only APIs properly guarded with `typeof window !== 'undefined'`
2. ✅ Deprecated `window.pageYOffset` replaced with `window.scrollY`
3. ✅ ThemeContext localStorage access protected
4. ✅ All document/window access has client-side guards

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - All `NEXT_PUBLIC_*` variables
   - `GEMINI_API_KEY`
3. Deploy automatically on push

### Deploy to Firebase Hosting
```bash
npm run build
firebase deploy
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Environment Variables Reference

See `.env.example` for all required environment variables.

**Required**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GEMINI_API_KEY`

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Google Gemini AI for intelligent insights
- Firebase for backend infrastructure
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling

---

## 📞 Support

For support, email support@degree2destiny.com or open an issue in the repository.

---

Built with ❤️ for the future of education and career development.
