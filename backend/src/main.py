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

from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# import api
# when `src` is a package this can be imported relatively; ensures the
# module path is correct whether you run from backend/ or backend/src/.
# Running `python -m uvicorn src.main:app` will work because `src` is now a
# package (see __init__.py below).
from .api import app as api_app

# the frontend build output is published into the workspace root's
# `public` directory. during local development the frontend dev server is
# running separately so we don't actually need to serve these files. rather
# than hard‑coding a path that might be wrong, compute the candidate and only
# use it if the directory actually exists.
PUBLIC_DIRECTORY = Path(__file__).resolve().parents[2] / "public"

# NOTE: parents[0]==src, parents[1]==backend, parents[2]==workspace root.


# Create a main app under which the API will be mounted as a sub-app
app = FastAPI()

# add simple middleware to log incoming requests and any exceptions
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

# Send all requests to paths under `/api/*` to the API router
app.mount("/api", api_app)


# Make the public files (HTML, JS, CSS, etc.) accessible on the server
# With HTML mode, `index.html` is automatically loaded
# Mount the frontend build output only if it exists. during development
# the Vite server serves the app directly and the proxy handles `/api` calls,
# so this mount is unnecessary and can even cause startup errors when the
# directory is missing.
# only mount the directory when it actually contains the built SPA; if
# someone runs the backend without ever building the frontend, the static
# middleware will intercept *every* request and raise a 404 error which turns
# into a 500 (see the test client output in comments above). during development
# the front end runs on Vite and we don't need this at all.
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