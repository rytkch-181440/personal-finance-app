import os
from datetime import date
from typing import Literal

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field, SecretStr
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
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
bearer_scheme = HTTPBearer(auto_error=False)

EntryType = Literal["expense", "income"]
TransactionSource = Literal["manual", "csv"]


# ---------------------------------------------------------------------------
# リクエスト/レスポンスモデル
# ---------------------------------------------------------------------------
class TokenRequest(BaseModel):
    email: str
    password: SecretStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class CategoryCreate(BaseModel):
    type: EntryType
    parent_id: str | None = None
    name: str = Field(min_length=1, max_length=50)
    icon: str | None = Field(default=None, max_length=50)
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    icon: str | None = Field(default=None, max_length=50)
    sort_order: int | None = None


class TransactionCreate(BaseModel):
    category_id: str
    occurred_on: date
    entry_type: EntryType
    amount: int = Field(gt=0)
    memo: str | None = Field(default=None, max_length=200)
    source: TransactionSource = "manual"


class TransactionUpdate(BaseModel):
    category_id: str | None = None
    occurred_on: date | None = None
    entry_type: EntryType | None = None
    amount: int | None = Field(default=None, gt=0)
    memo: str | None = Field(default=None, max_length=200)
    source: TransactionSource | None = None


# ---------------------------------------------------------------------------
# Supabase クライアント / 認証
# ---------------------------------------------------------------------------
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


def _authenticated_client(
    credentials: HTTPAuthorizationCredentials | None,
) -> tuple[Client, str]:
    """ユーザーのJWTでSupabaseクライアントを作り、(client, user_id)を返す。"""
    access_token = _require_bearer_token(credentials)
    http_client = httpx.Client()
    supabase = _create_supabase_client(http_client, access_token)
    user_id = _get_authenticated_user_id(supabase, access_token)
    return supabase, user_id


# ---------------------------------------------------------------------------
# 認証・ヘルス
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# カテゴリ
# ---------------------------------------------------------------------------
# (type, 大分類名, 大分類アイコン, [(小分類名, アイコン), ...])
SEED_CATEGORIES: list[tuple[str, str, str | None, list[tuple[str, str | None]]]] = [
    ("expense", "食費", "utensils", [
        ("食料品", "cart"), ("外食", "utensils"), ("カフェ", "coffee"), ("惣菜・弁当", "utensils"),
    ]),
    ("expense", "日用品", "cart", [
        ("消耗品", "tag"), ("洗剤・衛生用品", "zap"), ("雑貨", "gift"),
    ]),
    ("expense", "交通", "car", [
        ("電車・バス", "car"), ("タクシー", "car"), ("ガソリン", "zap"),
    ]),
    ("expense", "住居・光熱", "house", [
        ("家賃", "house"), ("電気", "zap"), ("ガス", "zap"), ("水道", "zap"),
    ]),
    ("expense", "通信", "phone", [
        ("スマホ", "phone"), ("インターネット", "phone"),
    ]),
    ("expense", "娯楽", "game", [
        ("映画・動画", "game"), ("本", "book"), ("ゲーム", "game"),
    ]),
    ("expense", "衣服・美容", "shirt", [
        ("衣類", "shirt"), ("美容院", "heart"),
    ]),
    ("expense", "医療", "heart", [
        ("通院", "heart"), ("薬", "heart"),
    ]),
    ("expense", "その他", "dots", [("その他", "dots")]),
    ("income", "給与", "banknote", [("本給", "banknote"), ("賞与", "gift")]),
    ("income", "副収入", "wallet", [("その他", "dots")]),
    ("income", "お小遣い", "gift", [("その他", "dots")]),
    ("income", "その他", "dots", [("その他", "dots")]),
]


def _seed_default_categories(supabase: Client, user_id: str) -> None:
    rows: list[dict[str, object]] = []
    sort = 0
    for cat_type, parent_name, parent_icon, children in SEED_CATEGORIES:
        parent_row = {
            "user_id": user_id,
            "type": cat_type,
            "parent_id": None,
            "name": parent_name,
            "icon": parent_icon,
            "sort_order": sort,
        }
        sort += 1
        rows.append(parent_row)
        for child_name, child_icon in children:
            rows.append({
                "user_id": user_id,
                "type": cat_type,
                "name": child_name,
                "icon": child_icon,
                "sort_order": 0,
                "_parent_name": parent_name,
                "_parent_type": cat_type,
            })

    # 親を先に挿入してIDを取得し、小分類の parent_id を解決する
    parents = [r for r in rows if "_parent_name" not in r]
    children = [r for r in rows if "_parent_name" in r]
    inserted_parents = (
        supabase.table("categories")
        .insert([{k: v for k, v in p.items()} for p in parents])
        .execute()
        .data
    )
    parent_ids = {(p["type"], p["name"]): p["id"] for p in inserted_parents}
    child_rows = []
    for c in children:
        row = {k: v for k, v in c.items() if not k.startswith("_")}
        row["parent_id"] = parent_ids[(c["_parent_type"], c["_parent_name"])]
        child_rows.append(row)
    if child_rows:
        supabase.table("categories").insert(child_rows).execute()


@app.get("/categories", tags=["categories"])
def get_categories(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> list[dict[str, object]]:
    supabase, user_id = _authenticated_client(credentials)
    response = (
        supabase.table("categories")
        .select("*")
        .eq("user_id", user_id)
        .order("sort_order")
        .order("name")
        .execute()
    )
    if not response.data:
        try:
            _seed_default_categories(supabase, user_id)
        except APIError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to seed default categories",
            ) from error
        response = (
            supabase.table("categories")
            .select("*")
            .eq("user_id", user_id)
            .order("sort_order")
            .order("name")
            .execute()
        )
    return response.data


@app.post("/categories", status_code=status.HTTP_201_CREATED, tags=["categories"])
def create_category(
    body: CategoryCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object]:
    supabase, user_id = _authenticated_client(credentials)

    if body.parent_id is not None:
        parent = (
            supabase.table("categories")
            .select("id, user_id, type, parent_id")
            .eq("id", body.parent_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not parent.data:
            raise HTTPException(status_code=404, detail="Parent category not found")
        if parent.data[0]["parent_id"] is not None:
            raise HTTPException(
                status_code=400,
                detail="Parent must be a top-level category",
            )
        if parent.data[0]["type"] != body.type:
            raise HTTPException(
                status_code=400,
                detail="Category type must match parent type",
            )

    payload = body.model_dump()
    try:
        response = (
            supabase.table("categories")
            .insert({**payload, "user_id": user_id})
            .execute()
        )
    except APIError as error:
        if "categories_unique_name" in str(error) or "duplicate" in str(error).lower():
            raise HTTPException(
                status_code=409, detail="Category name already exists"
            ) from error
        raise HTTPException(
            status_code=400, detail="Failed to create category"
        ) from error
    return response.data[0]


@app.patch("/categories/{category_id}", tags=["categories"])
def update_category(
    category_id: str,
    body: CategoryUpdate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object]:
    supabase, user_id = _authenticated_client(credentials)
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        response = (
            supabase.table("categories")
            .update(payload)
            .eq("id", category_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as error:
        if "duplicate" in str(error).lower():
            raise HTTPException(
                status_code=409, detail="Category name already exists"
            ) from error
        raise HTTPException(
            status_code=400, detail="Failed to update category"
        ) from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return response.data[0]


@app.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["categories"])
def delete_category(
    category_id: str,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    supabase, user_id = _authenticated_client(credentials)
    try:
        response = (
            supabase.table("categories")
            .delete()
            .eq("id", category_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as error:
        raise HTTPException(
            status_code=409,
            detail="Category is in use by transactions or has children",
        ) from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Category not found")


# ---------------------------------------------------------------------------
# 取引（transactions）
# ---------------------------------------------------------------------------
def _month_bounds(year_month: str) -> tuple[str, str]:
    """'YYYY-MM' → (月初, 翌月初) の date 文字列を返す。"""
    year, month = (int(p) for p in year_month.split("-"))
    start = date(year, month, 1)
    end = date(year + (month == 12), month % 12 + 1, 1)
    return start.isoformat(), end.isoformat()


def _recompute_month_totals(
    supabase: Client, user_id: str, occurred_on: str
) -> None:
    """対象取引日の属する月の category_monthly_totals を再集計する。"""
    month_start = occurred_on[:7]
    start, end = _month_bounds(month_start)

    rows = (
        supabase.table("transactions")
        .select("category_id, entry_type, amount")
        .eq("user_id", user_id)
        .gte("occurred_on", start)
        .lt("occurred_on", end)
        .execute()
        .data
    )

    aggregated: dict[tuple[str, str], dict[str, int]] = {}
    for r in rows:
        key = (r["category_id"], r["entry_type"])
        slot = aggregated.setdefault(key, {"total_amount": 0, "transaction_count": 0})
        slot["total_amount"] += r["amount"]
        slot["transaction_count"] += 1

    supabase.table("category_monthly_totals").delete().eq(
        "user_id", user_id
    ).gte("year_month", start).lt("year_month", end).execute()

    if aggregated:
        supabase.table("category_monthly_totals").insert([
            {
                "user_id": user_id,
                "year_month": start,
                "category_id": category_id,
                "entry_type": entry_type,
                "total_amount": v["total_amount"],
                "transaction_count": v["transaction_count"],
            }
            for (category_id, entry_type), v in aggregated.items()
        ]).execute()


def _get_transaction_or_404(supabase: Client, user_id: str, transaction_id: str) -> dict:
    response = (
        supabase.table("transactions")
        .select("*")
        .eq("id", transaction_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return response.data[0]


@app.get("/transactions", tags=["transactions"])
def get_transactions(
    occurred_from: str | None = Query(default=None),
    occurred_to: str | None = Query(default=None),
    entry_type: EntryType | None = Query(default=None),
    category_id: str | None = Query(default=None),
    limit: int = Query(default=500, le=1000),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> list[dict[str, object]]:
    supabase, user_id = _authenticated_client(credentials)
    query = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("occurred_on", desc=True)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if occurred_from:
        query = query.gte("occurred_on", occurred_from)
    if occurred_to:
        query = query.lte("occurred_on", occurred_to)
    if entry_type:
        query = query.eq("entry_type", entry_type)
    if category_id:
        query = query.eq("category_id", category_id)
    return query.execute().data


@app.post("/transactions", status_code=status.HTTP_201_CREATED, tags=["transactions"])
def create_transaction(
    body: TransactionCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object]:
    supabase, user_id = _authenticated_client(credentials)
    payload = body.model_dump()
    try:
        response = (
            supabase.table("transactions")
            .insert({**payload, "user_id": user_id})
            .execute()
        )
    except APIError as error:
        raise HTTPException(
            status_code=400, detail="Failed to create transaction"
        ) from error
    _recompute_month_totals(supabase, user_id, body.occurred_on.isoformat())
    return response.data[0]


@app.patch("/transactions/{transaction_id}", tags=["transactions"])
def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object]:
    supabase, user_id = _authenticated_client(credentials)
    existing = _get_transaction_or_404(supabase, user_id, transaction_id)
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    occurred_on = str(payload.get("occurred_on") or existing["occurred_on"])
    try:
        response = (
            supabase.table("transactions")
            .update(payload)
            .eq("id", transaction_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as error:
        raise HTTPException(
            status_code=400, detail="Failed to update transaction"
        ) from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Transaction not found")

    _recompute_month_totals(supabase, user_id, existing["occurred_on"])
    if occurred_on != existing["occurred_on"]:
        _recompute_month_totals(supabase, user_id, occurred_on)
    return response.data[0]


@app.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["transactions"])
def delete_transaction(
    transaction_id: str,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    supabase, user_id = _authenticated_client(credentials)
    existing = _get_transaction_or_404(supabase, user_id, transaction_id)
    response = (
        supabase.table("transactions")
        .delete()
        .eq("id", transaction_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    _recompute_month_totals(supabase, user_id, existing["occurred_on"])


# ---------------------------------------------------------------------------
# 月次集計（分析用）
# ---------------------------------------------------------------------------
@app.get("/summary/monthly", tags=["summary"])
def get_monthly_summary(
    from_month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    to_month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> list[dict[str, object]]:
    """category_monthly_totals をそのまま返す。集計はフロント側で行う。"""
    supabase, user_id = _authenticated_client(credentials)
    start, _ = _month_bounds(from_month)
    # to_month の翌月初を排他的上限にする
    ty, tm = (int(p) for p in to_month.split("-"))
    to_exclusive = date(ty + (tm == 12), tm % 12 + 1, 1).isoformat()
    return (
        supabase.table("category_monthly_totals")
        .select("*")
        .eq("user_id", user_id)
        .gte("year_month", start)
        .lt("year_month", to_exclusive)
        .order("year_month")
        .execute()
        .data
    )


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
