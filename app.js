
const DO_IGNORE_LAST = true;
const workoutKey = "IntervalTimer.workouts";
/*
The data stored under the key above should be in the format
{
    workouts: [
        {
            title: "string",
            sets: [
                ["string - setName", "string - allocatedTime"]
            ]
        }
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

const setList = document.getElementById("setList");
const setTemplate = document.getElementById("setTemplate");

let indexOfCurrentSet = 0;
let timerUpdateInterval;
let isPlaying = false;

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

loadButton.addEventListener("click", () => {
    // Should read in all workouts from local storage if they are not cached, and probably should cache
    // them and only update the cache when a save operation occurs
    const workoutsJson = window.localStorage.getItem(workoutKey);
    if (!workoutsJson) {
        console.error("Loaded null workout key. Should warn the user. For now, just using empty list");
    }
    const deserializedObject = workoutsJson ? JSON.parse(workoutsJson) : { workouts: [] };
    // Create a select for each workout found from storage


    // TODO if there are no workouts, show a dialog and then return rather than showing the select.

    workoutSelect.style.display = "inline";
    loadButton.style.display = "none";
    workoutSelect.focus();
});
workoutSelect.addEventListener("change", () => {
    workoutSelect.style.display = "none";
    loadButton.style.display = "inline";
});

saveButton.addEventListener("click", () => {
    // TODO is there a concern with saving while the workoutSelect is showing?
    window.localStorage.setItem(workoutKey, serializedCurrentWorkout());
});

addSetButton.addEventListener("click", () => {
    const setDiv = setTemplate.content.cloneNode(true).querySelector(".setDiv");
    setList.insertBefore(setDiv, setList.lastElementChild);
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
});

// Pressing the stop button sets all of the timeLeft inputs equal to their allocatedTime counterpart
stopButton.addEventListener("click", () => {
    for (let setDiv of setList.children) {
        const timeLeft = setDiv.getElementsByClassName("timeLeft")[0];
        const allocatedTime = setDiv.getElementsByClassName("allocatedTime")[0];
        if (timeLeft && allocatedTime) timeLeft.value = allocatedTime.value;
    }
    indexOfCurrentSet = 0;
    clearInterval(timerUpdateInterval);
    isPlaying = false;
});

// Pausing merely stops the timer and changes the UI to indicate currently paused

// Pressing the play button starts the timer
playButton.addEventListener("click", () => {
    if (isPlaying) return;
    isPlaying = true; 
    timerUpdateInterval = setInterval(() => {
        // For now, just decrement the current time
        let currentTimeLeft = setList.children[indexOfCurrentSet].querySelector("input.timeLeft");
        let secondsLeft = timeStringToSeconds(currentTimeLeft.value);
        if (secondsLeft > 1) {
            currentTimeLeft.value = secondsToTimeString(secondsLeft - 1);
        } else {
            // Handle running out of time
            if (indexOfCurrentSet === setList.children.length - 1) {
                // Handle ending the workout
                clearInterval(timerUpdateInterval);
                isPlaying = false;
            } else {
                // Move to the next workout
                indexOfCurrentSet++;
                // TODO play tones, update the UI, etc.
            }
        }
    }, 1000);
});

// TODO add the defocus listener that adds :00 to the time entry if there is no colon (and general validation)

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
    console.log(setDivs);
    for (let i = 0; i < (shouldIgnoreLast ? setDivs.length - 1 : setDivs.length); i++) {
        console.log(i);
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
