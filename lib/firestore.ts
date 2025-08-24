import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp, // Use client-side timestamp
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import type { Quiz, QuizSubmission, User } from "@/lib/types";
import { handleGenericError, logError, safeAsync } from "@/lib/error-handling";

/**
 * Helper function to convert Firestore Timestamp to Date
 * Handles both Firestore Timestamp objects and JavaScript Date objects
 * @param timestamp - The timestamp to convert
 * @returns Date object or null if timestamp is null/undefined
 */
function convertTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  // If it's already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore Timestamp, convert it to Date
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  // If it's a timestamp object with toDate method (like Firestore Timestamp)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string, try to parse it as a date
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // If it's a number (milliseconds since epoch), convert to Date
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // For any other case, try to convert to Date
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Saves a quiz to Firestore.
 * @param quizData - The quiz data to save.
 * @param userId - The ID of the user creating the quiz.
 */
export async function saveQuiz(
  quizData: Omit<Quiz, "id" | "authorId" | "createdAt">,
  userId: string
): Promise<string> {
  console.log('🔍 [saveQuiz] Starting save operation');
  console.log('📊 [saveQuiz] User ID:', userId);
  console.log('📊 [saveQuiz] Database project:', db.app.options.projectId);
  console.log('📊 [saveQuiz] Database app name:', db.app.name);
  
  // Check authentication state from Firebase Auth
  const currentUser = auth.currentUser;
  console.log('👤 [saveQuiz] Current user from auth:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : 'No current user');
  
  try {
    const quizDataToSave = {
      ...quizData,
      authorId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublished: false,
      isPublic: false,
      submissionCount: 0,
    };
    
    console.log('📝 [saveQuiz] Quiz data to save:', {
      title: quizDataToSave.title,
      authorId: quizDataToSave.authorId,
      questionsCount: quizDataToSave.questions?.length || 0
    });

    const quizzesCollection = collection(db, "quizzes");
    console.log('🗂️ [saveQuiz] Collection reference created');
    
    console.log('💾 [saveQuiz] Attempting to add document...');
    const docRef = await addDoc(quizzesCollection, quizDataToSave);
    
    console.log('✅ [saveQuiz] Document added successfully with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [saveQuiz] Detailed error information:');
    console.error('Error object:', error);
    console.error('Error code:', (error as any)?.code);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    throw new Error(`Failed to save quiz: ${(error as any)?.message || error}`);
  }
}

/**
 * Updates an existing quiz.
 * @param quizId - The ID of the quiz to update.
 * @param quizData - The updated quiz data.
 * @param userId - The ID of the user updating the quiz.
 */
export async function updateQuiz(
  quizId: string,
  quizData: Partial<Omit<Quiz, "id" | "authorId" | "createdAt">>,
  userId: string
): Promise<void> {
  if (!userId || !quizId) {
    throw new Error("User ID and Quiz ID are required to update a quiz");
  }

  const { error } = await safeAsync(async () => {
    const quizRef = doc(db, "quizzes", quizId);
    await updateDoc(quizRef, {
      ...quizData,
      updatedAt: serverTimestamp(),
    });
  }, "updateQuiz");

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Deletes a quiz.
 * @param quizId - The ID of the quiz to delete.
 * @param userId - The ID of the user deleting the quiz.
 */
export async function deleteQuiz(quizId: string, userId: string): Promise<void> {
  if (!userId || !quizId) {
    throw new Error("User ID and Quiz ID are required to delete a quiz");
  }

  const { error } = await safeAsync(async () => {
    const quizRef = doc(db, "quizzes", quizId);
    await deleteDoc(quizRef);
  }, "deleteQuiz");

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Fetches all quizzes for a specific user.
 * @param userId - The ID of the user whose quizzes to fetch.
 */
export async function getUserQuizzes(userId: string): Promise<Quiz[]> {
  if (!userId) {
    throw new Error("User ID is required to fetch quizzes");
  }

  const { data, error } = await safeAsync(async () => {
    const q = query(
      collection(db, "quizzes"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const quizData = doc.data();
      return {
        id: doc.id,
        ...quizData,
        createdAt: convertTimestampToDate(quizData.createdAt) || new Date(),
        updatedAt: convertTimestampToDate(quizData.updatedAt) || new Date(),
      };
    }) as Quiz[];
  }, "getUserQuizzes");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Fetches a single quiz by ID.
 * @param quizId - The ID of the quiz to fetch.
 */
export async function getQuiz(quizId: string): Promise<Quiz | null> {
  if (!quizId) {
    throw new Error("Quiz ID is required");
  }

  const { data, error } = await safeAsync(async () => {
    const quizRef = doc(db, "quizzes", quizId);
    const quizSnap = await getDoc(quizRef);

    if (!quizSnap.exists()) {
      return null;
    }

    const quizData = quizSnap.data();
    return {
      id: quizSnap.id,
      ...quizData,
      createdAt: convertTimestampToDate(quizData.createdAt) || new Date(),
      updatedAt: convertTimestampToDate(quizData.updatedAt) || new Date(),
    } as Quiz;
  }, "getQuiz");

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

/**
 * Submits a quiz response.
 * @param submission - The quiz submission data.
 */
export async function submitQuiz(submission: Omit<QuizSubmission, "id" | "submittedAt">): Promise<string> {
  if (!submission.userId || !submission.quizId) {
    throw new Error("User ID and Quiz ID are required for submission");
  }

  const { data, error } = await safeAsync(async () => {
    const submissionsCollection = collection(db, "submissions");
    const docRef = await addDoc(submissionsCollection, {
      ...submission,
      submittedAt: serverTimestamp(),
    });
    return docRef.id;
  }, "submitQuiz");

  if (error) {
    throw new Error(error.message);
  }

  return data!;
}

/**
 * Fetches submissions for a specific quiz.
 * @param quizId - The ID of the quiz.
 * @param userId - The ID of the quiz author (for authorization).
 */
export async function getQuizSubmissions(quizId: string, userId: string): Promise<QuizSubmission[]> {
  if (!quizId || !userId) {
    throw new Error("Quiz ID and User ID are required");
  }

  const { data, error } = await safeAsync(async () => {
    const q = query(
      collection(db, "submissions"),
      where("quizId", "==", quizId),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const submissionData = doc.data();
      return {
        id: doc.id,
        ...submissionData,
        submittedAt: convertTimestampToDate(submissionData.submittedAt) || new Date(),
      };
    }) as QuizSubmission[];
  }, "getQuizSubmissions");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Fetches submissions by a specific user.
 * @param userId - The ID of the user.
 */
export async function getUserSubmissions(userId: string): Promise<QuizSubmission[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const { data, error } = await safeAsync(async () => {
    const q = query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const submissionData = doc.data();
      return {
        id: doc.id,
        ...submissionData,
        submittedAt: convertTimestampToDate(submissionData.submittedAt) || new Date(),
      };
    }) as QuizSubmission[];
  }, "getUserSubmissions");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Publishes or unpublishes a quiz.
 * @param quizId - The ID of the quiz.
 * @param isPublished - Whether to publish or unpublish the quiz.
 * @param userId - The ID of the user (for authorization).
 */
export async function toggleQuizPublication(
  quizId: string,
  isPublished: boolean,
  userId: string
): Promise<void> {
  if (!quizId || !userId) {
    throw new Error("Quiz ID and User ID are required");
  }

  const { error } = await safeAsync(async () => {
    const quizRef = doc(db, "quizzes", quizId);
    await updateDoc(quizRef, {
      isPublished,
      updatedAt: serverTimestamp(),
    });
  }, "toggleQuizPublication");

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Sets a quiz to be public or private.
 * @param quizId - The ID of the quiz.
 * @param isPublic - Whether to make the quiz public or private.
 * @param userId - The ID of the user (for authorization).
 */
export async function toggleQuizPublic(
  quizId: string,
  isPublic: boolean,
  userId: string
): Promise<void> {
  if (!quizId || !userId) {
    throw new Error("Quiz ID and User ID are required");
  }

  const { error } = await safeAsync(async () => {
    const quizRef = doc(db, "quizzes", quizId);
    await updateDoc(quizRef, {
      isPublic,
      updatedAt: serverTimestamp(),
    });
  }, "toggleQuizPublic");

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Saves a student's submission for a quiz.
 * @param submissionData - The submission data.
 */
export async function saveSubmission(submissionData: { quizId: string; answers: Record<string, string[]>; studentId?: string }) {
    try {
        const submissionsCollection = collection(db, "submissions");
        const docRef = await addDoc(submissionsCollection, {
            ...submissionData,
            submittedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving submission:", error);
        throw new Error("Failed to save submission.");
    }
}

/**
 * Fetches all results for a specific quiz.
 * @param quizId - The ID of the quiz to fetch results for.
 */
export async function getQuizResults(quizId: string): Promise<QuizSubmission[]> {
  if (!quizId) {
    throw new Error("Quiz ID is required to fetch results");
  }

  const { data, error } = await safeAsync(async () => {
    const q = query(
      collection(db, "submissions"),
      where("quizId", "==", quizId),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const submissionData = doc.data();
      return {
        id: doc.id,
        ...submissionData,
        submittedAt: convertTimestampToDate(submissionData.submittedAt) || new Date(),
      };
    }) as QuizSubmission[];
  }, "getQuizResults");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Creates or updates a user profile in Firestore.
 * @param userId - The user's authentication ID
 * @param userData - The user data to store
 */
export async function createUserProfile(
  userId: string,
  userData: Omit<User, "id" | "createdAt">
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to create a profile");
  }

  try {
    console.log("[createUserProfile] Creating/updating profile for user:", userId);
    console.log("[createUserProfile] User data:", userData);

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log("[createUserProfile] User profile doesn't exist, creating new one");
      await setDoc(userRef, {
        id: userId,
        ...userData,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      console.log("[createUserProfile] User profile created successfully");
    } else {
      console.log("[createUserProfile] User profile already exists, updating lastLoginAt");
      // Update lastLoginAt for existing users
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });
      console.log("[createUserProfile] User profile updated successfully");
    }
  } catch (error) {
    console.error("[createUserProfile] Detailed error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as any)?.code,
      errorName: (error as any)?.name,
      userId,
      userData
    });

    if ((error as any)?.code === 'permission-denied') {
      throw new Error("You don't have permission to create a user profile. Please make sure you're logged in correctly.");
    }

    throw error;
  }
}

/**
 * Fetches a user profile by ID.
 * @param userId - The user's ID
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const { data, error } = await safeAsync(async () => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const userData = userSnap.data();
    return {
      id: userSnap.id,
      ...userData,
      createdAt: convertTimestampToDate(userData.createdAt) || new Date(),
      lastLoginAt: convertTimestampToDate(userData.lastLoginAt) || new Date(),
    } as User;
  }, "getUserProfile");

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

/**
 * Fetches all public quizzes for students to take.
 */
export async function getPublicQuizzes(): Promise<Quiz[]> {
  const { data, error } = await safeAsync(async () => {
    const q = query(
      collection(db, "quizzes"),
      where("isPublic", "==", true),
      where("isPublished", "==", true),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const quizData = doc.data();
      return {
        id: doc.id,
        ...quizData,
        createdAt: convertTimestampToDate(quizData.createdAt) || new Date(),
        updatedAt: convertTimestampToDate(quizData.updatedAt) || new Date(),
      };
    }) as Quiz[];
  }, "getPublicQuizzes");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Fetches featured/recommended quizzes for students.
 * @param limit - Number of quizzes to fetch
 */
export async function getFeaturedQuizzes(quizLimit: number = 10): Promise<Quiz[]> {
  try {
    console.log(`[getFeaturedQuizzes] Starting query with limit: ${quizLimit}`);
    
    // First try the composite query
    let querySnapshot;
    try {
      const q = query(
        collection(db, "quizzes"),
        where("isPublic", "==", true),
        where("isPublished", "==", true),
        orderBy("createdAt", "desc"),
        limit(quizLimit)
      );
      console.log("[getFeaturedQuizzes] Executing composite query...");
      querySnapshot = await getDocs(q);
      console.log(`[getFeaturedQuizzes] Composite query successful, found ${querySnapshot.docs.length} documents`);
    } catch (compositeError) {
      console.warn("[getFeaturedQuizzes] Composite query failed, trying fallback:", compositeError);
      
      // Fallback: Try without orderBy if composite index doesn't exist
      const fallbackQuery = query(
        collection(db, "quizzes"),
        where("isPublic", "==", true),
        where("isPublished", "==", true),
        limit(quizLimit)
      );
      console.log("[getFeaturedQuizzes] Executing fallback query without orderBy...");
      querySnapshot = await getDocs(fallbackQuery);
      console.log(`[getFeaturedQuizzes] Fallback query successful, found ${querySnapshot.docs.length} documents`);
    }

    const quizzes = querySnapshot.docs.map((doc) => {
      try {
        const quizData = doc.data();
        console.log(`[getFeaturedQuizzes] Processing document ${doc.id}:`, {
          title: quizData.title,
          isPublic: quizData.isPublic,
          isPublished: quizData.isPublished,
          createdAt: quizData.createdAt
        });
        
        return {
          id: doc.id,
          ...quizData,
          createdAt: convertTimestampToDate(quizData.createdAt) || new Date(),
          updatedAt: convertTimestampToDate(quizData.updatedAt) || new Date(),
        };
      } catch (docError) {
        console.error(`[getFeaturedQuizzes] Error processing document ${doc.id}:`, docError);
        throw docError;
      }
    }) as Quiz[];

    console.log(`[getFeaturedQuizzes] Successfully processed ${quizzes.length} quizzes`);
    return quizzes;

  } catch (error) {
    console.error("[getFeaturedQuizzes] Detailed error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as any)?.code,
      errorName: (error as any)?.name
    });
    
    // Return empty array instead of throwing to prevent breaking the student dashboard
    console.log("[getFeaturedQuizzes] Returning empty array due to error");
    return [];
  }
}

/**
 * Fetches all published quizzes from all teachers for students.
 * This allows students to access quizzes from all teachers, not just public ones.
 */
export async function getAllTeacherQuizzes(): Promise<Quiz[]> {
  try {
    console.log("[getAllTeacherQuizzes] Starting query for all published quizzes");
    
    // First try the query with orderBy
    let querySnapshot;
    try {
      const q = query(
        collection(db, "quizzes"),
        where("isPublished", "==", true),
        orderBy("createdAt", "desc")
      );
      console.log("[getAllTeacherQuizzes] Executing query with orderBy...");
      querySnapshot = await getDocs(q);
      console.log(`[getAllTeacherQuizzes] Query with orderBy successful, found ${querySnapshot.docs.length} documents`);
    } catch (orderByError) {
      console.warn("[getAllTeacherQuizzes] Query with orderBy failed, trying fallback:", orderByError);
      
      // Fallback: Try without orderBy if index doesn't exist
      const fallbackQuery = query(
        collection(db, "quizzes"),
        where("isPublished", "==", true)
      );
      console.log("[getAllTeacherQuizzes] Executing fallback query without orderBy...");
      querySnapshot = await getDocs(fallbackQuery);
      console.log(`[getAllTeacherQuizzes] Fallback query successful, found ${querySnapshot.docs.length} documents`);
    }

    const quizzes = querySnapshot.docs.map((doc) => {
      try {
        const quizData = doc.data();
        console.log(`[getAllTeacherQuizzes] Processing document ${doc.id}:`, {
          title: quizData.title,
          isPublished: quizData.isPublished,
          isPublic: quizData.isPublic,
          createdAt: quizData.createdAt
        });
        
        return {
          id: doc.id,
          ...quizData,
          createdAt: convertTimestampToDate(quizData.createdAt) || new Date(),
          updatedAt: convertTimestampToDate(quizData.updatedAt) || new Date(),
        };
      } catch (docError) {
        console.error(`[getAllTeacherQuizzes] Error processing document ${doc.id}:`, docError);
        throw docError;
      }
    }) as Quiz[];

    console.log(`[getAllTeacherQuizzes] Successfully processed ${quizzes.length} quizzes`);
    return quizzes;

  } catch (error) {
    console.error("[getAllTeacherQuizzes] Detailed error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as any)?.code,
      errorName: (error as any)?.name
    });
    
    // Return empty array instead of throwing to prevent breaking the student dashboard
    console.log("[getAllTeacherQuizzes] Returning empty array due to error");
    return [];
  }
}