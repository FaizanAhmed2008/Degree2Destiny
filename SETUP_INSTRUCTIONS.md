# Setup Instructions for Degree2Destiny (With AI Interview Feature)

## Quick Start - Commands to Run After Cloning

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/Degree2Destiny.git
cd Degree2Destiny
```

### 2️⃣ Install Dependencies
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

### 3️⃣ Set Up Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Option A: Copy from example
cp .env.example .env.local

# Option B: Create and edit manually
# Copy the template below and fill in your values
```

**What to add to `.env.local`:**
```dotenv
# Firebase Configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API Key (for AI features including new interview feature)
GEMINI_API_KEY=your_gemini_api_key
```

**How to get these values:**
1. **Firebase Credentials**: 
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing
   - Go to Project Settings → Service Accounts
   - Copy the credentials

2. **Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Copy and paste into `.env.local`

### 4️⃣ Run Development Server
```bash
npm run dev
```

**What it does**:
- Starts Next.js dev server on http://localhost:3000
- Hot reloads on file changes
- Shows any build errors in terminal

**Expected output:**
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

### 5️⃣ Open in Browser
```
Visit: http://localhost:3000
```

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Create production build |
| `npm run start` | Run production build locally |
| `npm run lint` | Check for code issues |

---

## Verify AI Interview Feature is Working

After running `npm run dev`, test the new AI Interview feature:

1. **Login as Student** → Use test credentials or register new
2. **Go to**: Student Dashboard → Manage Skills
3. **Click**: "Add New Skill" → Enter skill name (e.g., "React")
4. **Click**: "🤖 AI Interview" button
5. **Complete**: Answer 5 interview questions
6. **Verify**: Skill appears with "🤖 AI-Verified" badge

---

## Project Structure (Including New Files)

```
Degree2Destiny/
├── src/
│   ├── components/
│   │   ├── AIInterview.tsx                    ← NEW: Interview modal
│   │   ├── Chatbot.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── services/
│   │   ├── aiInterviewService.ts              ← NEW: Interview logic
│   │   ├── aiService.ts
│   │   ├── studentService.ts
│   │   └── matchingService.ts
│   ├── pages/
│   │   ├── api/
│   │   │   ├── interviews/
│   │   │   │   ├── ai-interview.ts            ← NEW: Interview API
│   │   │   │   └── save-transcript.ts         ← NEW: Transcript saving
│   │   │   ├── ai/
│   │   │   ├── destiny-ai/
│   │   │   ├── matching/
│   │   │   └── students/
│   │   ├── student/
│   │   │   ├── skills-manage.tsx              ← MODIFIED: Added interview
│   │   │   ├── dashboard.tsx
│   │   │   └── ...
│   │   ├── _app.tsx
│   │   ├── index.tsx
│   │   └── ...
│   ├── types/
│   │   └── index.ts                           ← MODIFIED: New interview types
│   ├── firebase/
│   │   └── firebaseConfig.ts
│   ├── context/
│   └── styles/
├── public/
├── package.json
├── package-lock.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── .env.example                               ← Reference file
├── .env.local                                 ← Your secret keys (git-ignored)
├── AI_INTERVIEW_FEATURE.md                    ← NEW: Feature documentation
├── IMPLEMENTATION_COMPLETE.md                 ← NEW: Implementation summary
└── README.md
```

---

## Troubleshooting

### Issue: `GEMINI_API_KEY not found`
**Solution**: 
```bash
# Add to .env.local:
GEMINI_API_KEY=your_actual_gemini_key
```

### Issue: Firebase not connecting
**Solution**:
- Verify all Firebase credentials in `.env.local`
- Check Firestore is enabled in Firebase Console
- Restart dev server after updating `.env.local`

### Issue: "Module not found: aiInterviewService"
**Solution**: Make sure you pulled all changes:
```bash
git pull origin main
npm install  # Reinstall in case new deps added
```

### Issue: Build errors
**Solution**:
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Issue: Port 3000 already in use
**Solution**:
```bash
# Use different port
npm run dev -- -p 3001
```

---

## First-Time Setup Checklist

- [ ] Cloned repository: `git clone`
- [ ] Installed dependencies: `npm install`
- [ ] Created `.env.local` file
- [ ] Added Firebase credentials to `.env.local`
- [ ] Added Gemini API key to `.env.local`
- [ ] Started dev server: `npm run dev`
- [ ] Opened http://localhost:3000 in browser
- [ ] Tested login functionality
- [ ] Tested AI Interview feature (as listed above)

---

## For Production Deployment

### Build for Production
```bash
npm run build
```

### Run Production Build Locally
```bash
npm run start
```

### Deploy to Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## Key Points About New AI Interview Feature

✅ **New Files Added**:
- `src/services/aiInterviewService.ts` - Interview orchestration
- `src/components/AIInterview.tsx` - Interview UI
- `src/pages/api/interviews/ai-interview.ts` - API endpoint
- `src/pages/api/interviews/save-transcript.ts` - Transcript storage

✅ **Modified Files**:
- `src/pages/student/skills-manage.tsx` - Added "🤖 AI Interview" button
- `src/types/index.ts` - Added interview types

✅ **No Breaking Changes**: All existing features work as before

✅ **Fully Integrated**: Uses existing Gemini API key configuration

---

## Need Help?

1. **Check Existing Docs**: `AI_INTERVIEW_FEATURE.md`
2. **Check Implementation Summary**: `IMPLEMENTATION_COMPLETE.md`
3. **Review Type Definitions**: `src/types/index.ts`
4. **Check Example Usage**: `src/pages/student/skills-manage.tsx`

---

**Summary**: Run these 4 commands in order, add your API keys to `.env.local`, and you're done! 🚀
