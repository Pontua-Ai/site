import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let editandoId = null;

function getUserId() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.id_usuario || null;
}

function gerarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "";
    for (let i = 0; i < 6; i++) {
        codigo += chars[Math.floor(Math.random() * chars.length)];
    }
    return codigo;
}

async function carregarAlunos() {
    const { data } = await supabaseClient
        .from("users")
        .select("id_usuario, username, email")
        .eq("tipo_conta", "aluno")
        .order("username");
    return data || [];
}

async function carregarMateriasProfessor() {
    const userId = getUserId();
    const { data } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia")
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`)
        .order("nome_materia");
    const unicas = [];
    const vistos = new Set();
    for (const m of data || []) {
        const chave = m.nome_materia.toLowerCase();
        if (!vistos.has(chave)) {
            vistos.add(chave);
            unicas.push(m);
        }
    }
    return unicas;
}

async function carregarTurmas() {
    const container = document.getElementById("turmasList");
    if (!container) return;
    container.innerHTML = "<p>Carregando...</p>";

    const userId = getUserId();
    const { data: turmas } = await supabaseClient
        .from("turma")
        .select("id_turma, nome_turma, codigo_acesso")
        .eq("id_professor", userId)
        .order("nome_turma");

    if (!turmas || turmas.length === 0) {
        container.innerHTML = `<div class="turma-vazia" style="text-align:center;padding:40px;">
            <p>Nenhuma turma criada ainda.</p>
            <p>Clique em "Nova Turma" para começar.</p>
        </div>`;
        return;
    }

    container.innerHTML = "";

    for (const turma of turmas) {
        const { data: alunos } = await supabaseClient
            .from("turma_aluno")
            .select("id_aluno")
            .eq("id_turma", turma.id_turma);

        const idsAlunos = (alunos || []).map(a => a.id_aluno);
        let nomesAlunos = [];
        if (idsAlunos.length > 0) {
            const { data: users } = await supabaseClient
                .from("users")
                .select("username")
                .in("id_usuario", idsAlunos);
            nomesAlunos = (users || []).map(u => u.username);
        }

        const { data: materiasVinculadas } = await supabaseClient
            .from("materia_turma")
            .select("id_materia")
            .eq("id_turma", turma.id_turma);

        const idsMaterias = (materiasVinculadas || []).map(m => m.id_materia);
        let nomesMaterias = [];
        if (idsMaterias.length > 0) {
            const { data: materias } = await supabaseClient
                .from("materia")
                .select("nome_materia")
                .in("id_materia", idsMaterias);
            nomesMaterias = (materias || []).map(m => m.nome_materia);
        }

        const card = document.createElement("div");
        card.className = "turma-card";
        card.innerHTML = `
            <div class="turma-card-header">
                <h3><i class="fa-solid fa-chalkboard-user"></i> ${turma.nome_turma}</h3>
                <div class="turma-actions">
                    <button class="btn-edit" data-id="${turma.id_turma}"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button class="btn-delete" data-id="${turma.id_turma}"><i class="fa-solid fa-trash"></i> Excluir</button>
                </div>
            </div>
            <div class="turma-info">
                <div class="turma-info-item">
                    <i class="fa-solid fa-key"></i>
                    <span>Código: <span class="codigo-valor">${turma.codigo_acesso || "—"}</span></span>
                </div>
                <div class="turma-info-item">
                    <i class="fa-solid fa-user-graduate"></i>
                    <span>${idsAlunos.length} aluno${idsAlunos.length !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div>
                <strong style="font-size:13px;color:var(--text-gray)">MATÉRIAS:</strong>
                <div class="turma-materias">
                    ${nomesMaterias.length > 0
                        ? nomesMaterias.map(n => `<span class="turma-materia-tag">${n}</span>`).join('')
                        : '<span class="turma-vazia">Nenhuma matéria vinculada</span>'}
                </div>
            </div>
            <div style="margin-top:12px">
                <strong style="font-size:13px;color:var(--text-gray)">ALUNOS:</strong>
                <div class="turma-alunos">
                    ${nomesAlunos.length > 0
                        ? nomesAlunos.map(n => `<span class="turma-aluno-tag">${n}</span>`).join('')
                        : '<span class="turma-vazia">Nenhum aluno</span>'}
                </div>
            </div>
        `;

        container.appendChild(card);

        card.querySelector(".btn-edit").addEventListener("click", () => abrirModal(turma.id_turma));
        card.querySelector(".btn-delete").addEventListener("click", () => excluirTurma(turma.id_turma, turma.nome_turma));
    }
}

function initSelect2() {
    if (typeof $ === "undefined" || typeof $.fn.select2 === "undefined") return;
    $("#selectAlunos").select2({
        width: "100%",
        placeholder: "Selecione os alunos...",
        language: { noResults: () => "Nenhum aluno encontrado" },
    });
    $("#selectMaterias").select2({
        width: "100%",
        placeholder: "Selecione as matérias...",
        language: { noResults: () => "Nenhuma matéria encontrada" },
    });
}

async function abrirModal(turmaId) {
    editandoId = turmaId || null;
    document.getElementById("modalTurmaTitle").textContent = turmaId ? "Editar Turma" : "Nova Turma";
    document.getElementById("inputNomeTurma").value = "";
    document.getElementById("inputCodigo").value = "";
    document.getElementById("formTurma").querySelector('button[type="submit"]').textContent = turmaId ? "Salvar" : "Criar";

    if (typeof $ !== "undefined" && $.fn.select2) {
        $("#selectAlunos").val(null).trigger("change");
        $("#selectMaterias").val(null).trigger("change");
    }

    const alunos = await carregarAlunos();
    const materias = await carregarMateriasProfessor();

    const selectAlunos = document.getElementById("selectAlunos");
    selectAlunos.innerHTML = alunos.map(a =>
        `<option value="${a.id_usuario}">${a.username} (${a.email})</option>`
    ).join("");

    const selectMaterias = document.getElementById("selectMaterias");
    selectMaterias.innerHTML = materias.map(m =>
        `<option value="${m.id_materia}">${m.nome_materia}</option>`
    ).join("");

    if (turmaId) {
        const { data: turma } = await supabaseClient
            .from("turma")
            .select("nome_turma, codigo_acesso")
            .eq("id_turma", turmaId)
            .single();
        if (turma) {
            document.getElementById("inputNomeTurma").value = turma.nome_turma;
            document.getElementById("inputCodigo").value = turma.codigo_acesso || "";
        }

        const { data: alunosTurma } = await supabaseClient
            .from("turma_aluno")
            .select("id_aluno")
            .eq("id_turma", turmaId);
        const idsAlunosTurma = (alunosTurma || []).map(a => a.id_aluno);

        const { data: materiasTurma } = await supabaseClient
            .from("materia_turma")
            .select("id_materia")
            .eq("id_turma", turmaId);
        const idsMateriasTurma = (materiasTurma || []).map(m => m.id_materia);

        if (typeof $ !== "undefined" && $.fn.select2) {
            $("#selectAlunos").val(idsAlunosTurma).trigger("change");
            $("#selectMaterias").val(idsMateriasTurma).trigger("change");
        }
    }

    document.getElementById("modalTurma").style.display = "flex";
}

async function salvarTurma(e) {
    e.preventDefault();
    const userId = getUserId();
    const nome = document.getElementById("inputNomeTurma").value.trim();
    if (!nome) {
        toast("Digite o nome da turma", "error");
        return;
    }

    let codigo = document.getElementById("inputCodigo").value.trim();
    if (!codigo) {
        codigo = gerarCodigo();
    }

    const alunosSelecionados = typeof $ !== "undefined" && $.fn.select2
        ? $("#selectAlunos").val() || []
        : [];

    const materiasSelecionadas = typeof $ !== "undefined" && $.fn.select2
        ? $("#selectMaterias").val() || []
        : [];

    const idsAlunos = alunosSelecionados.map(Number);
    const idsMaterias = materiasSelecionadas.map(Number);

    if (editandoId) {
        const { error: errUpd } = await supabaseClient
            .from("turma")
            .update({ nome_turma: nome, codigo_acesso: codigo })
            .eq("id_turma", editandoId);
        if (errUpd) {
            toast("Erro ao atualizar: " + errUpd.message, "error");
            return;
        }

        await supabaseClient.from("turma_aluno").delete().eq("id_turma", editandoId);
        await supabaseClient.from("materia_turma").delete().eq("id_turma", editandoId);

        if (idsAlunos.length > 0) {
            await supabaseClient.from("turma_aluno").insert(
                idsAlunos.map(id => ({ id_turma: editandoId, id_aluno: id }))
            );
        }
        if (idsMaterias.length > 0) {
            await supabaseClient.from("materia_turma").insert(
                idsMaterias.map(id => ({ id_materia: id, id_turma: editandoId }))
            );
        }

        toast("Turma atualizada com sucesso!", "success");
    } else {
        const { data: turma, error: errIns } = await supabaseClient
            .from("turma")
            .insert({ nome_turma: nome, id_professor: userId, codigo_acesso: codigo })
            .select()
            .single();
        if (errIns) {
            toast("Erro ao criar: " + errIns.message, "error");
            return;
        }

        if (idsAlunos.length > 0) {
            await supabaseClient.from("turma_aluno").insert(
                idsAlunos.map(id => ({ id_turma: turma.id_turma, id_aluno: id }))
            );
        }
        if (idsMaterias.length > 0) {
            await supabaseClient.from("materia_turma").insert(
                idsMaterias.map(id => ({ id_materia: id, id_turma: turma.id_turma }))
            );
        }

        toast("Turma criada com sucesso!", "success");
    }

    document.getElementById("modalTurma").style.display = "none";
    editandoId = null;
    carregarTurmas();
}

async function excluirTurma(id, nome) {
    if (!confirm(`Excluir a turma "${nome}"?`)) return;
    const { error } = await supabaseClient
        .from("turma")
        .delete()
        .eq("id_turma", id);
    if (error) {
        toast("Erro ao excluir: " + error.message, "error");
        return;
    }
    toast("Turma excluída!", "success");
    carregarTurmas();
}

document.addEventListener("DOMContentLoaded", () => {
    carregarTurmas();

    document.getElementById("btnNovaTurma").addEventListener("click", () => abrirModal(null));
    document.getElementById("formTurma").addEventListener("submit", salvarTurma);
    document.getElementById("btnCancelarTurma").addEventListener("click", () => {
        document.getElementById("modalTurma").style.display = "none";
        editandoId = null;
    });
    document.getElementById("btnGerarCodigo").addEventListener("click", () => {
        document.getElementById("inputCodigo").value = gerarCodigo();
    });

    setTimeout(initSelect2, 100);
});
