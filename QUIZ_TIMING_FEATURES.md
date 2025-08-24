# Quiz Timing Persistence Features

## Overview
Enhanced quiz timing system that persists across page refreshes and browser sessions.

## Key Features

### 1. Session Persistence
- Quiz progress and timer state saved to localStorage
- Automatic restoration of quiz state on page reload
- Supports current question index, answers, and elapsed time

### 2. Timer Management
- Accurate time calculation based on elapsed time since quiz start
- Handles time limits correctly across page refreshes
- Auto-submission when time expires (even after refresh)

### 3. Data Storage Schema
```typescript
interface QuizSession {
  currentQuestionIndex: number;
  answers: Record<string, string[]>;
  startTime: string; // ISO string
  quizId: string;
}
```

### 4. Storage Key Format
- `quiz_session_${quizId}` - unique per quiz

### 5. Safety Features
- Prevents multiple simultaneous submissions
- Clears session data after successful submission
- Error handling for corrupted session data
- Fresh session creation if data is invalid

### 6. User Experience
- Warning dialog when user tries to leave during quiz
- Seamless restoration of quiz state
- Progress preservation across browser crashes/refreshes

## Implementation Details

### Session Management
1. **Load Session**: On component mount, check for existing session data
2. **Save Session**: Auto-save on every answer change and question navigation  
3. **Calculate Remaining Time**: Compare current time with stored start time
4. **Clean Up**: Remove session data after quiz submission

### Time Persistence
- Start time stored as ISO string in localStorage
- Elapsed time calculated on every page load
- Remaining time = (timeLimit * 60) - elapsedSeconds
- Auto-submit if remaining time ≤ 0

### Browser Events
- `beforeunload` event handler warns users before leaving
- Automatic session cleanup on submission
- Error recovery for malformed session data

## Benefits
- ✅ No lost progress on accidental refresh
- ✅ Accurate timing across sessions  
- ✅ Improved user experience
- ✅ Data integrity and error handling
- ✅ Mobile-friendly (survives app switching)