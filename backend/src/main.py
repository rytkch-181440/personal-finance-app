import os

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, SecretStr
from supabase import (
    AuthApiError,
    AuthInvalidCredentialsError,
    Client,
    ClientOptions,
    create_client,
)

load_dotenv()

app = FastAPI(title="Personal Finance API", version="0.1.0")
frontend_origins = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
bearer_scheme = HTTPBearer(auto_error=False)


class TokenRequest(BaseModel):
    email: str
    password: SecretStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


def _create_supabase_client(
    http_client: httpx.Client,
    access_token: str | None = None,
) -> Client:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase is not configured",
        )

    headers = {}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    options = ClientOptions(headers=headers, httpx_client=http_client)
    return create_client(supabase_url, supabase_key, options)


def _get_authenticated_user_id(supabase: Client, access_token: str) -> str:
    try:
        user_response = supabase.auth.get_user(access_token)
    except AuthInvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        ) from error
    except AuthApiError as error:
        if error.status in {
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        }:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token",
            ) from error
        if error.status == status.HTTP_429_TOO_MANY_REQUESTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts",
            ) from error
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase authentication failed",
        ) from error

    if user_response is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )
    return user_response.user.id


def _require_bearer_token(
    credentials: HTTPAuthorizationCredentials | None,
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Supabase access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/token", response_model=TokenResponse, tags=["authentication"])
def get_access_token(credentials: TokenRequest) -> TokenResponse:
    with httpx.Client() as http_client:
        supabase = _create_supabase_client(http_client)
        try:
            response = supabase.auth.sign_in_with_password(
                {
                    "email": credentials.email,
                    "password": credentials.password.get_secret_value(),
                }
            )
        except AuthInvalidCredentialsError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            ) from error
        except AuthApiError as error:
            if error.status == status.HTTP_400_BAD_REQUEST:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed",
                ) from error
            if error.status == status.HTTP_429_TOO_MANY_REQUESTS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts",
                ) from error
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Supabase authentication failed",
            ) from error

        if response.session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication did not return a session",
            )

        session = response.session
        return TokenResponse(
            access_token=session.access_token,
            token_type=session.token_type,
            expires_in=session.expires_in,
        )


@app.get("/auth/me", tags=["authentication"])
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, str]:
    access_token = _require_bearer_token(credentials)
    with httpx.Client() as http_client:
        supabase = _create_supabase_client(http_client, access_token)
        return {"id": _get_authenticated_user_id(supabase, access_token)}


@app.get("/categories", tags=["categories"])
def get_categories(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> list[dict[str, object]]:
    access_token = _require_bearer_token(credentials)
    with httpx.Client() as http_client:
        supabase = _create_supabase_client(http_client, access_token)
        user_id = _get_authenticated_user_id(supabase, access_token)
        response = (
            supabase.table("categories")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data


def main() -> None:
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["src"],
        app_dir="src",
    )


if __name__ == "__main__":
    main()
