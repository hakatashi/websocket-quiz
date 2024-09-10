import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
	getFirestore,
	connectFirestoreEmulator,
	collection,
} from "firebase/firestore";

const firebaseConfigResponse = await fetch("/__/firebase/init.json");
const firebaseConfig = await firebaseConfigResponse.json();

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

if (location.hostname === "localhost") {
	connectFirestoreEmulator(db, "localhost", 8080);
	connectAuthEmulator(auth, "http://localhost:9099");
}

const Quiz = collection(db, "quizzes");

await signInAnonymously(auth);

export { app as default, auth, db, Quiz };
