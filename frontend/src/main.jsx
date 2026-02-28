import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "@/contexts/AuthContext";
import "./index.css";

/*
This code renders our project so it can be viewed in a browser.
AuthProvider makes Supabase session and auth helpers available to the app.
*/
ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<App />
		</AuthProvider>
	</React.StrictMode>
);
