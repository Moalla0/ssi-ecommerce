import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

export interface TodoItem {
  id?: string;
  text: string;
  completed: boolean;
  dateKey: string; // YYYY-MM-DD
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'todos';

export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const addTodo = async (text: string, dateKey: string): Promise<TodoItem> => {
  if (!text.trim()) throw new Error('Todo text is required');
  const now = new Date();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    text: text.trim(),
    completed: false,
    dateKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { 
    id: docRef.id, 
    text: text.trim(), 
    completed: false, 
    dateKey,
    createdAt: now,
    updatedAt: now
  };
};

export const getTodosByDate = async (dateKey: string): Promise<TodoItem[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('dateKey', '==', dateKey)
  );
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TodoItem[];
  // Sort client-side by createdAt ascending to avoid composite index requirement
  return items.sort((a, b) => {
    const ta = (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)).getTime();
    const tb = (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)).getTime();
    return ta - tb;
  });
};

export const getTodos = async (): Promise<TodoItem[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TodoItem[];
  // Sort client-side by createdAt descending (newest first)
  return items.sort((a, b) => {
    const ta = (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)).getTime();
    const tb = (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)).getTime();
    return tb - ta;
  });
};

export const setTodoCompleted = async (id: string, completed: boolean): Promise<void> => {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, { completed, updatedAt: serverTimestamp() });
};

export const deleteTodo = async (id: string): Promise<void> => {
  const ref = doc(db, COLLECTION_NAME, id);
  await deleteDoc(ref);
};


