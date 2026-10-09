# 🌿 TouchGrass AI

> **Get out. AI stays in.**

TouchGrass AI is a local-first outdoor companion powered by open-weight AI.

Instead of using AI to keep people staring at a screen, TouchGrass AI uses AI to create personalized outdoor missions and then encourages the user to put their phone away and go outside.

The AI runs locally through **Ollama**, using the **Qwen 2.5 0.5B** open-weight model.

---

## 🌱 Why TouchGrass AI?

Modern AI applications often keep users inside a screen:

- Chat
- Generate
- Read
- Scroll
- Repeat

TouchGrass AI takes the opposite approach.

The screen is only used to:

1. Create an outdoor mission.
2. Start the activity.
3. Record a short reflection.

Then the user is encouraged to put the phone away.

### The goal

> **Make the screen the shortest part of the experience.**

---

## 🤖 Why Open AI?

The core AI does not depend on a proprietary cloud AI API.

TouchGrass AI uses:

- **Qwen 2.5 0.5B** — open-weight model
- **Ollama** — local model runtime
- **FastAPI** — local backend
- **Browser localStorage** — local activity history

The model runs on the user's own machine.

### Why this matters

#### 🔒 Privacy

Outdoor activity information and reflections do not need to be sent to a third-party AI provider.

#### 💰 Cost

The core AI functionality does not require an API subscription or per-request cloud fees.

#### 🔧 Modifiability

Users can replace the model or modify the local AI workflow.

#### 📡 Offline potential

The AI generation itself does not require an internet connection once the model is installed.

---

## 🏗️ Architecture

```text
                    TOUCHGRASS AI
                          │
                          ▼
                    Web Interface
                          │
                          ▼
                       FastAPI
                          │
                          ▼
                    Ollama Runtime
                          │
                          ▼
                  Qwen 2.5 · 0.5B
                          │
                          ▼
                 Outdoor Mission
                          │
                          ▼
                    GO OUTSIDE 🌳
                          │
                          ▼
                     Reflection
                          │
                          ▼
                   Browser Storage
                    localStorage
```

No cloud AI API is required for the core experience.

---

## ✨ Features

### 🏃 Outdoor Mission Generator

Choose:

- Running
- Walking
- Hiking
- Cycling

Then provide:

- Duration
- Personal goal

The local AI generates an outdoor mission.

---

### 🤖 Local AI

The mission generation runs through:

```text
Ollama
   ↓
Qwen 2.5 0.5B
```

No proprietary AI API is required.

---

### 🌳 Go Outside Mode

Once a mission is generated, the user enters:

> **GO OUTSIDE**

The application provides a simple outside timer and deliberately reduces the amount of information presented on screen.

The objective is to encourage the user to stop looking at the phone.

---

### 🌿 Reflection

After completing an activity, users can record:

- Energy
- Mood
- Difficulty
- What they noticed outside

---

### 📖 My Journey

Previous experiences are stored locally in the browser.

Users can view:

- Number of missions
- Total time outside
- Previous activities
- Ratings
- Reflections

---

## 🔐 Privacy

TouchGrass AI follows a local-first approach.

### AI

The AI model runs locally through Ollama.

### History

Experience history is stored using browser `localStorage`.

### No account required

There is currently no authentication system.

### No cloud database

The project does not require a remote database for its core functionality.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML | Interface |
| CSS | Styling |
| JavaScript | Frontend logic |
| Python | Backend |
| FastAPI | API server |
| Ollama | Local AI runtime |
| Qwen 2.5 0.5B | Open-weight AI |
| localStorage | Local experience history |

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd touchgrass-AI
```

### 2. Set up Python

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Install Ollama

Install Ollama for your operating system and download the model:

```bash
ollama pull qwen2.5:0.5b
```

Test the model:

```bash
ollama run qwen2.5:0.5b
```

### 4. Start FastAPI

From the `backend` directory:

```bash
uvicorn main:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

### 5. Start the frontend

Open:

```text
frontend/index.html
```

using VS Code Live Server.

---

## 📁 Project Structure

```text
touchgrass-AI/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .gitignore
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── screenshots/
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🌍 The Outdoor Experiment

The most important part of TouchGrass AI is not the code.

It is what happens after the code generates the mission.

The project will be tested outdoors to answer:

- Did the mission actually encourage outdoor activity?
- Did the user spend less time looking at the phone?
- Was the generated challenge useful?
- Did local AI provide enough personalization?
- What should be improved?

The results will be documented as part of the Hacktoberfest submission.

---

## 🔮 Future Ideas

Possible future improvements include:

- Local vision model for identifying plants and birds
- Offline maps
- Weather-aware missions
- Trail and route suggestions
- Voice-based outdoor instructions
- More open-weight model options
- Accessibility improvements
- Better local analytics

These features are intentionally outside the initial MVP so that the core experience remains simple.

---

## 🏆 Hacktoberfest 2026

Built for the **Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass**.

The project explores how open-weight and locally running AI can be used to encourage people to spend **less time with technology and more time in the physical world**.

---

## 📄 License

MIT License