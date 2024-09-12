import type { DocumentData, FirestoreError } from "firebase/firestore";

export interface UseFireStoreReturn<T> {
	data: T;
	loading: boolean;
	error: FirestoreError | null;
}

export interface Quiz extends DocumentData {
	room: string;
	question: string;
	correct: boolean;
	comment: string;
	index: number;
	scoreRatio: [number, number] | null;
	finished: boolean;
}

export interface QuizAnswer extends DocumentData {
	user: string;
	answer: boolean;
}

export interface Room extends DocumentData {
	name: string;
	owner: string;
	index: number;
}

export interface User extends DocumentData {
	name: string;
	uid: string;
	score: number;
}
