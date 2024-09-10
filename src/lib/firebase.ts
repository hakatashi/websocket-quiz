import { initializeApp } from "firebase/app";
import {
	getFirestore,
	connectFirestoreEmulator,
	collection,
} from "firebase/firestore";

const firebaseConfigResponse = await fetch("/__/firebase/init.json");
const firebaseConfig = await firebaseConfigResponse.json();

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

if (location.hostname === "localhost") {
	connectFirestoreEmulator(db, "localhost", 8080);
}

const Quiz = collection(db, "quizzes");

export { app as default, db, Quiz };
