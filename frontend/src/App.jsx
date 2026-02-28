import { useState } from "react";

import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import RandomItem from "@/components/RandomItem";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

/*
App shows Supabase login/signup when not authenticated, and the main UI when logged in.
Use useAuth() for session, accessToken, signOut. Use apiFetch(path, { accessToken }) to call protected backend routes.
*/
function App() {
	const { user, loading, signOut, accessToken } = useAuth();
	const [count, setCount] = useState(0);

	if (loading) {
		return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
	}

	if (!user) {
		return (
			<>
				<h1 style={{ textAlign: "center" }}>Side Quest</h1>
				<AuthForm />
			</>
		);
	}

	return (
		<>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1rem" }}>
				<div>
					<a href="https://vitejs.dev" target="_blank" rel="noreferrer">
						<img src={viteLogo} className="logo" alt="Vite logo" />
					</a>
					<a href="https://react.dev" target="_blank" rel="noreferrer">
						<img src={reactLogo} className="logo react" alt="React logo" />
					</a>
				</div>
				<div>
					<span style={{ marginRight: 8 }}>Logged in as {user.email}</span>
					<button type="button" onClick={() => signOut()}>
						Sign out
					</button>
				</div>
			</div>
			<h1>Vite + React</h1>
			<div className="card">
				<button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
				<p>
					Edit <code>src/App.jsx</code> and save to test HMR
				</p>
				<RandomItem maximum={1000} />
				<p style={{ fontSize: 12, color: "#666" }}>
					Use <code>{'apiFetch("verify-quest", { accessToken, method: "POST", body: ... })'}</code> to call protected backend with your Supabase token.
				</p>
			</div>
			<p className="read-the-docs">Click on the Vite and React logos to learn more</p>
		</>
	);
}

export default App;
