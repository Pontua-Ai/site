export function toast(message, type = "default") {
    const existingToast = document.querySelector(".toast");
    if (existingToast) existingToast.remove();

    const toastEl = document.createElement("div");
    toastEl.className = `toast ${type}`;
    toastEl.textContent = message;
    document.body.appendChild(toastEl);

    setTimeout(() => {
        toastEl.remove();
    }, 3000);
}