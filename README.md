# Degree2Destiny

AI-powered platform connecting students, professors, and recruiters. Built with Next.js, TypeScript, Firebase, and Google Gemini AI.

## Overview

Degree2Destiny helps students develop skills, get verified by mentors, and connect with career opportunities through AI-powered assessments and real-world challenges.

**Three Roles:**
- Students: Skill development and career readiness
- Professors: Verify student skills with feedback
- Recruiters: Discover and interview qualified candidates

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project
- Google Gemini API key

### Installation

```bash
git clone https://github.com/yourusername/Degree2Destiny.git
cd Degree2Destiny
npm install
```

### Environment Setup

Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth
- **AI:** Google Gemini API
- **Forms:** React Hook Form
- **Charts:** Recharts

## Key Features

- **AI Skill Interviews:** 5-question assessments powered by Gemini AI
- **Skill Verification:** Manual verification by professors
- **Job Readiness Score:** Auto-calculated from verified skills
- **Role-Based Dashboard:** Isolated interfaces for each user role
- **Portfolio Integration:** Link GitHub, portfolio, and LinkedIn

## Build & Deploy

```bash
npm run build
npm run start
```

Deploy to [Vercel](https://vercel.com) or Firebase Hosting.

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** changes: `git commit -m 'Add your feature'`
4. **Push** to branch: `git push origin feature/your-feature`
5. **Open** a Pull Request

### Guidelines
- Follow TypeScript and React best practices
- Write clean, documented code
- Add tests for new features
- Update README for significant changes
- Match existing code style

### Contribution Areas
- Bug fixes and improvements
- New features (video interviews, certifications, etc.)
- Documentation and examples
- UI/UX enhancements
- Performance optimization
- Test coverage

### Report Issues
Open an issue with:
- Clear problem description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

## License

MIT License - see LICENSE file for details

## Links

- **Documentation:** [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- **Firebase:** https://firebase.google.com/docs
- **Next.js:** https://nextjs.org/docs
- **Gemini API:** https://ai.google.dev

---

Made with ❤️ by Sohail and Contributors
