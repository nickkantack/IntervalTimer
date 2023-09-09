
for (let dialog of document.body.querySelectorAll(".justOkDialog")) {
    const justOkButton = document.createElement("button");
    justOkButton.innerHTML = "OK";
    justOkButton.classList.add("justOkButton");
    justOkButton.addEventListener("click", () => {
        dialog.style.display = "none";
    });
    dialog.appendChild(justOkButton);
}
