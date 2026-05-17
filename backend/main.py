from fastapi import FastAPI

app = FastAPI(
    title="DefinAm API",
    description="Backend API for the DefinAm learning platform",
    version="0.1.0",
)


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
