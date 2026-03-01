"""
If you are deploying on Vercel, you can delete this file.

This app puts together the frontend UI and backend API for deployment on Render.
For local development, the app for just the API should be run on its own:
$ fastapi dev src/api.py

The provided Dockerfile will handle putting everything together for deployment.
When used, the application bundle from building the React app with `npm run build`
is placed at the public directory defined below for FastAPI to serve as static assets.
That means any requests for existing files will be served the contents of those files,
and any requests for the API paths will be sent to the API routes defined in the API.
"""

# utilities for working with filesystem paths
from pathlib import Path

# FastAPI components for app, requests, errors, and static files.
from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# mount actual API app from api.py using package-relative import.
from .api import app as api_app

# path to React build output; may not exist during development.
PUBLIC_DIRECTORY = Path(__file__).resolve().parents[2] / "public"

# NOTE: parents[0]==src, parents[1]==backend, parents[2]==workspace root.


# Create a main app under which the API will be mounted as a sub-app
# wrapper app that mounts real API and applies shared middleware.
app = FastAPI()

# middleware logs requests and errors before passing to API.
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"--> {request.method} {request.url}")
    try:
        response = await call_next(request)
        print(f"<-- {response.status_code} {request.url}")
        return response
    except Exception as exc:
        print(f"[ERROR] request {request.url} raised", exc)
        raise

# mount api_app at /api; frontend dev server proxies requests here.
app.mount("/api", api_app)


# serve frontend build files if directory exists; skip otherwise.
if PUBLIC_DIRECTORY.is_dir() and (PUBLIC_DIRECTORY / "index.html").exists():
    app.mount("/", StaticFiles(directory=PUBLIC_DIRECTORY, html=True), name="static")
else:
    print(f"⚠️  skipping static mount; make sure to run `npm run build` in the frontend if you need it ({PUBLIC_DIRECTORY})")


@app.exception_handler(status.HTTP_404_NOT_FOUND)
async def not_found(req: Request, exc: HTTPException) -> FileResponse:
    """
    Serve the frontend app for all other requests not directed to `/api/` or `/`.

    This allows the single-page application to do client-side routing where the browser
    process the URL path in the React App. Otherwise, users would see 404 Not Found when
    navigating directly to a virtual path.

    This should be removed if the frontend app does not handle different URL paths.
    """
    return FileResponse(PUBLIC_DIRECTORY / "index.html")