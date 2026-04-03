import supabaseClient from "./supabase.js";

let todosUsuarios = [];

async function carregarUsuarios() {
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .order("username", { ascending: true });

    if (error) {
        alert("Erro ao carregar usuários: " + error.message);
        return;
    }

    todosUsuarios = data;
    filtrarUsuarios();
}

function filtrarUsuarios() {
    const busca = document.getElementById("buscaUsuario").value.toLowerCase();
    const tipo = document.getElementById("filtroTipo").value;

    const filtrados = todosUsuarios.filter(u => {
        const matchBusca = u.username.toLowerCase().includes(busca) || 
                          u.email.toLowerCase().includes(busca);
        const matchTipo = tipo === "todos" || u.tipo === tipo;
        return matchBusca && matchTipo;
    });

    renderizarUsuarios(filtrados);
}

function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById("listaUsuarios");
    tbody.innerHTML = "";

    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="sem-usuarios">Nenhum usuário encontrado</td></tr>`;
        return;
    }

    usuarios.forEach(u => {
        const tr = document.createElement("tr");
        
        let badgeClasse = u.tipo || "aluno";
        let textoTipo = u.tipo ? u.tipo.charAt(0).toUpperCase() + u.tipo.slice(1) : "Aluno";
        
        let botaoAcao = '';
        if (u.tipo === 'aluno') {
            botaoAcao = `<button class="btn-acao btn-promover" data-id="${u.id_usuario}" data-tipo="professor">Tornar Professor</button>`;
        } else if (u.tipo === 'professor') {
            botaoAcao = `
                <button class="btn-acao btn-promover" data-id="${u.id_usuario}" data-tipo="aluno">Tornar Aluno</button>
            `;
        } else if (u.tipo === 'diretor') {
            botaoAcao = `<button class="btn-acao btn-promover" data-id="${u.id_usuario}" data-tipo="aluno">Tornar Aluno</button>`;
        }

        tr.innerHTML = `
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td><span class="badge ${badgeClasse}">${textoTipo}</span></td>
            <td>${botaoAcao}</td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll(".btn-promover, .btn-remover").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            const novoTipo = e.target.dataset.tipo;
            
            if (confirm(`Tem certeza que deseja definir este usuário como ${novoTipo}?`)) {
                await alterarTipo(id, novoTipo);
            }
        });
    });
}

async function alterarTipo(idUsuario, novoTipo) {
    const { error } = await supabaseClient
        .from("users")
        .update({ tipo: novoTipo })
        .eq("id_usuario", idUsuario);

    if (error) {
        alert("Erro ao atualizar tipo: " + error.message);
        return;
    }

    alert("Tipo atualizado com sucesso!");
    carregarUsuarios();
}

document.getElementById("buscaUsuario").addEventListener("input", filtrarUsuarios);
document.getElementById("filtroTipo").addEventListener("change", filtrarUsuarios);

carregarUsuarios();
