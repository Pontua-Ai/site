import supabaseClient from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const nome_materia = decodeURIComponent(params.get("nome_conteudo"));

function irParaConteudos(nome_materia) {
    window.location.href = `conteudo.html?nome_conteudo=${nome_materia}`;
}

export async function carregarConteudo() {
    const titleElement = document.getElementById("titleMateria");
    if (!titleElement) return;

    if (!nome_materia) {
        alert("Matéria não especificada");
        return;
    }

    const { data: materia } = await supabaseClient
        .from("materia")
        .select("id_materia")
        .ilike("nome_materia", nome_materia)
        .single();

    if (!materia) {
        document.getElementById("titleMateria").innerHTML = "Matéria não encontrada";
        return;
    } else {
        document.getElementById("titleMateria").innerText = nome_materia;
    }

    const { data, error } = await supabaseClient
        .from("conteudo")
        .select("*")
        .eq("id_materia", materia.id_materia);

    if (error) {
        alert("Erro ao buscar: " + error.message);
        return;
    }

    const container = document.getElementById("conteudos");

    if (data.length === 0) {
        container.innerHTML = "<p>Nenhum conteúdo encontrado</p>";
        return;
    }

    data.forEach(conteudo => {
        const div = document.createElement("div");
        div.innerHTML = `<button class="subjects-button" onclick="window.location.href='perguntas.html?conteudo=${conteudo.id_conteudo}'">${conteudo.nome_conteudo}</button>`;
        container.appendChild(div);
    });
}

carregarConteudo();
