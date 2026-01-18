# Degree2Destiny - AI-Powered Student-Professor-Recruiter Hiring Platform

A production-grade, AI-powered platform connecting ambitious students, dedicated professors, and forward-thinking recruiters. Built with Next.js, TypeScript, Firebase, and Google Gemini AI.

## 🚀 Features

### 🔐 Authentication & Roles
- **Secure role-based system** with three distinct roles:
  - **Student**: Complete onboarding, skill tracking, and career development
  - **Professor/Mentor**: Student management, skill verification, and feedback
  - **Recruiter/HR**: Candidate discovery, filtering, and interview management
- Protected routes and isolated dashboards for each role
- Firebase Authentication integration

### 🧑‍🎓 Student Module
- **Smart Onboarding Flow**:
  - Career interests and role preferences
  - Job type selection (internship, full-time, remote, etc.)
  - Skills with self-assessment levels
  - Projects, achievements, and certifications
  - Portfolio and GitHub integration

- **Skill Verification System**:
  - Practical assessments (micro-tasks, bug-fixes, scenarios, build challenges)
  - No MCQ-based tests - real-world challenges only
  - Submission handling and professor evaluation
  - Auto skill scoring and job readiness indicator

- **Student Dashboard**:
  - Real-time skill scores and progress tracking
  - AI-generated insights (strengths, weaknesses, recommendations)
  - Suggested roles based on skills and interests
  - Learning roadmap generation
  - Readiness score visualization with charts
  - Portfolio and GitHub integration

### 👨‍🏫 Professor/Mentor Module
- **Professor Dashboard**:
  - View all assigned students
  - Review assessment submissions
  - Verify/reject student skills
  - Provide structured feedback
  - Progress tracking with analytics
  - Student verification badges
  - AI-assisted feedback generation

### 🧑‍💼 Recruiter/HR Module
- **Recruiter Dashboard**:
  - Browse and search students
  - Advanced filtering:
    - Skill and score filters
    - Verified students only
    - Job readiness level
    - Role preferences
    - Job type preferences
  - Clean recruiter-friendly student profiles
  - Shortlist and save candidates
  - Interview request system
  - Anti-spam controls

### 🧠 AI Integration (Google Gemini)
- **AI-Powered Features**:
  - Student skill analysis and insights
  - Strengths and weaknesses identification
  - Personalized learning roadmaps
  - Role matching and recommendations
  - Professor feedback assistance
  - Recruiter candidate matching
- All AI outputs are explainable and controlled
- Sanitized data only - no direct database access

### 🎨 UI/UX
- Modern, clean, professional design
- Fully responsive (mobile, tablet, desktop)
- Light & dark mode support
- Smooth animations and transitions
- Intuitive dashboards
- Accessible components

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini Pro API
- **Charts**: Recharts
- **Forms**: React Hook Form

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Degree2Destiny
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
   NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config to `.env.local`

5. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Add it to `.env.local`

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AIInsightsCard.tsx
│   ├── Chatbot.tsx
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   └── SkillCard.tsx
├── context/            # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── firebase/           # Firebase configuration
│   └── firebaseConfig.ts
├── pages/              # Next.js pages and API routes
│   ├── api/            # API endpoints
│   ├── recruiter/      # Recruiter pages
│   ├── professor/      # Professor pages
│   └── student/        # Student pages
├── services/           # Business logic and API services
│   ├── aiService.ts
│   ├── matchingService.ts
│   └── studentService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── styles/             # Global styles
    └── globals.css
```

## 🔑 Key Features Implementation

### Student Onboarding
- Multi-step onboarding flow
- Career interest collection
- Skill self-assessment
- Project and achievement tracking
- Portfolio link integration

### Skill Verification
- Assessment creation and submission
- Professor review and evaluation
- Skill score calculation
- Verification status tracking

### AI Insights
- Automated skill analysis
- Strengths and weaknesses identification
- Personalized recommendations
- Learning roadmap generation
- Role matching suggestions

### Matching Engine
- Student-to-job matching
- Skill-based filtering
- Readiness score consideration
- AI-powered recommendations

## 🔒 Security

- Firebase Authentication for secure user management
- Protected routes based on user roles
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure API key management via environment variables

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (Recommended)
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

3. **Or deploy to Firebase Hosting**
   ```bash
   npm run build
   firebase deploy
   ```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent insights
- Firebase for backend infrastructure
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling

## 📞 Support

For support, email support@degree2destiny.com or open an issue in the repository.

---

Built with ❤️ for the future of education and career development.
