import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			// Set alias to use absolute imports (instead of relative)
			"@/": "/src/",
		},
	},
	server: {
		proxy: {
			/*
			Proxy requests beginning with `/api` to the backend on port 8000. The
			backend mounts its FastAPI sub‑app at `/api`, so we must preserve that
			prefix. Previously we stripped `/api` which caused all calls to be sent as
			`/hello` etc and resulted in 404s (the handler tried to serve the SPA and
			throw an error). By leaving the path untouched we let the backend route
			match correctly.

			This also avoids CORS during development.
			*/
			"/api": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
				// no rewrite: keep the `/api` prefix when forwarding
			},
		},
	},
});
