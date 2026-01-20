# AI-Powered Skill Interview & Verification Feature

## Overview

This feature allows students to verify their technical skills through an AI-powered mock interview conducted by Google Gemini Pro. The AI acts as a professional technical interviewer, asking progressively challenging questions and providing detailed evaluation results.

## Components Created

### 1. **AI Interview Service** (`src/services/aiInterviewService.ts`)
- **Purpose**: Manages the interview conversation logic and session state
- **Key Functions**:
  - `startInterviewSession(skillName, skillLevel)` - Initializes a new interview session with Gemini
  - `sendInterviewAnswer(sessionId, answer)` - Sends student answer and gets next question or evaluation
  - `getInterviewTranscript(sessionId)` - Retrieves the full interview transcript
  - `endInterviewSession(sessionId)` - Cleans up session resources
  - `mapScoreToSkillLevel(score)` - Converts evaluation score to skill level

- **Interview Flow**:
  1. System prompt establishes Gemini as a professional interviewer
  2. Q1-Q2: Basic conceptual questions
  3. Q3-Q4: Intermediate problem-solving questions
  4. Q5: Advanced scenario question
  5. Final evaluation in JSON format

### 2. **Interview API Endpoint** (`src/pages/api/interviews/ai-interview.ts`)
- **Supported Actions**:
  - `start`: Begins a new interview session
  - `answer`: Processes student answers and returns next question
  - `transcript`: Retrieves current interview transcript
  - `end`: Cleanly ends the session

### 3. **Interview UI Component** (`src/components/AIInterview.tsx`)
- **Features**:
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

### 4. **Skills Management Integration** (`src/pages/student/skills-manage.tsx`)
- **New Button**: "🤖 AI Interview" alongside the traditional "Add Skill" button
- **Workflow**:
  1. Student enters skill name and proficiency level
  2. Clicks "AI Interview" button
  3. AI Interview modal launches
  4. Student completes 5-question interview
  5. Receives immediate evaluation
  6. Skill is automatically saved as "AI-verified"

### 5. **Data Models** (Updated `src/types/index.ts`)
- **InterviewTranscript**: Stores full interview conversation history
- **InterviewEvaluation**: Contains AI evaluation results with detailed scoring
- **InterviewMessage**: Individual messages with role, content, and timestamp
- **Updated StudentSkill**: Now includes optional interview data fields

### 6. **Transcript Storage API** (`src/pages/api/interviews/save-transcript.ts`)
- Saves interview transcripts to Firestore for audit and analysis
- Links transcripts to student profiles

## Feature Workflow

### From the Student's Perspective:

1. **Navigate to Skills Management**
   - Go to Student Dashboard → Manage Skills

2. **Add New Skill with AI Verification**
   - Enter skill name (e.g., "React", "Python", "SQL")
   - Select proficiency level (Beginner, Intermediate, Advanced, Expert)
   - Optionally add proof links
   - Click "🤖 AI Interview" button

3. **Complete the Interview**
   - Read the AI's question
   - Type your answer
   - Press Submit or Ctrl+Enter
   - Receive next question
   - Repeat for 5 questions total

4. **View Results**
   - See immediate evaluation with:
     - Final score (0-100)
     - Assigned skill level
     - 3-5 strengths identified
     - 2-5 weaknesses identified
     - Overall feedback
   - Click "Save & Complete" to store the skill

5. **Verified Skill Created**
   - Skill appears with "✓ Verified" badge
   - Shows "🤖 AI-Verified" indicator
   - Score automatically set from evaluation
   - Transcript stored for reference

## Data Storage

### In Firestore (students collection):

Each skill now includes:
```typescript
{
  id: string;
  name: string;
  category: string;
  selfLevel: SkillLevel;
  score: number; // From AI evaluation
  verificationStatus: "verified";
  verifiedBy: "AI";
  verifiedAt: Timestamp;
  interviewTranscript?: {
    id: string;
    messages: InterviewMessage[];
    status: "completed";
    startedAt: Timestamp;
    completedAt: Timestamp;
  };
  interviewEvaluation?: {
    score: number;
    skillLevel: SkillLevel;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
    questionScores: { questionNumber, question, score, feedback }[];
    evaluatedAt: string;
  };
}
```

## AI Interviewer Behavior

### Question Difficulty Progression:
- **Q1-Q2**: Basic concepts, definitions, core principles
- **Q3-Q4**: Problem-solving, practical application, scenario-based
- **Q5**: Advanced concepts, complex scenarios, edge cases

### Evaluation Criteria:
- Technical depth and accuracy
- Problem-solving approach
- Clarity of explanation
- Handling of follow-up questions
- Practical application knowledge

### JSON Evaluation Format:
```json
{
  "score": 85,
  "skillLevel": "advanced",
  "strengths": ["Strong foundation", "Good problem-solving", "Clear communication"],
  "weaknesses": ["Limited hands-on experience", "Could explore edge cases more"],
  "feedback": "Demonstrates solid understanding with room for growth in advanced scenarios",
  "questionScores": [
    {"questionNumber": 1, "question": "...", "score": 90, "feedback": "..."},
    ...
  ]
}
```

## Session Management

- **In-Memory Sessions**: Interview sessions stored server-side in memory
- **Persistent Chat**: Each session maintains message history with Gemini
- **Automatic Cleanup**: Sessions end when student completes or discards interview
- **Timeout**: Sessions expire after 30 minutes of inactivity (for production)

## UI/UX Features

### Dark Mode Support:
- All components fully styled for light and dark modes
- Uses Tailwind's `dark:` prefix for theming
- Consistent with existing design system

### Responsive Design:
- Works on mobile, tablet, and desktop
- Full-screen modal interview interface
- Proper text sizing and touch-friendly buttons

### Accessibility:
- Semantic HTML
- Keyboard navigation support (Ctrl+Enter to submit)
- Error messages clearly displayed
- Loading states with user feedback

## Error Handling

- Gemini API failures with helpful messages
- Network request errors with retry capability
- Session timeout handling
- Graceful degradation if AI model not configured
- User-friendly error alerts

## Integration Points

### Existing Features That Work Together:
1. **Student Dashboard**: Displays AI-verified skills with badges
2. **Job Readiness Scoring**: AI verification boosts readiness score
3. **Skills Charts**: Interview scores included in skill analytics
4. **Professor Dashboard**: Can view AI-verified skills (future enhancement)

### Database Consistency:
- Skills updated atomically with Firebase transactions
- Job readiness score recalculated automatically
- Transcripts linked to student profile for audit trail

## Security Considerations

- API endpoints validate session IDs
- Student UID verification for skill ownership
- No sensitive data in logs (API key not logged)
- Interview sessions isolated per user
- Proper error messages without exposing internals

## Performance

- **Server-side Chat**: Session history kept on server, not in database
- **Streaming Evaluation**: As student provides answers, Gemini responds in real-time
- **Efficient JSON Parsing**: Evaluation extracted from AI response using regex
- **Memory Cleanup**: Sessions removed after completion to prevent memory leaks

## Testing Workflow

1. **Login as Student**
2. **Go to Manage Skills** page
3. **Create new skill** (e.g., "JavaScript")
4. **Click "🤖 AI Interview"** button
5. **Answer 5 interview questions** with realistic responses
6. **View evaluation results**
7. **Click "Save & Complete"**
8. **Verify skill appears** with AI-verified badge and score
9. **Check student dashboard** - skill score reflected in charts

## Future Enhancements

- Interview history and retake capability
- Comparative scoring across students
- Interview review by professors with comments
- Video recording of interviews
- Time-limited interviews with timer
- Multiple interview formats (technical, behavioral, etc.)
- Export evaluation reports as PDF
- AI improvement suggestions for weak areas

## Configuration

No additional configuration needed - uses existing Gemini API key from environment variables:
- `GEMINI_API_KEY` (preferred, server-side only)
- `NEXT_PUBLIC_GEMINI_API_KEY` (fallback)

## Deployment Notes

- Session data stored in-memory (not persistent across server restarts)
- For production with multiple servers, consider Redis for session storage
- All components follow existing project patterns and conventions
- Fully typed with TypeScript for safety
- Integrates seamlessly with existing Firestore structure
