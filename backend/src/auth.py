from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import os


security = HTTPBearer(auto_error=False)


class CurrentUser:
    """
    Represents the authenticated Supabase user.

    The frontend should authenticate with Supabase directly and send the Supabase
    access token to this API in the `Authorization: Bearer <token>` header.
    """

    def __init__(self, user_id: str):
        self.id = user_id


def _get_supabase_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        # In production this must match the JWT secret from your Supabase project.
        raise RuntimeError("SUPABASE_JWT_SECRET is not set")
    return secret


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """
    Validate the Supabase access token and return the current user.
    """

    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = creds.credentials
    try:
        payload = jwt.decode(token, _get_supabase_jwt_secret(), algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub") or payload.get("user_id")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return CurrentUser(user_id=user_id)

