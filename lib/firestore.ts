import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import type { Quiz, QuizSubmission, User } from "@/lib/types";
import { handleGenericError, logError, safeAsync } from "@/lib/error-handling";

/**
 * Saves a quiz to Firestore.
 * @param quizData - The quiz data to save.
 * @param userId - The ID of the user creating the quiz.
 */
export async function saveQuiz(
  quizData: Omit<Quiz, "id" | "authorId" | "createdAt">,
  userId: string
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to save a quiz");
  }

  const { data, error } = await safeAsync(async () => {
    const docRef = await addDoc(collection(db, "quizzes"), {
      ...quizData,
      authorId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublished: false,
      submissionCount: 0,
    });
    return docRef.id;
  }, "saveQuiz");

  if (error) {
    throw new Error(error.message);
  }

  return data!;
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Quiz[];
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

    return {
      id: quizSnap.id,
      ...quizSnap.data(),
      createdAt: quizSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: quizSnap.data().updatedAt?.toDate?.() || new Date(),
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
    const docRef = await addDoc(collection(db, "submissions"), {
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
    })) as QuizSubmission[];
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
    })) as QuizSubmission[];
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
        const docRef = await addDoc(collection(db, "submissions"), {
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
    })) as QuizSubmission[];
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
    throw new Error("User ID is required to create profile");
  }

  const { error } = await safeAsync(async () => {
    const userRef = doc(db, "users", userId);
    
    // Check if document exists first
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        ...userData,
        lastLoginAt: serverTimestamp(),
      });
    } else {
      // Create new document with the specific ID
      await setDoc(userRef, {
        id: userId,
        ...userData,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    }
  }, "createUserProfile");

  if (error) {
    throw new Error(error.message);
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

    return {
      id: userSnap.id,
      ...userSnap.data(),
      createdAt: userSnap.data().createdAt?.toDate?.() || new Date(),
      lastLoginAt: userSnap.data().lastLoginAt?.toDate?.() || new Date(),
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Quiz[];
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
  const { data, error } = await safeAsync(async () => {
    const q = query(
      collection(db, "quizzes"),
      where("isPublic", "==", true),
      where("isPublished", "==", true),
      orderBy("submissionCount", "desc"),
      limit(quizLimit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Quiz[];
  }, "getFeaturedQuizzes");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Fetches all published quizzes from all teachers for students.
 * This allows students to access quizzes from all teachers, not just public ones.
 */
export async function getAllTeacherQuizzes(): Promise<Quiz[]> {
  const { data, error } = await safeAsync(async () => {
    try {
      const q = query(
        collection(db, "quizzes"),
        where("isPublished", "==", true),
        orderBy("createdAt", "desc")
      );
      
      // Debug logging
      console.log("Fetching all published quizzes with query:", q);
      
      const querySnapshot = await getDocs(q);
      
      // Debug logging
      console.log("Query snapshot size:", querySnapshot.size);
      console.log("Query snapshot docs:", querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      const quizzes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Quiz[];
      
      console.log("Processed quizzes:", quizzes);
      
      return quizzes;
    } catch (err) {
      console.error("Error in getAllTeacherQuizzes query:", err);
      throw err;
    }
  }, "getAllTeacherQuizzes");

  if (error) {
    console.error("Error in getAllTeacherQuizzes:", error);
    throw new Error(error.message);
  }

  // Debug logging
  console.log("getAllTeacherQuizzes returning:", data?.length || 0, "quizzes");
  
  return data || [];
}
