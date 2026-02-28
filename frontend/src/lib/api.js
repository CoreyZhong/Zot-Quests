/**
 * Call the FastAPI backend with the Supabase access token.
 * Use for protected routes (e.g. /api/verify-quest).
 *
 * @param {string} path - API path without /api prefix (e.g. "verify-quest")
 * @param {RequestInit & { accessToken?: string }} options - fetch options; pass accessToken to add Authorization header
 */
export async function apiFetch(path, options = {}) {
	const { accessToken, ...fetchOptions } = options;
	const headers = new Headers(fetchOptions.headers);

	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}

	const res = await fetch(`/api/${path}`, {
		...fetchOptions,
		headers,
	});

	if (!res.ok) {
		const text = await res.text();
		let detail = text;
		try {
			const j = JSON.parse(text);
			detail = j.detail ?? text;
		} catch (_) {}
		throw new Error(detail);
	}

	return res.json();
}
