import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const nome_materia = decodeURIComponent(params.get("nome_conteudo"));

function irParaConteudos(nome_materia) {
    window.location.href = `conteudo.html?nome_conteudo=${nome_materia}`;
}

export async function carregarConteudo() {
    const titleElement = document.getElementById("titleMateria");
    if (!titleElement) return;

    const { data: materia } = await supabaseClient
        .from("materia")
        .select("id_materia")
        .ilike("nome_materia", nome_materia)
        .single();

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

    const container = document.getElementById("conteudos");

    if (data.length === 0) {
        container.innerHTML = "<p>Nenhum conteúdo encontrado</p>";
        return;
    }

    data.forEach(conteudo => {
        const div = document.createElement("div");
        div.className = "conteudo-item";
        div.dataset.nome = conteudo.nome_conteudo.toLowerCase();
        div.innerHTML = `<button class="subjects-button" onclick="window.location.href='perguntas.html?conteudo=${conteudo.id_conteudo}'">${conteudo.nome_conteudo}</button>`;
        container.appendChild(div);
    });

    const searchInput = document.getElementById("searchInput");
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
        });
    }
}

carregarConteudo();
