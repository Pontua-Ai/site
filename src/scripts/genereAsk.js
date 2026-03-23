import supabaseClient from "./supabase.js";

export async function carregarMaterias() {
    const { data, error } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia");
    if (error) {
        console.error("Erro:", error);
        return;
    }
    const select = document.getElementById("materia");
    data.forEach(materia => {
        const option = document.createElement("option");
        option.value = materia.id_materia;
        option.textContent = materia.nome_materia;
        select.appendChild(option);
    });
}
if(document.getElementById("materia")){
    carregarMaterias();
}

if(document.getElementById("materia")){
    document.getElementById("materia").addEventListener("change", carregarConteudos)
}

export async function carregarConteudos() {
    const idMateria = document.getElementById("materia").value;
    if (!idMateria) return;

    const { data, error } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria)
    if (error) {
        console.error("Erro:", error);
        return;
    }
    const select = document.getElementById("conteudo");
    select.innerHTML = '<option value="">Selecione o conteúdo</option>';
    data.forEach(conteudo => {
        const option = document.createElement("option");
        option.value = conteudo.id_conteudo;
        option.textContent = conteudo.nome_conteudo;
        select.appendChild(option);
    });
}