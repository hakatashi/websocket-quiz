import {
	createMemo,
	createSignal,
	For,
	Match,
	Show,
	Switch,
	type Component,
} from "solid-js";

import styles from "./App.module.css";

import { auth, Games, Matches, Users } from "./lib/firebase";
import { addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { useAuth, useFirestore } from "solid-firebase";
import Collection from "./lib/Collection";

const App: Component = () => {
	const authData = useAuth(auth);

	const handleClick = async () => {
		if (!authData.data) {
			return;
		}

		await setDoc(doc(Games, "it-quiz"), {
			id: 'it-quiz',
			name: "ITクイズ",
		});

		await addDoc(Matches, {
			game: doc(Games, "it-quiz"),
			createdAt: Timestamp.now(),
			players: [doc(Users, authData.data.uid)],
		});
	};

	const matches = useFirestore(Matches);

	return (
		<div>
			<header class={styles.header}>
				<p>UID: {authData.data?.uid}</p>
			</header>
			<div class={styles.App}>
				<Collection data={matches}>
					{(matchData) => (
						<p>{matchData.createdAt.toDate().toISOString()}</p>
					)}
				</Collection>
			</div>
			<button type="button" onClick={handleClick}>
				Initialize Room
			</button>
		</div>
	);
};

const NotFound: Component = () => <h1>Not Found</h1>;

const App = (
	<Router>
		<Route path="/" component={Home} />
		<Route path="/admin" component={Admin} />
		<Route path="/:rest*" component={NotFound} />
	</Router>
);

export default App;
