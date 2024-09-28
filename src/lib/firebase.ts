import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
	getFirestore,
	connectFirestoreEmulator,
	collection,
	CollectionReference,
	doc,
	getDoc,
	setDoc,
} from "firebase/firestore";
import type { Game, Match, User } from "./schema";

// const firebaseConfigResponse = await fetch("/__/firebase/init.json");
const firebaseConfigResponse = await fetch("http://localhost:5000/__/firebase/init.json");
const firebaseConfig = await firebaseConfigResponse.json();

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

if (location.hostname === "localhost") {
	connectFirestoreEmulator(db, "localhost", 8080);
	connectAuthEmulator(auth, "http://localhost:9099");
}

const Users = collection(db, "users") as CollectionReference<User>;
const Games = collection(db, "games") as CollectionReference<Game>;
const Matches = collection(db, "matches") as CollectionReference<Match>;

await signInAnonymously(auth).then(async (userCredential) => {
	const userRef = doc(Users, userCredential.user.uid);
	const user = await getDoc(userRef);
	if (!user.exists()) {
		await setDoc(userRef, {
			uid: userCredential.user.uid,
			displayName: null,
		});
	}
});

export { app as default, auth, db, Games, Matches, Users };
