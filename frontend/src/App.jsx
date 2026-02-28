import { GameProvider, useGame } from "./context/GameContext";
import Header from "./components/Header";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import OpenTasks from "./pages/OpenTasks";
import ProofOfCompletion from "./pages/ProofOfCompletion";
import CompletedTasks from "./pages/CompletedTasks";
import PetrCollection from "./pages/PetrCollection";
import "./App.css";

/*
Zot Quests - Side Quest Generator for Real Life
AI generates random side quests for UCI students to accomplish within a given time frame.
Complete quests to earn coins and customize your Petr (anteater pet)!
*/

function AppContent() {
	const { currentPage, isLoggedIn } = useGame();

	// If not logged in, show login page
	if (!isLoggedIn) {
		return <Login />;
	}

	// Conditional routing based on currentPage state
	const renderPage = () => {
		switch (currentPage) {
			case 'landing':
				return <Landing />;
			case 'openTasks':
				return <OpenTasks />;
			case 'proof':
				return <ProofOfCompletion />;
			case 'completedTasks':
				return <CompletedTasks />;
			case 'petrCollection':
				return <PetrCollection />;
			default:
				return <Landing />;
		}
	};

	return (
		<div className="app">
			<Header />
			{renderPage()}
		</div>
	);
}

function App() {
	return (
		<GameProvider>
			<AppContent />
		</GameProvider>
	);
}

export default App;
