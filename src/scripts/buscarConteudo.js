import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const nome_materia = decodeURIComponent(params.get("nome_conteudo"));

function irParaConteudos(nome_materia) {
    window.location.href = `conteudo.html?nome_conteudo=${nome_materia}`;
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.id_usuario || null;
}

export async function carregarConteudo() {
    const titleElement = document.getElementById("titleMateria");
    if (!titleElement) return;

    const container = document.getElementById("conteudos");
    container.innerHTML = '<div class="loading-container"><span class="loading-spinner"></span> Carregando...</div>';

    const userId = getUserId();

    const { data: materias } = await supabaseClient
        .from("materia")
        .select("id_materia")
        .ilike("nome_materia", nome_materia);
    const materia = materias?.[0] || null;

    let data, error;

    if (!nome_materia || !materia) {
        document.getElementById("titleMateria").innerText = "Todos os Conteúdos";
        
        const { data: todasMaterias } = await supabaseClient
            .from("materia")
            .select("id_materia");
        
        const idsMaterias = todasMaterias.map(m => m.id_materia);
        
        if (idsMaterias.length === 0) {
            container.innerHTML = "<p>Nenhum conteúdo encontrado</p>";
            return;
        }

        const result = await supabaseClient
            .from("conteudo")
            .select("*")
            .in("id_materia", idsMaterias);
        
        data = result.data;
        error = result.error;
    } else {
        document.getElementById("titleMateria").innerText = nome_materia;
        
        const result = await supabaseClient
            .from("conteudo")
            .select("*")
            .eq("id_materia", materia.id_materia);
        
        data = result.data;
        error = result.error;
    }

    if (error) {
        toast("Erro ao buscar: " + error.message, "error");
        return;
    }

    let conteudosOcultos = new Set();
    if (userId && data && data.length > 0) {
        const { data: ocultos } = await supabaseClient
            .from("conteudo_oculto")
            .select("id_conteudo")
            .eq("id_usuario", userId);
        if (ocultos) {
            conteudosOcultos = new Set(ocultos.map(o => o.id_conteudo));
        }
    }

    const filtrados = data.filter(c => !conteudosOcultos.has(c.id_conteudo));

    if (filtrados.length === 0) {
        container.innerHTML = "<p>Nenhum conteúdo encontrado</p>";
        return;
    }

    container.innerHTML = "";

    filtrados.forEach(conteudo => {
        const div = document.createElement("div");
        div.className = "conteudo-item";
        div.dataset.nome = conteudo.nome_conteudo.toLowerCase();
        div.onclick = () => window.location.href = `perguntas.html?conteudo=${conteudo.id_conteudo}`;
        div.innerHTML = `
            <h3>${conteudo.nome_conteudo}</h3>
            <button class="subjects-button">Acessar</button>
        `;
        container.appendChild(div);
    });

    const searchInput = document.getElementById("searchInput");
    const searchClear = document.getElementById("searchClear");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase();
            const items = document.querySelectorAll(".conteudo-item");
            items.forEach(item => {
                if (item.dataset.nome.includes(termo)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
            if (e.target.value.length > 0) {
                searchClear.classList.add("visible");
            } else {
                searchClear.classList.remove("visible");
            }
        });
    }
    if (searchClear) {
        searchClear.addEventListener("click", () => {
            searchInput.value = "";
            searchClear.classList.remove("visible");
            const items = document.querySelectorAll(".conteudo-item");
            items.forEach(item => {
                item.style.display = "block";
            });
        });
    }
}

carregarConteudo();
