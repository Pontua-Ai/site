import { carregarMaterias, carregarConteudos } from "./genereAsk.js";

carregarMaterias();
document.getElementById("materia").addEventListener("change", carregarConteudos);

const btnVisibilidade = document.getElementById("btnVisibilidade");
const visibilidadeInput = document.getElementById("visibilidade");

btnVisibilidade.addEventListener("click", () => {
    if (visibilidadeInput.value === "publico") {
        visibilidadeInput.value = "privado";
        btnVisibilidade.textContent = "Privado";
        btnVisibilidade.classList.remove("publico");
        btnVisibilidade.classList.add("privado");
    } else {
        visibilidadeInput.value = "publico";
        btnVisibilidade.textContent = "Público";
        btnVisibilidade.classList.remove("privado");
        btnVisibilidade.classList.add("publico");
    }
});
