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

import { Quizzes, Rooms, Users, auth, db } from "./lib/firebase";
import {
	addDoc,
	collection,
	CollectionReference,
	doc,
	getDocs,
	runTransaction,
	setDoc,
	updateDoc,
	writeBatch,
} from "firebase/firestore";
import { useFirestore } from "solid-firebase";
import Doc from "./lib/Doc";
import type { Quiz, QuizAnswer, Room, User } from "./lib/schema";
import { Router, Route } from "@solidjs/router";

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

interface GameProps {
	quiz: Quiz;
	room: Room;
}

const Game = (props: GameProps) => {
	const quizAnswer = createMemo(() =>
		useFirestore(
			doc(
				collection(
					Quizzes,
					props.quiz.id,
					"answers",
				) as CollectionReference<QuizAnswer>,
				auth.currentUser?.uid!,
			),
		),
	);

	const myChoice = createMemo(() => {
		if (!quizAnswer().data) {
			return null;
		}

		return quizAnswer().data!.answer;
	});

	const handleAnswer = (answer: boolean) => {
		if (props.quiz.finished) {
			return;
		}

		setDoc(
			doc(
				collection(
					Quizzes,
					props.quiz.id,
					"answers",
				) as CollectionReference<QuizAnswer>,
				auth.currentUser?.uid!,
			),
			{
				user: auth.currentUser?.uid!,
				answer,
			},
		);
	};

	const correctScore = createMemo(
		() => props.quiz.scoreRatio?.[0]?.toString() ?? "???",
	);
	const incorrectScore = createMemo(
		() => props.quiz.scoreRatio?.[1]?.toString() ?? "???",
	);

	return (
		<div class={styles.Game}>
			<p>Question {props.room.index}</p>
			<p>{props.quiz.question}</p>
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
				正解で{incorrectScore()}点
				<br />
				不正解で-{correctScore()}点
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
				正解で{correctScore()}点
				<br />
				不正解で-{incorrectScore()}点
			</button>
		</div>
	);
};

interface GameSwitcherProps {
	quizzes: Quiz[];
	room: Room;
}

const GameSwitcher = (props: GameSwitcherProps) => {
	const quiz = createMemo(() =>
		props.quizzes.find((q) => q.index === props.room.index),
	);

	if (!quiz()) {
		return <div>Quiz not found</div>;
	}

	return <Game quiz={quiz()!} room={props.room} />;
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

const Home: Component = () => {
	const handleClick = async () => {
		await setDoc(doc(Rooms, "default"), {
			name: "Default Room",
			owner: auth.currentUser?.uid!,
			index: 1,
		});

		for (const i of Array(10).keys()) {
			await addDoc(Quizzes, {
				room: "default",
				question: `(question ${i + 1}) キイロサンゴハゼという魚は、体が黄色くない。`,
				correct: false,
				comment: "名前の通り、とても黄色い。",
				index: i + 1,
				scoreRatio: i === 0 ? null : [i, 10 - i],
				finished: false,
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
											<GameSwitcher quizzes={quizzesData} room={roomData} />
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

interface AdminGameProps {
	quiz: Quiz;
	room: Room;
	users: User[];
	phase: "question" | "result";
	setPhase: (phase: "question" | "result") => void;
	parent: string | null;
	setParent: (parent: string | null) => void;
}

const AdminGame = (props: AdminGameProps) => {
	const [parentScore, setParentScore] = createSignal(0);

	const handleChangeSlider = (e: Event) => {
		const slider = e.target as HTMLInputElement;
		const value = parseInt(slider.value, 10);

		updateDoc(doc(Quizzes, props.quiz.id), {
			scoreRatio: [value, 10 - value],
		});
	};

	const handleShowResult = async () => {
		if (props.parent === null) {
			alert("親を選択してください。");
			return;
		}

		props.setPhase("result");

		if (props.quiz.finished) {
			return;
		}

		const users = await getDocs(Users);
		const quizAnswers = await getDocs(
			collection(Quizzes, props.quiz.id, "answers"),
		);

		const batch = writeBatch(db);
		let scoreSum = 0;

		for (const user of users.docs) {
			if (user.id === props.parent) {
				continue;
			}

			const answer = quizAnswers.docs
				.find((a) => a.id === user.id)
				?.data()?.answer;

			const scoreRatio = props.quiz.scoreRatio ?? [5, 5];

			let score = -Math.max(...scoreRatio);

			if (answer !== undefined) {
				const isCorrect = answer === props.quiz.correct;
				if (isCorrect) {
					score = answer ? scoreRatio[1] : scoreRatio[0];
				} else {
					score = answer ? -scoreRatio[0] : -scoreRatio[1];
				}
			}

			batch.update(user.ref, {
				score: user.data().score + score,
			});

			scoreSum += score;
		}

		const newParentScore = clamp(
			-(Math.ceil(Math.abs(scoreSum / 5)) * Math.sign(scoreSum)),
			-20,
			20,
		);

		batch.update(doc(Users, props.parent!), {
			score:
				(users.docs.find((u) => u.id === props.parent!)?.data().score ?? 0) +
				newParentScore,
		});

		batch.update(doc(Quizzes, props.quiz.id), { finished: true });

		await batch.commit();

		setParentScore(newParentScore);
	};

	const handleNextQuestion = async () => {
		setParentScore(0);
		props.setPhase("question");

		if (props.room.index === 30) {
			alert("最後の問題です。");
			return;
		}

		await updateDoc(doc(Rooms, props.room.id), {
			index: props.room.index + 1,
		});

		props.setParent(null);
	};

	return (
		<div class={styles.game}>
			<p>Question {props.room.index}</p>
			<p>{props.quiz.question}</p>
			<p style={{ "font-size": "0.8em", "text-align": "center" }}>
				◯:✕ = {props.quiz.scoreRatio?.[0]}:{props.quiz.scoreRatio?.[1]}
			</p>
			<input
				class={styles.slider}
				type="range"
				min="1"
				max="9"
				value={props.quiz.scoreRatio?.[0] ?? 5}
				onChange={handleChangeSlider}
			/>
			<p>
				◯: 正解で{props.quiz.scoreRatio?.[1]}点 / 不正解で -
				{props.quiz.scoreRatio?.[0]}点
			</p>
			<p>
				✕: 正解で{props.quiz.scoreRatio?.[0]}点 / 不正解で -
				{props.quiz.scoreRatio?.[1]}点
			</p>
			<Show when={props.phase === "question"}>
				<button
					class={styles.show_result}
					type="button"
					onClick={handleShowResult}
				>
					Show Result
				</button>
			</Show>
			<Show when={props.phase === "result"}>
				<p class={styles.answer}>正解: {props.quiz.correct ? "◯" : "✕"}</p>
				<p>{props.quiz.comment}</p>
				<p>親のスコア: {parentScore()}</p>
				<button class={styles.show_result} type="button" onClick={handleNextQuestion}>
					Next Question
				</button>
			</Show>
		</div>
	);
};

interface AdminUsersProps {
	users: User[];
	quizId: string;
	phase: "question" | "result";
	correct: boolean;
	parent: string | null;
	setParent: (parent: string | null) => void;
}

const AdminUsers = (props: AdminUsersProps) => {
	const quizAnswers = createMemo(() =>
		useFirestore(
			collection(
				Quizzes,
				props.quizId,
				"answers",
			) as CollectionReference<QuizAnswer>,
		),
	);

	return (
		<Doc data={quizAnswers()}>
			{(quizAnswersData) => (
				<ul class={styles.users}>
					<For each={props.users}>
						{(userData) => {
							const answer = () =>
								quizAnswersData?.find((a) => a.user === userData.uid)?.answer;

							const isCorrect = () => answer() === props.correct;

							return (
								<li
									class={styles.user}
									classList={{
										[styles.parent]: props.parent === userData.uid,
										[styles.answered]: answer() !== undefined,
										[styles.correct]: props.phase === "result" && isCorrect(),
										[styles.incorrect]:
											props.phase === "result" && !isCorrect(),
									}}
									onClick={[props.setParent, userData.uid]}
								>
									<span class={styles.user_name}>
										<Show when={props.parent === userData.uid}>☆</Show>
										{userData.name}
									</span>
									<span class={styles.user_score}>{userData.score}</span>
									<span class={styles.user_answer}>
										<Show when={props.phase === "result"}>
											<Switch>
												<Match when={answer() === true}>◯</Match>
												<Match when={answer() === false}>✕</Match>
											</Switch>
										</Show>
									</span>
								</li>
							);
						}}
					</For>
				</ul>
			)}
		</Doc>
	);
};

interface AdminGameSwitcherProps {
	users: User[];
	quizzes: Quiz[];
	room: Room;
}

const AdminGameSwitcher = (props: AdminGameSwitcherProps) => {
	const quiz = createMemo(() =>
		props.quizzes.find((q) => q.index === props.room.index),
	);

	const [phase, setPhase] = createSignal<"question" | "result">("question");
	const [parent, setParent] = createSignal<string | null>(null);

	return (
		<Show when={quiz()}>
			{(quizData) => (
				<div class={styles.admin_game_switcher}>
					<AdminUsers
						users={props.users}
						quizId={quiz()?.id}
						phase={phase()}
						correct={quizData()?.correct}
						parent={parent()}
						setParent={setParent}
					/>
					<AdminGame
						quiz={quizData()}
						room={props.room}
						users={props.users}
						phase={phase()}
						setPhase={setPhase}
						parent={parent()}
						setParent={setParent}
					/>
				</div>
			)}
		</Show>
	);
};

const Admin: Component = () => {
	const users = useFirestore(Users);
	const quizzes = useFirestore(Quizzes);
	const room = useFirestore(doc(Rooms, "default"));

	return (
		<div class={styles.admin}>
			<Doc data={users}>
				{(userData) => (
					<Doc data={room}>
						{(roomData) => (
							<Doc data={quizzes}>
								{(quizzesData) => (
									<AdminGameSwitcher
										users={userData}
										quizzes={quizzesData}
										room={roomData}
									/>
								)}
							</Doc>
						)}
					</Doc>
				)}
			</Doc>
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
