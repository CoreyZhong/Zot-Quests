import { GameProvider, useGame } from "./context/GameContext";
import Toast from "./components/Toast";
import Login from "./pages/Login";
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
	const { currentPage, isLoggedIn, toast, hideToast } = useGame();

	if (!isLoggedIn) {
		return <Login />;
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

	if (!user) {
		return <Login />;
	}

	return (
		<GameProvider supabaseUser={user} signOut={signOut}>
			<AppContent />
		</GameProvider>
	);
}

export default App;
