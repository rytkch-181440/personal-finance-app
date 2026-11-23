import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Personal Finance API", version="0.1.0")


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def main() -> None:
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
