(function() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
        document.body.classList.add("dark");
    } else if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.classList.add("dark");
    }
    window.toggleTheme = function() {
        document.body.classList.toggle("dark");
        const dark = document.body.classList.contains("dark");
        localStorage.setItem("theme", dark ? "dark" : "light");
        const icon = document.querySelector(".theme-icon");
        if (icon) {
            if (dark) {
                icon.className = "material-icons theme-icon";
                icon.textContent = "light_mode";
            } else {
                icon.className = "fa-solid fa-moon theme-icon";
                icon.textContent = "";
            }
        }
    };
})();
