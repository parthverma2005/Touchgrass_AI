let selectedActivity = "Running";


// ------------------------------------
// ACTIVITY SELECTION
// ------------------------------------

const activities = document.querySelectorAll(".activity");

activities.forEach(button => {

    button.addEventListener("click", () => {

        activities.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedActivity =
            button.dataset.activity;

    });

});


// ------------------------------------
// GENERATE MISSION
// ------------------------------------

document
    .getElementById("generateBtn")
    .addEventListener("click", generateMission);


async function generateMission() {

    const duration =
        document.getElementById("duration").value;

    const goal =
        document.getElementById("goal").value ||
        "enjoy the outdoors";


    const result =
        document.getElementById("result");

    const missionTitle =
        document.getElementById("missionTitle");

    const missionContent =
        document.getElementById("missionContent");

    const generateButton =
        document.getElementById("generateBtn");


    // --------------------------------
    // LOADING STATE
    // --------------------------------

    generateButton.disabled = true;

    generateButton.innerHTML = `
        <span>CREATING YOUR MISSION...</span>
        <span>🌿</span>
    `;


    missionTitle.textContent =
        "Your local AI is thinking...";


    missionContent.innerHTML = `
        <div class="mission-step">

            <div class="step-number">🌿</div>

            <div>
                Creating a personalized
                outdoor mission...
            </div>

        </div>
    `;


    result.classList.remove("hidden");

    result.scrollIntoView({
        behavior: "smooth"
    });


    // --------------------------------
    // CALL FASTAPI
    // --------------------------------

    try {

        const url =
            `http://127.0.0.1:8000/generate` +
            `?activity=${encodeURIComponent(selectedActivity)}` +
            `&duration=${encodeURIComponent(duration)}` +
            `&goal=${encodeURIComponent(goal)}`;


        const response =
            await fetch(url, {
                method: "POST"
            });


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        // --------------------------------
        // DISPLAY AI RESPONSE
        // --------------------------------

        missionTitle.textContent =
            `${duration}-Minute ${selectedActivity}`;


       missionContent.innerHTML =
    formatMission(data.mission);


    } catch (error) {

        console.error(
            "TouchGrass AI Error:",
            error
        );


        missionTitle.textContent =
            "Something went wrong";


        missionContent.innerHTML = `

            <div class="mission-step">

                <div class="step-number">!</div>

                <div>

                    <strong>Couldn't connect to local AI.</strong>

                    <br><br>

                    Make sure:

                    <br>• Ollama is running
                    <br>• Qwen 0.5B is installed
                    <br>• FastAPI is running

                </div>

            </div>

        `;

    }


    // --------------------------------
    // RESTORE BUTTON
    // --------------------------------

    generateButton.disabled = false;

    generateButton.innerHTML = `
        <span>CREATE MY MISSION</span>
        <span>→</span>
    `;

}


// ------------------------------------
// FORMAT AI RESPONSE
// ------------------------------------

function formatMission(text) {

    // Remove markdown formatting
    text = text
        .replace(/###/g, "")
        .replace(/\*\*/g, "")
        .replace(/\\/g, "");


    const sections = [
        {
            key: "WARM-UP",
            icon: "🔥"
        },
        {
            key: "MAIN ACTIVITY",
            icon: "🏃"
        },
        {
            key: "OUTDOOR CHALLENGE",
            icon: "👀"
        },
        {
            key: "COOL-DOWN",
            icon: "🧘"
        },
        {
            key: "MOTIVATION",
            icon: "🌱"
        }
    ];


    let html = "";


    sections.forEach((section, index) => {

        const current =
            section.key + ":";

        const start =
            text.toUpperCase().indexOf(current);


        if (start === -1) {
            return;
        }


        let end =
            text.length;


        for (
            let i = index + 1;
            i < sections.length;
            i++
        ) {

            const next =
                sections[i].key + ":";

            const nextIndex =
                text.toUpperCase().indexOf(next);

            if (nextIndex !== -1) {
                end = nextIndex;
                break;
            }

        }


        let content =
            text
                .substring(
                    start + current.length,
                    end
                )
                .trim();


        // Remove accidental instruction text
        content =
            content
                .replace(
                    /Keep every line short\.?/gi,
                    ""
                )
                .replace(
                    /Do not.*$/gim,
                    ""
                )
                .trim();


        if (!content) {
            return;
        }


        html += `

            <div class="mission-section">

                <div class="mission-section-icon">
                    ${section.icon}
                </div>

                <div class="mission-section-content">

                    <div class="mission-section-title">
                        ${section.key}
                    </div>

                    <div class="mission-section-text">
                        ${content}
                    </div>

                </div>

            </div>

        `;

    });


    return html;

}
// ------------------------------------
// GO OUTSIDE MODE
// ------------------------------------

document
    .getElementById("outsideBtn")
    .addEventListener("click", startOutsideMode);


function startOutsideMode() {

    const result =
        document.getElementById("result");

    const missionContent =
        document.getElementById("missionContent");


    missionContent.innerHTML = `

        <div class="outside-mode">

            <div class="outside-icon">
                🌳
            </div>

            <p class="label">
                OUTSIDE MODE
            </p>

            <h2>
                Put your phone away.
            </h2>

            <p class="outside-message">
                Your mission is ready.
                The screen is no longer the point.
            </p>

            <div class="timer" id="outsideTimer">
                00:00
            </div>

            <p class="timer-label">
                TIME OUTSIDE
            </p>

            <button
                id="endMissionBtn"
                class="outside-btn"
            >
                FINISH MISSION
            </button>

        </div>

    `;


    startOutsideTimer();


    document
        .getElementById("endMissionBtn")
        .addEventListener(
            "click",
            endOutsideMode
        );


    result.scrollIntoView({
        behavior: "smooth"
    });

}
// ------------------------------------
// OUTSIDE TIMER
// ------------------------------------

let outsideSeconds = 0;

let outsideInterval = null;


function startOutsideTimer() {

    outsideSeconds = 0;


    const timer =
        document.getElementById("outsideTimer");


    outsideInterval =
        setInterval(() => {

            outsideSeconds++;


            const minutes =
                Math.floor(
                    outsideSeconds / 60
                );

            const seconds =
                outsideSeconds % 60;


            timer.textContent =
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        }, 1000);

}
// ------------------------------------
// END OUTSIDE MODE
// ------------------------------------

function endOutsideMode() {

    clearInterval(outsideInterval);

    const missionContent =
        document.getElementById("missionContent");

    missionContent.innerHTML = `

        <div class="reflection">

            <div class="outside-icon">
                🌿
            </div>

            <p class="label">
                MISSION COMPLETE
            </p>

            <h2>
                How was it?
            </h2>

            <p class="reflection-subtitle">
                You spent
                <strong>${formatTime(outsideSeconds)}</strong>
                outside.
            </p>


            <!-- ENERGY -->

            <div class="rating-group">

                <label>ENERGY</label>

                <div class="rating"
                     data-rating="energy">

                    <button data-value="1">★</button>
                    <button data-value="2">★</button>
                    <button data-value="3">★</button>
                    <button data-value="4">★</button>
                    <button data-value="5">★</button>

                </div>

            </div>


            <!-- MOOD -->

            <div class="rating-group">

                <label>MOOD</label>

                <div class="rating"
                     data-rating="mood">

                    <button data-value="1">★</button>
                    <button data-value="2">★</button>
                    <button data-value="3">★</button>
                    <button data-value="4">★</button>
                    <button data-value="5">★</button>

                </div>

            </div>


            <!-- DIFFICULTY -->

            <div class="rating-group">

                <label>DIFFICULTY</label>

                <div class="rating"
                     data-rating="difficulty">

                    <button data-value="1">★</button>
                    <button data-value="2">★</button>
                    <button data-value="3">★</button>
                    <button data-value="4">★</button>
                    <button data-value="5">★</button>

                </div>

            </div>


            <!-- REFLECTION -->

            <div class="reflection-input">

                <label>
                    WHAT DID YOU NOTICE OUTSIDE?
                </label>

                <textarea
                    id="reflectionText"
                    placeholder="A bird, a new path, the sunset..."
                    rows="4"
                ></textarea>

            </div>


            <button
                id="saveExperienceBtn"
                class="outside-btn"
            >
                SAVE EXPERIENCE 🌿
            </button>

        </div>

    `;


    setupRatings();


    document
        .getElementById("saveExperienceBtn")
        .addEventListener(
            "click",
            saveExperience
        );

}
let ratings = {
    energy: 0,
    mood: 0,
    difficulty: 0
};


function setupRatings() {

    const ratingGroups =
        document.querySelectorAll(".rating");


    ratingGroups.forEach(group => {

        const buttons =
            group.querySelectorAll("button");


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const ratingType =
                        group.dataset.rating;

                    const value =
                        Number(
                            button.dataset.value
                        );


                    ratings[ratingType] =
                        value;


                    buttons.forEach(btn => {

                        btn.classList.toggle(
                            "selected",
                            Number(
                                btn.dataset.value
                            ) <= value
                        );

                    });

                }
            );

        });

    });

}
function saveExperience() {

    const reflection =
        document
            .getElementById("reflectionText")
            .value
            .trim();


    const experience = {

        date: new Date().toISOString(),

        activity: selectedActivity,

        duration: outsideSeconds,

        energy: ratings.energy,

        mood: ratings.mood,

        difficulty: ratings.difficulty,

        reflection: reflection

    };


    // Get existing history

    const history =
        JSON.parse(
            localStorage.getItem(
                "touchgrass_history"
            )
        ) || [];


    // Add new experience

    history.push(experience);


    // Save locally

    localStorage.setItem(
        "touchgrass_history",
        JSON.stringify(history)
    );


    showSavedExperience();

}

// ------------------------------------
// JOURNEY / HISTORY
// ------------------------------------

document
    .getElementById("journeyBtn")
    .addEventListener(
        "click",
        showJourney
    );


document
    .getElementById("closeJourney")
    .addEventListener(
        "click",
        closeJourney
    );


function showJourney() {

    const journey =
        document.getElementById("journey");

    const history =
        JSON.parse(
            localStorage.getItem(
                "touchgrass_history"
            )
        ) || [];


    document
        .getElementById("missionCount")
        .textContent = history.length;


    const totalSeconds =
        history.reduce(
            (total, item) =>
                total + item.duration,
            0
        );


    document
        .getElementById("totalTime")
        .textContent =
            formatTotalTime(totalSeconds);


    renderHistory(history);


    journey.classList.remove("hidden");

    journey.scrollIntoView({
        behavior: "smooth"
    });

}


function closeJourney() {

    document
        .getElementById("journey")
        .classList.add("hidden");

}


function formatTotalTime(seconds) {

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );


    if (hours > 0) {

        return `${hours}h ${minutes}m`;

    }


    return `${minutes}m`;

}

function renderHistory(history) {

    const historyList =
        document.getElementById(
            "historyList"
        );


    if (history.length === 0) {

        historyList.innerHTML = `

            <div class="empty-history">

                🌱

                <h3>
                    No missions yet.
                </h3>

                <p>
                    Go outside and start
                    your first adventure.
                </p>

            </div>

        `;

        return;
    }


    const sorted =
        [...history].reverse();


    historyList.innerHTML =
        sorted.map(item => {

            const date =
                new Date(item.date);


            const formattedDate =
                date.toLocaleDateString(
                    undefined,
                    {
                        month: "short",
                        day: "numeric"
                    }
                );


            return `

                <div class="history-card">

                    <div class="history-icon">
                        ${getActivityIcon(
                            item.activity
                        )}
                    </div>

                    <div class="history-info">

                        <h3>
                            ${item.activity}
                        </h3>

                        <p>
                            ${formatTime(
                                item.duration
                            )}
                            · ${formattedDate}
                        </p>

                        <div class="history-ratings">

                            Energy
                            ${stars(item.energy)}

                            &nbsp;&nbsp;

                            Mood
                            ${stars(item.mood)}

                        </div>

                        ${
                            item.reflection
                            ? `
                            <p class="history-reflection">
                                "${item.reflection}"
                            </p>
                            `
                            : ""
                        }

                    </div>

                </div>

            `;

        }).join("");

}


function getActivityIcon(activity) {

    const icons = {

        Running: "🏃",

        Walking: "🚶",

        Hiking: "🥾",

        Cycling: "🚴"

    };


    return icons[activity] || "🌿";

}


function stars(value) {

    if (!value) {
        return "—";
    }


    return "★".repeat(value) +
           "☆".repeat(5 - value);

}

function formatTime(totalSeconds) {

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        totalSeconds % 60;


    if (minutes === 0) {
        return `${seconds} seconds`;
    }

    return `${minutes} min ${seconds} sec`;

}

// ------------------------------------
// LOCAL AI INFO
// ------------------------------------

const aiStatus =
    document.getElementById("aiStatus");

const aiInfoModal =
    document.getElementById("aiInfoModal");

const closeAiModal =
    document.getElementById("closeAiModal");


aiStatus.addEventListener(
    "click",
    () => {

        aiInfoModal.classList.remove(
            "hidden"
        );

    }
);


closeAiModal.addEventListener(
    "click",
    () => {

        aiInfoModal.classList.add(
            "hidden"
        );

    }
);


aiInfoModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === aiInfoModal
        ) {

            aiInfoModal.classList.add(
                "hidden"
            );

        }

    }
);