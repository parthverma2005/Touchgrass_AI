from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="TouchGrass AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:0.5b"


@app.get("/")
def home():
    return {
        "message": "TouchGrass AI is running 🌿"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/generate")
def generate_mission(
    activity: str,
    duration: int,
    goal: str
):

    prompt = f"""
Create an outdoor mission.

Activity: {activity}
Duration: {duration} minutes
Goal: {goal}

OUTPUT ONLY THESE FIVE LINES.
DO NOT include headings with #.
DO NOT include rules.
DO NOT repeat the instructions.
DO NOT explain your answer.

WARM-UP: [one short instruction]
MAIN ACTIVITY: [one short instruction]
OUTDOOR CHALLENGE: [one short outdoor observation]
COOL-DOWN: [one short instruction]
MOTIVATION: [one short encouraging sentence]

Keep every line short.
"""

    response = requests.post(
    OLLAMA_URL,
    json={
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.4,
            "num_predict": 180
        }
    },
    timeout=120
)

    response.raise_for_status()

    data = response.json()

    return {
        "mission": data["response"]
    }