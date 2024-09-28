import type { DocumentData, DocumentReference, FirestoreError, Timestamp } from "firebase/firestore";

export interface UseFireStoreReturn<T> {
	data: T;
	loading: boolean;
	error: FirestoreError | null;
}

export interface User extends DocumentData {
	uid: string;
	displayName: string | null;
}

export interface Game extends DocumentData {
	id: string;
	name: string;
}

export interface Match extends DocumentData {
	game: DocumentReference<Game>;
	createdAt: Timestamp;
	players: DocumentReference<User>[];
}

export interface User extends DocumentData {
	name: string;
	uid: string;
	score: number;
}
