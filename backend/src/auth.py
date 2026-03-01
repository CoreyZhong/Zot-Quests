# FastAPI imports for dependencies, errors, and status codes.
from fastapi import Depends, HTTPException, status
# bearer-token auth; auto_error=False prevents automatic 401.
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
# library for decoding JWTs issued by Supabase (which uses HS256).
from jose import JWTError, jwt
import os


# security dependency used in routes to fetch credentials.
security = HTTPBearer(auto_error=False)


class CurrentUser:
    """Tiny wrapper representing an authenticated user.

    We only care about the user's unique ID at the moment. Supabase
    issues a JWT containing this in the ``sub`` claim (or ``user_id``),
    which we extract and expose via this simple object.

    Other user attributes could be added later if needed.
    """

    def __init__(self, user_id: str):
        self.id = user_id


def _get_supabase_jwt_secret() -> str:
    """Load the JWT signing secret from the environment.

    Supabase uses a shared secret for HS256 tokens; our backend must use the
    same value to verify any bearer token presented by the client. During
    development this lives in ``.env`` and is loaded by ``dotenv``.
    """
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        # In production this must match the JWT secret from your Supabase project.
        raise RuntimeError("SUPABASE_JWT_SECRET is not set")
    return secret


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser | None:
    """Dependency that validates a Supabase JWT and returns a user object.

    If no credentials are supplied the function returns ``None`` instead of
    raising an error. this makes it easy to leave routes unprotected in
    development while still allowing handlers to inspect ``current_user`` if
    present.

    The token is decoded and verified using the HS256 secret obtained above.
    Any decoding error or missing required claim results in a 401 response.
    """

    # HTTPBearer(auto_error=False) makes ``creds`` None when no header is
    # provided; we treat that as anonymous rather than an error.
    if not creds or creds.scheme.lower() != "bearer":
        return None

    token = creds.credentials
    try:
        payload = jwt.decode(token, _get_supabase_jwt_secret(), algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub") or payload.get("user_id")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return CurrentUser(user_id=user_id)

