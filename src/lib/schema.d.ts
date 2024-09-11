import type { FirestoreError } from "firebase/firestore";

export interface UseFireStoreReturn<T> {
	data: T;
	loading: boolean;
	error: FirestoreError | null;
}

export interface Quiz {
	room: string;
	question: string;
	correct: boolean;
	comment: string;
	index: number;
}

export interface Room {
	name: string;
	owner: string;
	index: number;
}
