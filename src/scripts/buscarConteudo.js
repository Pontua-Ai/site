import supabaseClient from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const nome_conteudo = params.get("nome_conteudo");

function irParaConteudo(tipo){
    window.location.href = `conteudo.html?tipo=${tipo}`;
}

export async function carregarConteudo() {
    const { data, error } = await supabaseClient
    .from("conteudo")
    .select("*")
    .eq("nome_conteudo", nome_conteudo)

    if(error){
        alert("Deu pau"+error);
        return;
    }

    const container=document.getElementById("conteudos");

    data.forEach(conteudo => {
        const div = document.createElement("div");
        div.innerHTML= `<h3>${conteudo.nome_conteudo}</h3>`;
        container.appendChild(div);
    });
}

carregarConteudo();
