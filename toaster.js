
const toast = document.getElementById("toast");
const TOAST_TYPE_SUCCESS = "success";
const TOAST_TYPE_INFORMATION = "information";
const TOAST_TYPE_FAILURE = "failure";
const KNOWN_TOAST_TYPES = [TOAST_TYPE_SUCCESS, TOAST_TYPE_INFORMATION, TOAST_TYPE_FAILURE];
const SHOW_DURATION_MS = 4000;
let isToastShowing = false;
let toastHideTimeout;

function showToast(message, toastType, displayTimeOverride) {
    toast.innerHTML = message;

    // Premeptively remove all classes except for the toast class
    for (let clazz of toast.classList) {
        if (clazz !== "toast") toast.classList.remove(clazz);
    }
    if (KNOWN_TOAST_TYPES.includes(toastType)) {
        toast.classList.add(`${toastType}Toast`);
    }

    toast.style.left = "50%";
    if (isToastShowing) clearTimeout(toastHideTimeout);
    isToastShowing = true;
    toastHideTimeout = setTimeout(() => {
        toast.style.left = "-100%";
        toast.classList.remove(`${toastType}Toast`);
        isToastshowing = false;
    }, displayTimeOverride ? displayTimeOverride : SHOW_DURATION_MS);
}