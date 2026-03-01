import { Routes, Route, Navigate } from "react-router-dom";
import { GameProvider, useGame } from "./context/GameContext";
import Toast from "./components/Toast";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";
import OpenTasks from "./pages/OpenTasks";
import ProofOfCompletion from "./pages/ProofOfCompletion";
import CompletedTasks from "./pages/CompletedTasks";
import PetrCollection from "./pages/PetrCollection";
import { useAuth } from "@/contexts/AuthContext";
import "./App.css";

/*
Zot Quests - Side Quest Generator for Real Life
AI generates random side quests for UCI students to accomplish within a given time frame.
Complete quests to earn coins and customize your Petr (anteater pet)!
Auth: Supabase (useAuth). When logged in, GameProvider gets supabaseUser so game state stays in sync.
*/

function AppContent() {
	const { currentPage, isLoggedIn, toast, hideToast, gameStateLoading } = useGame();

	if (!isLoggedIn) {
		return <Login />;
	}

	if (gameStateLoading) {
		return (
			<div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
				<p style={{ fontSize: "1.25rem", color: "#2c3e50" }}>Loading your progress…</p>
			</div>
		);
	}

	const renderPage = () => {
		switch (currentPage) {
			case "landing":
				return <Landing />;
			case "openTasks":
				return <OpenTasks />;
			case "proof":
				return <ProofOfCompletion />;
			case "completedTasks":
				return <CompletedTasks />;
			case "petrCollection":
				return <PetrCollection />;
			default:
				return <Landing />;
		}
	};

	return (
		<div className="app">
			{renderPage()}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={hideToast}
				/>
			)}
		</div>
	);
}

function App() {
	const { user, loading, signOut } = useAuth();

	if (loading) {
		return (
			<div style={{ padding: "2rem", textAlign: "center" }}>
				Loading…
			</div>
		);
	}

	return (
		<Routes>
			<Route path="/reset-password" element={<ResetPassword />} />
			<Route path="/forgot-password" element={<ForgotPassword />} />
			<Route
				path="*"
				element={
					!user ? (
						<Login />
					) : (
						<GameProvider supabaseUser={user} signOut={signOut}>
							<AppContent />
						</GameProvider>
					)
				}
			/>
		</Routes>
	);
}

export default App;
