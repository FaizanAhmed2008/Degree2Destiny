# 🎯 Degree2Destiny

A production-grade, AI-powered platform connecting ambitious students, dedicated professors, and forward-thinking recruiters. Built with **Next.js**, **TypeScript**, **Firebase**, and **Google Gemini AI**.

## ✨ Overview

Degree2Destiny revolutionizes the way students develop their career skills and connect with opportunities. The platform eliminates traditional MCQ-based assessments in favor of **real-world, practical challenges** evaluated by AI and professional mentors.

### 🎭 Three Role Ecosystem

- **🧑‍🎓 Students**: Complete skill development, verification, and career readiness
- **👨‍🏫 Professors/Mentors**: Manage and verify student skills with comprehensive feedback
- **💼 Recruiters/HR**: Discover, filter, and interview qualified candidates

---

## 🚀 Core Features

### 🔐 Authentication & Role-Based System
- Secure Firebase Authentication
- Three distinct user roles with isolated dashboards
- Protected routes and role-based access control
- Persistent user sessions

### 🧑‍🎓 Student Module

#### Smart Onboarding Flow
- Career interests and role preferences
- Job type selection (internship, full-time, remote, etc.)
- Initial skill assessment
- Profile completion with portfolio links

#### Skill Management & Verification
- **Manual Skill Addition**: Students can add skills with proof links (GitHub, portfolio, etc.)
- **AI-Powered Skill Interviews**: 
  - 5-question practical assessments powered by Google Gemini AI
  - Real-time evaluation with scoring
  - Skill level determination (beginner → expert)
  - Strength and weakness analysis
- **Professor Verification**: Traditional manual verification by academic mentors
- **Verification Status Tracking**: Not Requested → Pending → Verified/Rejected
- **Auto Skill Scoring**: Calculated from assessments and verifications

#### Career Development
- Job readiness score and level tracking
- Skills dashboard with verification statuses
- AI-generated insights and improvement suggestions
- Learning roadmaps based on skill gaps

### 👨‍🏫 Professor Dashboard
- View pending student verification requests
- Approve or reject student verifications
- Provide feedback and remarks
- Track verification history
- Student skill assessment and scoring

### 💼 Recruiter Features
- Browse verified students
- Filter by skills, job readiness, and experience level
- View student portfolios and projects
- Schedule interviews with candidates
- Track candidate pipeline

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **AI/ML** | Google Gemini AI API |
| **Forms** | React Hook Form |
| **Charts** | Recharts |
| **Date Handling** | date-fns |

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── index.tsx                 # Landing page
│   ├── login.tsx                 # Login page
│   ├── register.tsx              # Registration page
│   ├── system-status.tsx         # System health checks
│   ├── api/                      # API endpoints
│   │   ├── ai/
│   │   │   └── chat.ts          # Destiny AI chat endpoint
│   │   ├── destiny-ai/
│   │   │   └── chat.ts          # AI interview chat
│   │   ├── interviews/
│   │   │   ├── ai-interview.ts  # AI interview handler
│   │   │   └── save-transcript.ts
│   │   ├── matching/
│   │   │   └── job.ts           # Job matching endpoint
│   │   ├── skills/
│   │   │   └── verify-request.ts
│   │   └── students/
│   │       └── insights.ts      # AI insights generation
│   ├── student/
│   │   ├── dashboard.tsx
│   │   ├── profile.tsx
│   │   ├── skills-manage.tsx    # Skill management interface
│   │   ├── assessments.tsx
│   │   ├── onboarding.tsx
│   │   └── ...
│   ├── professor/
│   │   ├── dashboard.tsx        # Verification management
│   │   └── profile.tsx
│   └── recruiter/
│       ├── dashboard.tsx
│       └── profile.tsx
├── components/
│   ├── AIInterview.tsx          # AI interview UI
│   ├── VerificationCard.tsx     # Verification status display
│   ├── VerificationRequests.tsx # Pending requests list
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   └── ...
├── services/
│   ├── studentService.ts        # Student operations
│   ├── aiService.ts             # AI integration
│   ├── matchingService.ts       # Job matching
│   └── aiInterviewService.ts    # Interview logic
├── context/
│   ├── AuthContext.tsx          # Authentication state
│   └── ThemeContext.tsx         # Dark mode theme
├── types/
│   └── index.ts                 # TypeScript type definitions
├── firebase/
│   └── firebaseConfig.ts        # Firebase configuration
└── styles/
    └── globals.css              # Global styles
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project (Firestore + Auth enabled)
- Google Gemini API key
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Degree2Destiny.git
   cd Degree2Destiny
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Firebase and Gemini API credentials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

---

## 📝 Usage Guide

### For Students

1. **Register** with email and select "Student" role
2. **Complete Onboarding**:
   - Enter career interests and job preferences
   - List initial skills
   - Add portfolio links
3. **Manage Skills**:
   - Add new skills manually with proof links
   - Take AI interviews to get skill verification
   - Request professor verification
4. **Track Progress**:
   - Monitor job readiness score
   - View verification status
   - Access AI-generated learning insights

### For Professors

1. **Register** with "Professor" role
2. **Review Verification Requests**:
   - View pending student skills
   - Check skill level and proof
   - Approve or reject with feedback
3. **Track Students**:
   - Monitor skill verification history
   - Provide development recommendations

### For Recruiters

1. **Register** with "Recruiter" role
2. **Search Candidates**:
   - Filter by verified skills
   - Sort by job readiness
   - Review portfolios
3. **Connect**:
   - View student profiles
   - Schedule interviews
   - Track applications

---

## 🤖 AI Interview System

The AI Interview feature powers practical skill assessment:

### How It Works
1. Student initiates interview for a specific skill
2. Google Gemini AI conducts 5 practical questions
3. Real-time evaluation and scoring
4. Instant results with strengths/weaknesses
5. Score used for job readiness calculation

### Features
- Context-aware questions based on skill level
- Real-world scenario-based challenges
- Comprehensive skill level assessment
- Detailed evaluation report
- Interview transcript stored for review

---

## 🔄 API Endpoints

### AI Endpoints
- `POST /api/ai/chat` - Destiny AI chat
- `POST /api/destiny-ai/chat` - Direct AI chat

### Interview Endpoints
- `POST /api/interviews/ai-interview` - Start/continue interview
- `POST /api/interviews/save-transcript` - Save interview data

### Skill Endpoints
- `POST /api/skills/verify-request` - Request skill verification

### Job Matching
- `GET /api/matching/job` - Find matching jobs

### Student Insights
- `POST /api/students/insights` - Generate AI insights

---

## 🎯 Data Models

### StudentSkill
```typescript
{
  id: string;
  name: string;
  category: string;
  selfLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;              // 0-100
  proofLinks: string[];
  verificationStatus: 'not-requested' | 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;        // Professor UID or "AI"
  verifiedAt?: timestamp;
  assessments: Assessment[];
  lastUpdated: string;        // ISO timestamp
  interviewTranscript?: InterviewTranscript;
  interviewEvaluation?: InterviewEvaluation;
}
```

### StudentProfile
```typescript
{
  uid: string;
  email: string;
  fullName: string;
  role: 'student';
  skills: StudentSkill[];
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  verificationStatus: VerificationStatus;
  jobReadinessScore: number;
  jobReadinessLevel: JobReadinessLevel;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

---

## 🔐 Security

- **Firebase Authentication**: Secure user authentication
- **Role-Based Access Control**: Each role has specific permissions
- **Protected Routes**: Unauthorized users redirected to login
- **Data Validation**: Server-side validation for all inputs
- **CORS Configuration**: Restricted API access
- **Environment Variables**: Sensitive data not exposed in client code

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy with one click

### Deploy to Other Platforms
- Firebase Hosting: `firebase deploy`
- Netlify, AWS, GCP, Azure: Follow their Next.js deployment guides

---

## 📊 Key Metrics & Scoring

### Job Readiness Score
- Calculated from verified skills
- Weights verified skills with +10 bonus
- Scale: 0-100

### Job Readiness Levels
- **Not Ready**: Score < 50
- **Developing**: Score 50-69
- **Ready**: Score 70-84
- **Highly Ready**: Score ≥ 85

### Skill Scoring
- From AI interview: 0-100 based on answers
- From professor verification: Custom score
- Auto-calculated from assessments

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow TypeScript and React best practices
- Ensure code is well-documented
- Add tests for new features
- Update README if adding new features
- Follow existing code style and patterns

### Areas for Contribution
- 🐛 Bug fixes and improvements
- ✨ New features (video interview, certifications, etc.)
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- 🚀 Performance optimization
- 🧪 Test coverage

### Reporting Issues
If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, etc.)

---

## 👥 Contributors

Special thanks to all contributors who have helped make Degree2Destiny better:

| Name | Role | Contribution |
|------|------|--------------|
| Sohail | Lead Developer | Core platform development |
| Your Friend Here | Contributor | [Specific contributions] |
| Community | Contributors | Bug fixes, features, docs |

**Want to be featured here?** Make a contribution and get recognized! 🌟

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🔗 Links & Resources

- **Live Demo**: [Coming Soon]
- **Documentation**: See `PROJECT_DOCUMENTATION.md` for detailed docs
- **Issues**: [GitHub Issues](https://github.com/yourusername/Degree2Destiny/issues)
- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Gemini API**: https://ai.google.dev

---

## 💬 Support

Having issues? Here's how to get help:

1. **Check Existing Issues**: Search GitHub issues for similar problems
2. **Read Documentation**: Check our detailed project documentation
3. **Discord Community**: [Coming Soon]
4. **Email**: [Your Email Here]

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering intelligent skill assessments
- **Firebase** for reliable backend infrastructure
- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for beautiful styling
- **Community Contributors** for ongoing support and feedback

---

<div align="center">

**Made with ❤️ by Sohail and Contributors**

⭐ Star us on GitHub if you find this helpful!

[GitHub](https://github.com/yourusername/Degree2Destiny) | [Live Demo](https://degree2destiny.vercel.app) | [Report Bug](https://github.com/yourusername/Degree2Destiny/issues)

</div>
