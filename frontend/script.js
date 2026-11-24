const API_BASE = window.TOUCHGRASS_API_BASE || "http://127.0.0.1:8000";
const HISTORY_KEY = "touchgrass_history";
const ACTIVITY_ICONS = {
  Running: "🏃",
  Walking: "🚶",
  Hiking: "🥾",
  Cycling: "🚲"
};
const MISSION_SECTIONS = [
  { key: "WARM-UP", icon: "🔥" },
  { key: "MAIN ACTIVITY", icon: "🌿" },
  { key: "OUTDOOR CHALLENGE", icon: "👀" },
  { key: "COOL-DOWN", icon: "🧘" },
  { key: "MOTIVATION", icon: "✳" }
];

let selectedActivity = "Walking";
let currentMission = null;
let outsideSeconds = 0;
let outsideStartedAt = null;
let outsideInterval = null;
let ratings = { energy: 0, mood: 0, difficulty: 0 };

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : [];
  } catch (error) {
    console.warn("TouchGrass history could not be read:", error);
    return [];
  }
}

function writeHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error("TouchGrass history could not be saved:", error);
    return false;
  }
}

function setButtonLoading(button, loading) {
  button.disabled = loading;
  button.querySelector(".generate-label").textContent = loading ? "Making your plan…" : "Make my mission";
  button.querySelector(".generate-icon").textContent = loading ? "…" : "✳";
  button.querySelector(".generate-arrow").textContent = loading ? "" : "↗";
}

function setAIStatus(state, label, connection = label) {
  const button = $("aiStatus");
  button.dataset.state = state;
  $("aiStatusText").textContent = label;
  $("aiConnectionValue").textContent = connection;
}

async function checkAIHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
    const data = await response.json();
    const available = data.ai_status === "available";
    setAIStatus(available ? "online" : "offline", available ? "Local AI ready" : "AI model unavailable", data.ai_status || "Unknown");
    $("aiProviderValue").textContent = "Ollama · local";
    $("aiModelValue").textContent = data.model || "Qwen 2.5 · 0.5B";
  } catch (error) {
    setAIStatus("offline", "AI connection needed", "Backend not reachable");
  }
}

function selectActivity(button) {
  document.querySelectorAll(".activity").forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  selectedActivity = button.dataset.activity;
}

document.querySelectorAll(".activity").forEach((button) => {
  button.addEventListener("click", () => selectActivity(button));
});

function parseMission(text) {
  const normalized = String(text || "").replace(/\r/g, "").trim();
  const sections = [];

  for (let index = 0; index < MISSION_SECTIONS.length; index += 1) {
    const section = MISSION_SECTIONS[index];
    const startPattern = new RegExp(`(?:^|\\n)\\s*${section.key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*:\\s*`, "i");
    const startMatch = startPattern.exec(normalized);
    if (!startMatch) continue;

    const start = startMatch.index + startMatch[0].length;
    let end = normalized.length;

    for (const nextSection of MISSION_SECTIONS.slice(index + 1)) {
      const nextPattern = new RegExp(`\\n\\s*${nextSection.key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*:`, "i");
      const nextMatch = nextPattern.exec(normalized.slice(start));
      if (nextMatch) {
        end = Math.min(end, start + nextMatch.index);
        break;
      }
    }

    const content = normalized.slice(start, end).trim().replace(/^["']|["']$/g, "");
    if (content) sections.push({ ...section, content });
  }

  if (!sections.length && normalized) {
    sections.push({ key: "YOUR OUTDOOR MISSION", icon: "🌿", content: normalized });
  }

  return sections.map((section) => `
    <article class="mission-section">
      <span class="mission-section-icon" aria-hidden="true">${section.icon}</span>
      <div>
        <div class="mission-section-title">${escapeHTML(section.key)}</div>
        <div class="mission-section-text">${escapeHTML(section.content).replace(/\n/g, "<br>")}</div>
      </div>
    </article>
  `).join("");
}

async function generateMission() {
  const button = $("generateBtn");
  const duration = Number($("duration").value);
  const goal = $("goal").value.trim() || "Feel refreshed and enjoy the outdoors";

  if (!Number.isInteger(duration) || duration < 5 || duration > 180) {
    $("goal").focus();
    return;
  }

  setButtonLoading(button, true);
  $("missionTitle").textContent = "Putting a little plan together…";
  $("missionMeta").textContent = "A moment while your local AI gets creative.";
  $("missionContent").innerHTML = `
    <div class="mission-section">
      <span class="mission-section-icon" aria-hidden="true">✳</span>
      <div><div class="mission-section-title">MAKING SPACE</div><div class="mission-section-text">Creating a simple plan around your activity and the time you have.</div></div>
    </div>`;
  $("outsideBtn").classList.add("hidden");
  $("result").classList.remove("hidden");
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const query = new URLSearchParams({
      activity: selectedActivity,
      duration: String(duration),
      goal
    });
    const response = await fetch(`${API_BASE}/generate?${query.toString()}`, {
      method: "POST",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(100000)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : `The mission request failed (${response.status}).`;
      throw new Error(detail);
    }
    if (typeof data.mission !== "string" || !data.mission.trim()) {
      throw new Error("The AI returned an empty plan. Please try again.");
    }

    currentMission = {
      activity: selectedActivity,
      duration,
      goal,
      mission: data.mission,
      provider: data.provider || "ollama",
      model: data.model || "qwen2.5:0.5b"
    };

    $("missionTitle").textContent = `${duration} minutes of ${selectedActivity.toLowerCase()}`;
    $("missionMeta").textContent = `${selectedActivity} · ${duration} minutes · ${goal}`;
    $("missionContent").innerHTML = parseMission(data.mission);
    $("outsideBtn").classList.remove("hidden");
    $("aiProviderValue").textContent = data.provider === "ollama" ? "Ollama · local" : (data.provider || "AI");
    $("aiModelValue").textContent = data.model || "Local model";
    setAIStatus("online", "Local AI ready", "Mission generated");
  } catch (error) {
    console.error("TouchGrass mission generation failed:", error);
    $("missionTitle").textContent = "Let's try that again.";
    $("missionMeta").textContent = "Your plan couldn't be generated just now.";
    $("missionContent").innerHTML = `
      <div class="mission-section">
        <span class="mission-section-icon" aria-hidden="true">↻</span>
        <div>
          <div class="mission-section-title">COULDN'T REACH YOUR AI</div>
          <div class="mission-section-text">${escapeHTML(error.message || "Check that the TouchGrass backend and Ollama are running, then try again.")}</div>
        </div>
      </div>`;
    $("outsideBtn").classList.add("hidden");
    setAIStatus("offline", "AI connection needed", "Generation failed");
  } finally {
    setButtonLoading(button, false);
  }
}

$("generateBtn").addEventListener("click", generateMission);
$("goal").addEventListener("keydown", (event) => {
  if (event.key === "Enter") generateMission();
});

function startOutsideMode() {
  if (!currentMission) return;
  clearInterval(outsideInterval);
  outsideSeconds = 0;
  outsideStartedAt = Date.now();

  $("missionContent").innerHTML = `
    <div class="outside-mode">
      <div class="outside-icon" aria-hidden="true">🌳</div>
      <div class="label">YOU'RE RIGHT WHERE YOU NEED TO BE</div>
      <h2>Now, be here.</h2>
      <p class="outside-message">Your plan is ready. Let the phone rest and give your attention to the world around you.</p>
      <div class="timer" id="outsideTimer" role="timer" aria-live="off">00:00</div>
      <div class="timer-label">TIME OUTSIDE</div>
      <button id="endMissionBtn" class="outside-btn" type="button">I'm back · Finish mission</button>
    </div>`;
  $("outsideBtn").classList.add("hidden");
  startOutsideTimer();
  $("endMissionBtn").addEventListener("click", endOutsideMode);
}

$("outsideBtn").addEventListener("click", startOutsideMode);

function updateOutsideTimer() {
  if (!outsideStartedAt) return;
  outsideSeconds = Math.max(0, Math.floor((Date.now() - outsideStartedAt) / 1000));
  const timer = $("outsideTimer");
  if (timer) timer.textContent = formatTime(outsideSeconds, true);
}

function startOutsideTimer() {
  updateOutsideTimer();
  outsideInterval = setInterval(updateOutsideTimer, 1000);
}

function endOutsideMode() {
  updateOutsideTimer();
  clearInterval(outsideInterval);
  outsideInterval = null;
  outsideStartedAt = null;
  ratings = { energy: 0, mood: 0, difficulty: 0 };

  $("missionContent").innerHTML = `
    <div class="reflection">
      <div class="outside-icon" aria-hidden="true">🌿</div>
      <div class="label">A MOMENT TO NOTICE</div>
      <h2>How did that feel?</h2>
      <p class="reflection-subtitle">You made ${escapeHTML(formatTime(outsideSeconds))} for yourself. Take a breath and check in.</p>

      <div class="rating-group">
        <label>HOW'S YOUR ENERGY?</label>
        <div class="rating" data-rating="energy" role="group" aria-label="Rate your energy from one to five">
          ${ratingButtons()}
        </div>
      </div>
      <div class="rating-group">
        <label>HOW'S YOUR MOOD?</label>
        <div class="rating" data-rating="mood" role="group" aria-label="Rate your mood from one to five">
          ${ratingButtons()}
        </div>
      </div>
      <div class="rating-group">
        <label>HOW CHALLENGING WAS IT?</label>
        <div class="rating" data-rating="difficulty" role="group" aria-label="Rate the difficulty from one to five">
          ${ratingButtons()}
        </div>
      </div>
      <div class="reflection-input">
        <label for="reflectionText">WHAT'S ONE THING YOU NOTICED?</label>
        <textarea id="reflectionText" maxlength="500" placeholder="The air felt different. I noticed a tiny flower by the path…" rows="3"></textarea>
      </div>
      <button id="saveExperienceBtn" class="outside-btn" type="button">Keep this moment <span aria-hidden="true">↗</span></button>
    </div>`;
  setupRatings();
  $("saveExperienceBtn").addEventListener("click", saveExperience);
}

function ratingButtons() {
  return [1, 2, 3, 4, 5].map((value) => `<button type="button" data-value="${value}" aria-label="${value} out of 5">★</button>`).join("");
}

function setupRatings() {
  document.querySelectorAll(".rating").forEach((group) => {
    const type = group.dataset.rating;
    group.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const value = Number(button.dataset.value);
        ratings[type] = value;
        group.querySelectorAll("button").forEach((item) => {
          const selected = Number(item.dataset.value) <= value;
          item.classList.toggle("selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
      });
    });
  });
}

function saveExperience() {
  if (!currentMission) return;
  const experience = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: new Date().toISOString(),
    activity: currentMission.activity,
    goal: currentMission.goal,
    duration: outsideSeconds,
    plannedDuration: currentMission.duration,
    provider: currentMission.provider,
    energy: ratings.energy,
    mood: ratings.mood,
    difficulty: ratings.difficulty,
    reflection: $("reflectionText").value.trim().slice(0, 500)
  };

  const history = readHistory();
  history.push(experience);
  if (!writeHistory(history)) {
    window.alert("This moment couldn't be saved. Check your browser's storage settings and try again.");
    return;
  }

  $("missionContent").innerHTML = `
    <div class="saved-state">
      <div class="saved-icon" aria-hidden="true">✓</div>
      <div class="label">MOMENT KEPT</div>
      <h2>That time was yours.</h2>
      <p>You spent ${escapeHTML(formatTime(outsideSeconds))} outside. That's worth remembering.</p>
      <div class="saved-actions">
        <button id="createAnotherBtn" class="outside-btn" type="button">Make another plan</button>
        <button id="viewJourneyBtn" class="secondary-btn" type="button">See my journey</button>
      </div>
    </div>`;
  $("createAnotherBtn").addEventListener("click", () => {
    currentMission = null;
    $("result").classList.add("hidden");
    $("outsideBtn").classList.remove("hidden");
    $("goal").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("viewJourneyBtn").addEventListener("click", showJourney);
  $("outsideBtn").classList.add("hidden");
}

function showJourney() {
  const history = readHistory();
  $("missionCount").textContent = history.length.toLocaleString();
  const totalSeconds = history.reduce((total, item) => {
    const seconds = Number(item.duration);
    return total + (Number.isFinite(seconds) && seconds > 0 ? seconds : 0);
  }, 0);
  $("totalTime").textContent = formatTotalTime(totalSeconds);
  renderHistory(history);
  $("journey").classList.remove("hidden");
  $("journey").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeJourney() {
  $("journey").classList.add("hidden");
}

$("journeyBtn").addEventListener("click", showJourney);
$("closeJourney").addEventListener("click", closeJourney);

function renderHistory(history) {
  const historyList = $("historyList");
  if (!history.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        <strong>Your first little adventure starts here.</strong>
        Finish a mission and your moments will find a home here.
      </div>`;
    return;
  }

  historyList.innerHTML = [...history].reverse().map((item) => {
    const date = new Date(item.date);
    const safeDate = Number.isNaN(date.getTime())
      ? "A day outside"
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const activity = escapeHTML(item.activity || "Outdoor time");
    const duration = Number(item.duration);
    const time = Number.isFinite(duration) && duration >= 0 ? formatTime(duration) : "Time well spent";
    const reflection = typeof item.reflection === "string" && item.reflection.trim()
      ? `<p class="history-reflection">“${escapeHTML(item.reflection)}”</p>`
      : "";
    const energy = safeRating(item.energy);
    const mood = safeRating(item.mood);

    return `
      <article class="history-card">
        <div class="history-icon" aria-hidden="true">${ACTIVITY_ICONS[item.activity] || "🌿"}</div>
        <div class="history-info">
          <h3>${activity}</h3>
          <p>${escapeHTML(time)} · ${escapeHTML(safeDate)}</p>
          <div class="history-ratings">Energy ${energy} <span aria-hidden="true">·</span> Mood ${mood}</div>
          ${reflection}
        </div>
      </article>`;
  }).join("");
}

function safeRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? "★".repeat(rating) : "—";
}

function formatTime(totalSeconds, clock = false) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (clock) return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  if (minutes === 0) return `${remainder} sec`;
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`;
}

function formatTotalTime(totalSeconds) {
  const totalMinutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function openAIInfo() {
  $("aiInfoModal").classList.remove("hidden");
  $("closeAiModal").focus();
}
function closeAIInfo() {
  $("aiInfoModal").classList.add("hidden");
  $("aiStatus").focus();
}
$("aiStatus").addEventListener("click", openAIInfo);
$("closeAiModal").addEventListener("click", closeAIInfo);
$("aiInfoModal").addEventListener("click", (event) => {
  if (event.target === $("aiInfoModal")) closeAIInfo();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("aiInfoModal").classList.contains("hidden")) closeAIInfo();
});

checkAIHealth();
