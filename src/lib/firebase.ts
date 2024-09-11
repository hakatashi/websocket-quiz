import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
	getFirestore,
	connectFirestoreEmulator,
	collection,
	CollectionReference,
} from "firebase/firestore";
import type { Quiz, Room } from "./schema";

const firebaseConfigResponse = await fetch("/__/firebase/init.json");
const firebaseConfig = await firebaseConfigResponse.json();

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

if (location.hostname === "localhost") {
	connectFirestoreEmulator(db, "localhost", 8080);
	connectAuthEmulator(auth, "http://localhost:9099");
}

const Quizzes = collection(db, "quizzes") as CollectionReference<Quiz>;
const Rooms = collection(db, "rooms") as CollectionReference<Room>;

await signInAnonymously(auth);

export { app as default, auth, db, Quizzes, Rooms };
