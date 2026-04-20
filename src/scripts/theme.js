export function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
    updateThemeLabel();
}

export function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeLabel();
}

function updateThemeLabel() {
    const cardTheme = document.getElementById("btn-theme");
    const checkbox = document.getElementById("theme-checkbox");
    const isDark = document.body.classList.contains("dark");
    
    if (checkbox) {
        checkbox.checked = isDark;
    }
    
    if (!cardTheme) return;
    
    const icon = cardTheme.querySelector("i");
    const text = cardTheme.querySelector("p");
    
    if (text && (text.textContent.includes("Modo escuro") || text.textContent.includes("Modo claro"))) {
        text.textContent = isDark ? "Mudar para modo claro" : "Mudar para modo escuro";
    }
    
    if (isDark) {
        if (icon) {
            icon.className = "material-icons";
            icon.textContent = "light_mode";
        }
    } else {
        if (icon) {
            icon.className = "fa-solid fa-moon";
            icon.textContent = "";
        }
    }
}