
/*
serializedString is JSON in the following format:
{
    title: "string",
    sets: [
        ["string - name", "string - allocatedTime"],
        ...
    ]
}
*/
function serializeCurrentWorkout() {
    const objectToSerialize = {};
    objectToSerialize.title = workoutTitleLabel.innerHTML;
    objectToSerialize.sets = [];
    for (let setDiv of setList.querySelectorAll(".setDiv")) {
        objectToSerialize.sets.push([
            setDiv.querySelector(".setName").value,
            setDiv.querySelector(".allocatedTime").value
        ]);
    }
    return JSON.stringify(objectToSerialize);
}

function applySerializedWorkoutToApp(serializedString) {
    const deserializedObject = JSON.parse(serializedString);
    workoutTitleLabel.innerHTML = deserializedObject.title;
    for (let oldSet of setList.querySelectorAll(".setDiv")) setList.remove(oldSet);
    for (let list of deserializedObject.sets) {
        const setDiv = setTemplate.content.cloneNode(true).querySelector(".setDiv");
        setList.insertBefore(setDiv, setList.lastElementChild);
        setDiv.querySelector(".setName").value = list[0];
        setDiv.querySelector(".timeLeft").value = list[1];
        setDiv.querySelector(".allocatedTime").value = list[1];
    }
    // TODO do we need to update the dropdowns now? I think not.
}