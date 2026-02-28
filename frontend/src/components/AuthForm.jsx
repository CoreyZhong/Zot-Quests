import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthForm() {
	const { signIn, signUp } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setMessage("");
		setLoading(true);
		try {
			if (isSignUp) {
				await signUp(email, password);
				setMessage("Check your email to confirm sign up (or sign in if already confirmed).");
			} else {
				await signIn(email, password);
			}
		} catch (err) {
			setMessage(err?.message ?? "Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ maxWidth: 320, margin: "2rem auto", padding: "1rem", border: "1px solid #ccc", borderRadius: 8 }}>
			<h2 style={{ marginTop: 0 }}>{isSignUp ? "Sign up" : "Sign in"}</h2>
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: "0.75rem" }}>
					<label htmlFor="auth-email" style={{ display: "block", marginBottom: 4 }}>
						Email
					</label>
					<input
						id="auth-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
						style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
					/>
				</div>
				<div style={{ marginBottom: "0.75rem" }}>
					<label htmlFor="auth-password" style={{ display: "block", marginBottom: 4 }}>
						Password
					</label>
					<input
						id="auth-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete={isSignUp ? "new-password" : "current-password"}
						style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
					/>
				</div>
				{message && (
					<p style={{ color: "#c00", fontSize: 14, marginBottom: "0.75rem" }}>{message}</p>
				)}
				<button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", marginRight: 8 }}>
					{loading ? "..." : isSignUp ? "Sign up" : "Sign in"}
				</button>
				<button
					type="button"
					onClick={() => {
						setIsSignUp((s) => !s);
						setMessage("");
					}}
					style={{ padding: "0.5rem 1rem" }}
				>
					{isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
				</button>
			</form>
		</div>
	);
}
