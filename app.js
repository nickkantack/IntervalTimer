
const DO_IGNORE_LAST = true;
const workoutKey = "IntervalTimer.workouts";
let workoutsDataObject = window.localStorage.getItem(workoutKey) ? window.localStorage.getItem(workoutKey) : "{}";
workoutsDataObject = JSON.parse(workoutsDataObject);
/*
The data stored under the key above should be in the format
{
    workouts: {
        "workoutA": [
                ["string - setName", "string - allocatedTime"]
        ]
    ]
}
*/

const addSetButton = document.getElementById("addSet");
const stopButton = document.getElementById("stop");
const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const workoutTitle = document.getElementById("workoutTitle");
const workoutTitleLabel = document.getElementById("workoutTitleLabel");
const workoutSelect = document.getElementById("workoutSelect");
const loadButton = document.getElementById("loadWorkout");
const saveButton = document.getElementById("saveWorkout");
const loadWorkoutCancel = document.getElementById("loadWorkoutCancel");
const workoutLoadPage = document.getElementById("workoutLoadPage");
const workoutPlayer = document.getElementById("workoutPlayer");
const openWorkoutPlayer = document.getElementById("openWorkoutPlayer");
const workoutPlayerBack = document.getElementById("workoutPlayerBack");
const workoutPlayerPause = document.getElementById("workoutPlayerPause");
const workoutPlayerPlay = document.getElementById("workoutPlayerPlay");
const workoutPlayerNext = document.getElementById("workoutPlayerNext");
const previousSetName = document.getElementById("previousSetName");
const currentSetName = document.getElementById("currentSetName");
const currentSetTimeLeft = document.getElementById("currentSetTimeLeft");
const nextSetName = document.getElementById("nextSetName");
const backToEditor = document.getElementById("backToEditor");

const setList = document.getElementById("setList");
const workoutEditor = document.getElementById("workoutEditor");
const setTemplate = document.getElementById("setTemplate");

// Dialogs
const noWorkoutsToLoadDialog = document.getElementById("noWorkoutsToLoadDialog");

let indexOfCurrentSet = 0;
let timerUpdateInterval;
let isPlaying = false;
let isPaused = false;

window.addEventListener("beforeinstallprompt", () => {
    alert("beforeinstallprompt received");
});

openWorkoutPlayer.addEventListener("click", () => {
    if (setList.children.length === 1) {
        showToast("Can't open the player on an empty workout.", TOAST_TYPE_FAILURE);
        return;
    }
    workoutPlayer.style.display = "block";
    playButton.click();
});
backToEditor.addEventListener("click", () => {
    workoutPlayer.style.display = "none";
});

workoutTitleLabel.addEventListener("click", () => {
    workoutTitle.style.display = "inline";
    workoutTitle.focus();
    workoutTitleLabel.style.display = "none";
});
workoutTitle.addEventListener("focusout", () => {
    workoutTitle.style.display = "none";
    workoutTitleLabel.style.display = "inline";
    workoutTitleLabel.innerHTML = workoutTitle.value;
});

workoutPlayerBack.addEventListener("click", () => {
    if (indexOfCurrentSet > 0) {
        const previousSetDiv = setList.children[indexOfCurrentSet - 1];
        const previousSetTimeLeft = previousSetDiv.querySelector(".timeLeft");
        if (previousSetTimeLeft.value === "0:00") previousSetTimeLeft.value = previousSetDiv.querySelector(".allocatedTime").value;
        indexOfCurrentSet--;
        updatePlayer();
    } else {
        showToast("There is no earlier set to go back to.", TOAST_TYPE_FAILURE);
    }
});

workoutPlayerNext.addEventListener("click", () => {
    if (indexOfCurrentSet < setList.children.length - 2) {
        indexOfCurrentSet++;
        updatePlayer();
    } else {
        showToast("There is no later set to advance to.", TOAST_TYPE_FAILURE);
    }
});

loadButton.addEventListener("click", () => {
    // Create a select for each workout found from storage
    if (Object.keys(workoutsDataObject).length === 0) {
        showToast("Cannot load a workout because there are no workouts saved on this device.", TOAST_TYPE_FAILURE);
        return;
    }

    for (let oldOption of workoutSelect.querySelectorAll("option")) workoutSelect.remove(oldOption);
    appendOptionToSelect("None selected", workoutSelect);
    for (let workoutTitle of Object.keys(workoutsDataObject)) {
        appendOptionToSelect(workoutTitle, workoutSelect);
    }

    workoutLoadPage.style.display = "block";
    workoutEditor.style.display = "none";
    workoutSelect.focus();
});
workoutSelect.addEventListener("change", () => {
    workoutLoadPage.style.display = "none";
    workoutEditor.style.display = "block";
    applyWorkoutAsArrayToApp(workoutSelect.value, workoutsDataObject[workoutSelect.value]);
});

saveButton.addEventListener("click", () => {
    if (setList.children.length === 1) {
        showToast("You cannot save a workout that has no sets in it.", TOAST_TYPE_FAILURE);
        return;
    }
    // TODO is there a concern with saving while the workoutSelect is showing?
    workoutsDataObject[workoutTitleLabel.innerHTML] = convertCurrentWorkoutToArray();
    window.localStorage.setItem(workoutKey, JSON.stringify(workoutsDataObject));
    showToast("Successfully saved!", TOAST_TYPE_SUCCESS);
});

addSetButton.addEventListener("click", () => {
    addSetToList();
});

// Pressing the stop button sets all of the timeLeft inputs equal to their allocatedTime counterpart
stopButton.addEventListener("click", () => {
    for (let setDiv of setList.children) {
        if (!setDiv.querySelector(".setName")) continue;
        const timeLeft = setDiv.getElementsByClassName("timeLeft")[0];
        const allocatedTime = setDiv.getElementsByClassName("allocatedTime")[0];
        setDiv.querySelector(".setName").classList.remove("currentSetPlaying");
        setDiv.querySelector(".setName").classList.remove("currentSetPaused");
        if (timeLeft && allocatedTime) timeLeft.value = allocatedTime.value;
    }
    indexOfCurrentSet = 0;
    clearInterval(timerUpdateInterval);
    isPlaying = false;
    isPaused = false;
});

loadWorkoutCancel.addEventListener("click", () => {
    workoutLoadPage.style.display = "none";
    workoutEditor.style.display = "block";
});

// Pausing merely stops the timer and changes the UI to indicate currently paused
[pauseButton, workoutPlayerPause].forEach((button) => {
    button.addEventListener("click", () => {
        isPlaying = false;
        isPaused = true;
        clearInterval(timerUpdateInterval);
        setList.children[indexOfCurrentSet].querySelector(".setName").classList.remove("currentSetPlaying");
        setList.children[indexOfCurrentSet].querySelector(".setName").classList.add("currentSetPaused");
    });
});

// Pressing the play button starts the timer
[playButton, workoutPlayerPlay].forEach((button) => {
    button.addEventListener("click", () => {
        if (isPlaying) return;
        isPlaying = true; 
        setList.children[indexOfCurrentSet].querySelector(".setName").classList.add("currentSetPlaying");
        setList.children[indexOfCurrentSet].querySelector(".setName").classList.remove("currentSetPaused");
        updatePlayer();
        timerUpdateInterval = setInterval(() => {
            // For now, just decrement the current time
            let currentTimeLeft = setList.children[indexOfCurrentSet].querySelector("input.timeLeft");
            let secondsLeft = timeStringToSeconds(currentTimeLeft.value);
            if (secondsLeft > 0) {
                currentTimeLeft.value = secondsToTimeString(secondsLeft - 1);
                updatePlayer();
            } else {
                // Handle running out of time
                setList.children[indexOfCurrentSet].querySelector(".setName").classList.remove("currentSetPlaying");
                setList.children[indexOfCurrentSet].querySelector(".setName").classList.remove("currentSetPaused");
                if (indexOfCurrentSet === setList.children.length - 2) {
                    // Handle ending the workout
                    stopButton.click();
                    updatePlayer();
                } else {
                    // Move to the next workout
                    indexOfCurrentSet++;
                    // TODO play tones, update the UI, etc.
                    setList.children[indexOfCurrentSet].querySelector(".setName").classList.add("currentSetPlaying");
                }
            }
        }, 1000);
    });
});

function updatePlayer() {
    const currentSetDiv = setList.children[indexOfCurrentSet];
    currentSetTimeLeft.innerHTML = currentSetDiv.querySelector(".timeLeft").value;
    currentSetName.innerHTML = currentSetDiv.querySelector(".setName").value;
    previousSetName.innerHTML = indexOfCurrentSet === 0 ? "" : setList.children[indexOfCurrentSet - 1].querySelector(".setName").value;
    nextSetName.innerHTML = indexOfCurrentSet === setList.children.length - 2 ? "" : setList.children[indexOfCurrentSet + 1].querySelector(".setName").value;
}

// TODO add the defocus listener that adds :00 to the time entry if there is no colon (and general validation)

function addSetToList(setToAddBefore) {
    const setDiv = setTemplate.content.cloneNode(true).querySelector(".setDiv");
    setList.insertBefore(setDiv, setToAddBefore ? setToAddBefore : setList.lastElementChild);
    // Set listeners
    const setName = setDiv.querySelector(".setName")
    setName.addEventListener("focusout", updateDropdowns);
    const allocatedTime = setDiv.querySelector(".allocatedTime")
    allocatedTime.addEventListener("focusout", updateDropdowns);
    updateSingleDropdown(setDiv.querySelector(".setSelect"), false, DO_IGNORE_LAST);
    const select = setDiv.querySelector(".setSelect");
    // Make the select hide itself after being chosen
    const editSet = setDiv.querySelector(".editSet");
    editSet.addEventListener("click", () => {
        select.style.display = "inline";
        select.focus();
        editSet.style.display = "none";
    });
    ["change", "focusout"].forEach((event) => {
        select.addEventListener(event, () => {
            select.style.display = "none";
            editSet.style.display = "inline";
            if (!select.value) return;
            setName.value = select.value.match(/(.*)\s-\s[0-9]+:[0-9]+/)[1];
            if (setName === "[blank]") setName = "";
            allocatedTime.value = select.value.match(/.*\s-\s([0-9]+:[0-9]+)/)[1];
            updateDropdowns();
        });
    });
    const deleteButton = setDiv.querySelector("button.deleteButton");
    deleteButton.addEventListener("click", () => {
        setList.removeChild(setDiv);
    });
    const insertAbove = setDiv.querySelector("button.insertAbove");
    insertAbove.addEventListener("click", () => {
        addSetToList(setDiv);
    });
    return setDiv;
}

function timeStringToSeconds(timeString) {
    let parts = timeString.split(":");
    return 60 * parseInt(parts[0]) + parseInt(parts[1]);
}

function secondsToTimeString(seconds) {
    if (seconds < 0) return "0:00";
    let minutes = Math.floor(seconds / 60);
    let remainder = seconds - minutes * 60;
    return `${minutes}:${remainder < 10 ? "0" : ""}${remainder}`;
}

function updateDropdowns() {
    const knownSets = getKnownSets();
    for (let select of setList.querySelectorAll(".setSelect")) {
        updateSingleDropdown(select, knownSets);
    }
}

function getKnownSets(shouldIgnoreLast) {
    const knownSets = new Set();
    knownSets.add("");
    const delimiter = " - ";
    const setDivs = setList.querySelectorAll(".setDiv");
    for (let i = 0; i < (shouldIgnoreLast ? setDivs.length - 1 : setDivs.length); i++) {
        const setDiv = setDivs[i];
        let nameInput = setDiv.querySelector(".setName");
        let allocatedTimeInput = setDiv.querySelector(".allocatedTime");
        if (!nameInput) {
            console.error("Failed to find set name");
            continue;
        }
        if (!allocatedTimeInput) {
            console.error("Failed to find allocated time input");
            continue;
        }
        const name = nameInput.value === "" ? "[blank]" : nameInput.value;
        let key = `${name}${delimiter}${allocatedTimeInput.value}`;
        knownSets.add(key);
    }
    return knownSets;
}

function updateSingleDropdown(select, knownSets, shouldIgnoreLast) {
    if (!knownSets) knownSets = getKnownSets(shouldIgnoreLast);
    for (let i = select.children.length - 1; i >= 0; i--) select.remove(i);
    for (let knownSet of knownSets) appendOptionToSelect(knownSet, select);
}

function appendOptionToSelect(optionName, select) {
    const opt = document.createElement("option");
    opt.value = optionName;
    opt.innerHTML = optionName;
    select.appendChild(opt);
}

function updatePlayAndPauseColors() {
    // TODO unpaint all setName inputs then paint only the current one
    for (let setName of setList.querySelector(".setName")) {
        setName.classList.remove("currentSetPlaying");
        setName.classList.remove("currentSetPaused");
    }
    const currentSetName = setList.children[indexOfCurrentSet].querySelector(".setName");
    if (isPlaying) currentSetName.classList.add("currentSetPlaying");
    if (isPaused) currentSetName.classList.add("currentSetPaused");
}