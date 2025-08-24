import { FirebaseError } from 'firebase/app';

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class QuizAppError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'QuizAppError';
    this.code = code;
    this.details = details;
  }
}

// Firebase error code mappings
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  
  // Firestore errors
  'firestore/permission-denied': 'You don\'t have permission to access this resource.',
  'firestore/not-found': 'The requested resource was not found.',
  'firestore/already-exists': 'This resource already exists.',
  'firestore/resource-exhausted': 'Too many requests. Please try again later.',
  'firestore/failed-precondition': 'The operation failed due to a conflict.',
  'firestore/aborted': 'The operation was aborted. Please try again.',
  'firestore/out-of-range': 'The requested data is out of range.',
  'firestore/unimplemented': 'This feature is not yet implemented.',
  'firestore/internal': 'An internal error occurred. Please try again.',
  'firestore/unavailable': 'The service is temporarily unavailable. Please try again.',
  'firestore/data-loss': 'Data loss occurred. Please contact support.',
  'firestore/unauthenticated': 'You must be signed in to perform this action.',
  'firestore/deadline-exceeded': 'The operation timed out. Please try again.',
  'firestore/cancelled': 'The operation was cancelled.',
  'firestore/invalid-argument': 'Invalid data provided. Please check your input.',
};

export function handleFirebaseError(error: FirebaseError): AppError {
  const friendlyMessage = FIREBASE_ERROR_MESSAGES[error.code] || 
    'An unexpected error occurred. Please try again.';

  return {
    code: error.code,
    message: friendlyMessage,
    details: {
      originalMessage: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
  };
}

export function handleGenericError(error: unknown): AppError {
  if (error instanceof FirebaseError) {
    return handleFirebaseError(error);
  }

  if (error instanceof QuizAppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'unknown-error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred. Please try again.',
      details: {
        originalMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }

  return {
    code: 'unknown-error',
    message: 'An unexpected error occurred. Please try again.',
    details: { originalError: JSON.stringify(error, Object.getOwnPropertyNames(error)) },
  };
}

export function logError(error: unknown, context?: string) {
  const appError = handleGenericError(error);
  
  console.error(`[${context || 'Unknown'}] Error:`, {
    code: appError.code,
    message: appError.message,
    details: appError.details,
  });

  // In production, send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Add your error reporting service here
    // e.g., Sentry.captureException(error, { extra: { context, appError } });
  }
}

// Utility function to safely execute async operations
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = handleGenericError(error);
    logError(error, context);
    return { error: appError };
  }
}

// Utility function to safely execute sync operations
export function safeSync<T>(
  operation: () => T,
  context?: string
): { data?: T; error?: AppError } {
  try {
    const data = operation();
    return { data };
  } catch (error) {
    const appError = handleGenericError(error);
    logError(error, context);
    return { error: appError };
  }
}
