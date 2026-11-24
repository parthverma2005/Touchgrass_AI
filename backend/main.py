import os
from typing import Annotated, Literal

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import HTTPError, RequestException, Timeout

APP_NAME = "TouchGrass AI"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")

DEFAULT_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]
allowed_origins = os.getenv("TOUCHGRASS_ALLOWED_ORIGINS", "")
if allowed_origins.strip():
    ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
else:
    ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS

app = FastAPI(
    title=APP_NAME,
    description="A local-first companion for personalized outdoor missions.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

Activity = Literal["Running", "Walking", "Hiking", "Cycling"]


def build_mission_prompt(activity: str, duration: int, goal: str) -> str:
    return f"""
Create a safe, realistic outdoor mission.

Activity: {activity}
Duration: {duration} minutes
Goal: {goal}

Return exactly these five labeled sections:
WARM-UP: one short, gentle instruction.
MAIN ACTIVITY: a realistic activity appropriate for the duration.
OUTDOOR CHALLENGE: one simple observation task.
COOL-DOWN: one short recovery instruction.
MOTIVATION: one encouraging sentence.

Keep the total response concise. Do not invent local routes, weather, or safety conditions.
If the goal suggests an unsafe or medically inappropriate activity, recommend a gentler alternative.
""".strip()


@app.get("/")
def home():
    return {"message": "TouchGrass AI is running 🌿", "version": app.version}


@app.get("/health")
def health():
    """Report API status separately from the optional local model status."""
    try:
        response = requests.get(OLLAMA_TAGS_URL, timeout=2)
        response.raise_for_status()
        models = response.json().get("models", [])
        model_available = any(
            model.get("name") == OLLAMA_MODEL
            or model.get("model") == OLLAMA_MODEL
            for model in models
        )
        ollama_status = "available" if model_available else "model_not_found"
    except (RequestsConnectionError, Timeout):
        ollama_status = "unreachable"
    except (HTTPError, ValueError, RequestException):
        ollama_status = "error"

    return {
        "status": "healthy",
        "ai_provider": "ollama",
        "ai_status": ollama_status,
        "model": OLLAMA_MODEL,
    }


@app.post("/generate")
def generate_mission(
    activity: Activity,
    duration: Annotated[int, Query(ge=5, le=180)],
    goal: Annotated[str, Query(min_length=1, max_length=160)],
):
    cleaned_goal = goal.strip()
    if not cleaned_goal:
        raise HTTPException(status_code=422, detail="Goal must not be empty.")

    prompt = build_mission_prompt(activity, duration, cleaned_goal)

    try:
        response = requests.post(
            OLLAMA_GENERATE_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.4,
                    "num_predict": 220,
                },
            },
            timeout=(5, 90),
        )
        response.raise_for_status()
        payload = response.json()
        mission = payload.get("response", "").strip()
        if not mission:
            raise HTTPException(
                status_code=502,
                detail="The local AI returned an empty mission. Please try again.",
            )
        return {
            "mission": mission,
            "provider": "ollama",
            "model": OLLAMA_MODEL,
        }
    except (RequestsConnectionError, Timeout) as exc:
        raise HTTPException(
            status_code=503,
            detail="Local AI is unavailable. Check that Ollama is running and the model is installed.",
        ) from exc
    except HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an error while generating the mission.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an invalid response.",
        ) from exc
    except RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not complete the local AI request.",
        ) from exc
