import type { Component } from "solid-js";

import styles from "./App.module.css";

import { Quizzes, Rooms, auth } from "./lib/firebase";
import { addDoc, doc, setDoc } from "firebase/firestore";
import { useFirestore } from "solid-firebase";
import Doc from "./lib/Doc";
import type { Quiz, Room } from "./lib/schema";

interface GameProps {
	quizzes: Quiz[];
	room: Room;
}

const Game = (props: GameProps) => {
	const index = props.room.index;
	const quiz = props.quizzes.find((q) => q.index === index);

	if (!quiz) {
		return <div>Quiz not found</div>;
	}

	return (
		<div class={styles.Game}>
			<h1>○×クイズ!</h1>
			<p>Question {index}</p>
			<p>{quiz.question}</p>
			<button type="button">True</button>
			<button type="button">False</button>
		</div>
	);
};

const App: Component = () => {
	const handleClick = async () => {
		await setDoc(doc(Rooms, "default"), {
			name: "Default Room",
			owner: auth.currentUser?.uid!,
			index: 1,
		});

		for (const i of Array(10).keys()) {
			await addDoc(Quizzes, {
				room: "default",
				question: `(question ${i + 1}) 京都には、金閣、銀閣のほかにも「銅閣」の別名を持つ指定文化財がある。`,
				correct: true,
				comment:
					"大雲院祇園閣は国登録有形文化財に指定されており、別名「銅閣」とも呼ばれている。",
				index: i + 1,
			});
		}
	};

	const quizzes = useFirestore(Quizzes);
	const room = useFirestore(doc(Rooms, "default"));

	return (
		<div>
			<Doc data={room}>
				{(roomData) => (
					<div class={styles.App}>
						<header class={styles.header}>
							<p>UID: {auth.currentUser?.uid}</p>
							<Doc data={quizzes}>
								{(quizzesData) => (
									<Game quizzes={quizzesData} room={roomData} />
								)}
							</Doc>
						</header>
					</div>
				)}
			</Doc>
			<button type="button" onClick={handleClick}>
				Initialize Room
			</button>
		</div>
	);
};

export default App;
