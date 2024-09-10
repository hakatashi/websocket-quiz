import type { Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";

import { Quiz } from "./lib/firebase";
import { addDoc } from "firebase/firestore";

const App: Component = () => {
	const handleClick = async () => {
		const quiz = await addDoc(Quiz, {
			title: "My Quiz",
			questions: [
				{
					question: "What is 2 + 2?",
					answers: [
						{ text: "4", correct: true },
						{ text: "22", correct: false },
						{ text: "5", correct: false },
						{ text: "10", correct: false },
					],
				},
			],
		});

		console.log("Quiz added with ID: ", quiz.id);
	};

	return (
		<div class={styles.App}>
			<header class={styles.header}>
				<img src={logo} class={styles.logo} alt="logo" />
				<p>
					Edit <code>src/App.tsx</code> and save to reload.
				</p>
				<button type="button" onClick={handleClick}>Add Quiz</button>
			</header>
		</div>
	);
};

export default App;
