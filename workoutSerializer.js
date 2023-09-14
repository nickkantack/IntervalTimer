
/*
serializedString is JSON in the following format:
[
    ["string - name", "string - allocatedTime"],
    ...
]
*/
function convertCurrentWorkoutToArray() {
    const objectToSerialize = [];
    for (let setDiv of setList.querySelectorAll(".setDiv")) {
        objectToSerialize.push([
            setDiv.querySelector(".setName").value,
            setDiv.querySelector(".allocatedTime").value
        ]);
    }
    return objectToSerialize;
}

function applyWorkoutAsArrayToApp(workoutTitle, workoutAsArray) {
    clearCurrentWorkout();
    workoutTitle.value = workoutTitle;
    workoutTitleUneditable.innerHTML = workoutTitle;
    for (let list of workoutAsArray) {
        const setDiv = addSetToList();
        setDiv.querySelector(".setName").value = list[0];
        setDiv.querySelector(".timeLeft").value = list[1];
        setDiv.querySelector(".allocatedTime").value = list[1];
    }
    // TODO do we need to update the dropdowns now? I think not.
}

function clearCurrentWorkout() {
    workoutTitle.value = "Untitled workout";
    workoutTitleUneditable.innerHTML = "Untitled workout";
    for (let oldSet of setList.querySelectorAll(".setDiv")) setList.removeChild(oldSet);
}