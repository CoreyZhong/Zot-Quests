import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [session, setSession] = useState(null);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	async function signUp(email, password) {
		const { data, error } = await supabase.auth.signUp({ email, password });
		if (error) throw error;
		return data;
	}

	async function signIn(email, password) {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw error;
		return data;
	}

	async function signOut() {
		await supabase.auth.signOut();
	}

	const value = {
		session,
		user,
		loading,
		signUp,
		signIn,
		signOut,
		accessToken: session?.access_token ?? null,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
