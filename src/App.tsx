import { createMemo, type Component } from "solid-js";

import styles from "./App.module.css";

import { Quizzes, Rooms, Users, auth } from "./lib/firebase";
import { addDoc, collection, CollectionReference, doc, setDoc } from "firebase/firestore";
import { useFirestore } from "solid-firebase";
import Doc from "./lib/Doc";
import type { Quiz, QuizAnswer, Room } from "./lib/schema";

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

	const QuizAnswers = collection(Quizzes, quiz.id, "answers") as CollectionReference<QuizAnswer>;

	const quizAnswer = useFirestore(
		doc(QuizAnswers, auth.currentUser?.uid!),
	);

	const myChoice = createMemo(() => {
		if (!quizAnswer.data) {
			return null;
		}

		return quizAnswer.data.answer;
	});

	const handleAnswer = (answer: boolean) => {
		setDoc(doc(QuizAnswers, auth.currentUser?.uid!), {
			user: auth.currentUser?.uid!,
			answer,
		});
	};

	return (
		<div class={styles.Game}>
			<p>Question {index}</p>
			<p>{quiz.question}</p>
			<button
				type="button"
				onClick={[handleAnswer, true]}
				class={styles.choice}
				classList={{
					[styles.active]: myChoice() === true,
				}}
			>
				<span style="font-size: 5em">◯</span>
				<br />
				正解で3点
				<br />
				不正解で-1点
			</button>
			<button
				type="button"
				onClick={[handleAnswer, false]}
				class={styles.choice}
				classList={{
					[styles.active]: myChoice() === false,
				}}
			>
				<span style="font-size: 5em">✕</span>
				<br />
				正解で1点
				<br />
				不正解で-3点
			</button>
		</div>
	);
};

const UserNameSelector = () => {
	const handleSubmit = (e: Event) => {
		e.preventDefault();

		const form = e.target as HTMLFormElement;
		const name = form.name.value;

		setDoc(doc(Users, auth.currentUser?.uid!), {
			name,
			uid: auth.currentUser?.uid!,
			score: 0,
		});
	};

	return (
		<form onSubmit={handleSubmit}>
			<label>
				<span>Name:</span>
				<input type="text" name="name" />
			</label>
			<br />
			<button type="submit">Submit</button>
		</form>
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
				scoreRatio: null,
			});
		}
	};

	const user = useFirestore(doc(Users, auth.currentUser?.uid!));
	const quizzes = useFirestore(Quizzes);
	const room = useFirestore(doc(Rooms, "default"));

	return (
		<div class={styles.App}>
			<Doc data={user} fallback={<UserNameSelector />}>
				{(userData) => (
					<div>
						<Doc data={room}>
							{(roomData) => (
								<header class={styles.header}>
									<p>
										{userData.name} (Score: {userData.score})
									</p>
									<Doc data={quizzes}>
										{(quizzesData) => (
											<Game quizzes={quizzesData} room={roomData} />
										)}
									</Doc>
								</header>
							)}
						</Doc>
						<button type="button" onClick={handleClick}>
							Initialize Room
						</button>
					</div>
				)}
			</Doc>
		</div>
	);
};

export default App;
