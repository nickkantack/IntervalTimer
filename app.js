
const addSetButton = document.getElementById("addSet");
const stopButton = document.getElementById("stop");
const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");

const setList = document.getElementById("setList");
const setTemplate = document.getElementById("setTemplate");

let indexOfCurrentSet = 0;
let timerUpdateInterval;
let isPlaying = false;

addSetButton.addEventListener("click", () => {
    const setDiv = setTemplate.content.cloneNode(true);
    setList.insertBefore(setDiv, setList.children.length > 1 ? setList.children[setList.children.length - 2] : setList.firstChild);
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