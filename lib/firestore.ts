import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, serverTimestamp, query, where } from "firebase/firestore";
import type { Quiz } from "@/lib/types";

// Note: We're using a simplified model here. In a real app, you'd add more robust error handling and user authentication checks.

/**
 * Saves a quiz to Firestore.
 * @param quizData - The quiz data to save.
 * @param userId - The ID of the user creating the quiz.
 */
export async function saveQuiz(quizData: Omit<Quiz, "id" | "authorId" | "createdAt">, userId: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "quizzes"), {
      ...quizData,
      authorId: userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving quiz to Firestore:", error);
    throw new Error("Failed to save quiz.");
  }
}

/**
 * Fetches all quizzes for a specific user.
 * @param userId - The ID of the user whose quizzes to fetch.
 */
export async function getUserQuizzes(userId: string): Promise<Quiz[]> {
  try {
    const q = query(collection(db, "quizzes"), where("authorId", "==", userId));
    const querySnapshot = await getDocs(q);
    const quizzes: Quiz[] = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() } as Quiz);
    });
    return quizzes;
  } catch (error) {
    console.error("Error fetching user quizzes:", error);
    throw new Error("Failed to fetch quizzes.");
  }
}

/**
 * Fetches a single quiz by its ID.
 * @param quizId - The ID of the quiz to fetch.
 */
export async function getQuiz(quizId: string): Promise<Quiz | null> {
  try {
    const docRef = doc(db, "quizzes", quizId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw new Error("Failed to fetch quiz.");
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
