/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import "solid-devtools";
import App from "./App";
import { FirebaseProvider } from "solid-firebase";
import app from "./lib/firebase";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
	);
}

render(
	() => (
		<FirebaseProvider app={app}>
			<UserApp />
		</FirebaseProvider>
	),
	root!,
);
