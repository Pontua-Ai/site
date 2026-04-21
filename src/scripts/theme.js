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
    const checkbox = document.getElementById("theme-checkbox");
    const isDark = document.body.classList.contains("dark");
    
    if (checkbox) {
        checkbox.checked = isDark;
    }
    
    const cards = document.querySelectorAll(".cardConfi");
    for (const card of cards) {
        const text = card.querySelector("p");
        const icon = card.querySelector("i");
        
        if (text && text.textContent.includes("modo")) {
            text.textContent = isDark ? "Mudar para modo claro" : "Mudar para modo escuro";
            
            if (icon) {
                icon.className = isDark ? "material-icons" : "fa-solid fa-moon";
                icon.textContent = isDark ? "light_mode" : "";
            }
            break;
        }
    }
}