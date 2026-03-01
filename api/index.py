"""Entry point for Vercel deployments only.
Remove this file if not using Vercel.
"""
# import FastAPI to create the wrapper application
from fastapi import FastAPI

# import the main FastAPI instance defined elsewhere in the
# repository (backend/src/api.py). Vercel will spin up this file
# as the entry point and then forward any requests under `/api`
# to the real application.
# bring in the main API defined elsewhere
from api import app as api

# create a lightweight wrapper application that only exists so
# Vercel has something to invoke. the mounted app handles all
# of the actual routes and business logic.
app = FastAPI()
app.mount("/api", api)
