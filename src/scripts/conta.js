import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

function getUserId() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.id_usuario || null;
}

async function entrarTurma() {
    const input = document.getElementById("codigoTurmaInput");
    const codigo = input?.value.trim().toUpperCase();
    if (!codigo) {
        toast("Digite um código de acesso", "error");
        return;
    }

    const userId = getUserId();
    if (!userId) {
        toast("Usuário não logado", "error");
        return;
    }

    const { data: turma, error } = await supabaseClient
        .from("turma")
        .select("id_turma, nome_turma")
        .eq("codigo_acesso", codigo)
        .maybeSingle();

    if (error || !turma) {
        toast("Código inválido!", "error");
        return;
    }

    const { data: jaExiste } = await supabaseClient
        .from("turma_aluno")
        .select("id_turma")
        .eq("id_turma", turma.id_turma)
        .eq("id_aluno", userId)
        .maybeSingle();

    if (jaExiste) {
        toast(`Você já está na turma "${turma.nome_turma}"`, "success");
        input.value = "";
        document.getElementById("modalTurma").style.display = "none";
        return;
    }

    const { error: errInsert } = await supabaseClient
        .from("turma_aluno")
        .insert({ id_turma: turma.id_turma, id_aluno: userId });

    if (errInsert) {
        toast("Erro ao entrar na turma", "error");
        return;
    }

    toast(`Bem-vindo à turma "${turma.nome_turma}"!`, "success");
    input.value = "";
    document.getElementById("modalTurma").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    const btnEntrar = document.getElementById("btnEntrarTurma");
    const modal = document.getElementById("modalTurma");
    const confirmar = document.getElementById("btnConfirmarTurma");
    const cancelar = document.getElementById("btnCancelarTurma");
    const inputCodigo = document.getElementById("codigoTurmaInput");

    if (btnEntrar && modal) {
        btnEntrar.addEventListener("click", () => {
            modal.style.display = "flex";
            if (inputCodigo) {
                inputCodigo.value = "";
                setTimeout(() => inputCodigo.focus(), 100);
            }
        });
    }

    if (confirmar) {
        confirmar.addEventListener("click", entrarTurma);
    }

    if (cancelar && modal) {
        cancelar.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (inputCodigo) {
        inputCodigo.addEventListener("keydown", (e) => {
            if (e.key === "Enter") entrarTurma();
        });
    }
});

export async function carregarEstatisticasAluno(idUsuario) {
    const { data: redacoes, error: erroRedacoes } = await supabaseClient
        .from("redacao")
        .select("pontos_redacao")
        .eq("id_usuario", idUsuario);

    const redacoesFeitas = redacoes ? redacoes.length : 0;
    let mediaRedacao = 0;
    if (redacoes && redacoes.length > 0) {
        const soma = redacoes.reduce((acc, r) => acc + r.pontos_redacao, 0);
        mediaRedacao = Math.round(soma / redacoes.length);
    }

    const { count: atividadesFeitas, error: erroAtividades } = await supabaseClient
        .from("pontuacao_atividade")
        .select("*", { count: "estimated", head: true })
        .eq("id_usuario", idUsuario);

    const valorAtividades = document.querySelector(".ativFeitas .valor");
    const valorRedacoes = document.querySelector(".redaFeitas .valor");
    const valorMedia = document.querySelector(".mediaRedacao .valor");

    if (valorAtividades) valorAtividades.textContent = atividadesFeitas || 0;
    if (valorRedacoes) valorRedacoes.textContent = redacoesFeitas;
    if (valorMedia) valorMedia.textContent = mediaRedacao;
}

export async function carregarProvasRecentes(idUsuario, mostrarPontos = true) {
    const container = document.getElementById("provasRecentesContainer");
    if (!container) return;

    const { data: pontuacoes, error } = await supabaseClient
        .from("pontuacao_atividade")
        .select("*")
        .eq("id_usuario", idUsuario)
        .order("id_pontuacao_atividade", { ascending: false })
        .limit(5);

    if (error || !pontuacoes || pontuacoes.length === 0) {
        container.innerHTML = '<div class="cardAtividades"><p>Nenhuma prova encontrada</p></div>';
        return;
    }

    container.innerHTML = '';

    for (const pontuacao of pontuacoes) {
        let nomeMateria = "Matéria";
        let nomeConteudo = "Conteúdo";

        if (pontuacao.id_materia) {
            const { data: materia } = await supabaseClient
                .from("materia")
                .select("nome_materia")
                .eq("id_materia", pontuacao.id_materia)
                .single();
            nomeMateria = materia?.nome_materia || "Matéria";
        }

        if (pontuacao.id_conteudo) {
            const { data: conteudo } = await supabaseClient
                .from("conteudo")
                .select("nome_conteudo")
                .eq("id_conteudo", pontuacao.id_conteudo)
                .single();
            nomeConteudo = conteudo?.nome_conteudo || "Conteúdo";
        }

        const pontos = pontuacao.pontos_atividade || 0;

        const div = document.createElement("div");
        div.className = "cardAtividades";
        
        if (mostrarPontos) {
            div.innerHTML = `
                <i class="fa-solid fa-book-open"></i>
                <div class="info-prova">
                    <p class="materia-conteudo">${nomeMateria} - ${nomeConteudo}</p>
                    <p class="pontos">${pontos} pontos</p>
                </div>
            `;
        } else {
            div.innerHTML = `
                <i class="fa-solid fa-book-open"></i>
                <p>${nomeMateria} - ${nomeConteudo}</p>
            `;
        }
        container.appendChild(div);
    }
}

export async function carregarEstatisticasProfessor(idUsuario) {
    const { count: perguntasCriadas } = await supabaseClient
        .from("perguntas")
        .select("*", { count: "estimated", head: true })
        .eq("id_usuario", idUsuario);

    const { data: perguntas } = await supabaseClient
        .from("perguntas")
        .select("id_pergunta")
        .eq("id_usuario", idUsuario);

    let totalRespostas = 0;
    let totalAcertos = 0;
    if (perguntas && perguntas.length > 0) {
        const idPerguntas = perguntas.map(p => p.id_pergunta);
        
        const { data: alternativas } = await supabaseClient
            .from("alternativa")
            .select("id_alternativa, correta")
            .in("id_pergunta", idPerguntas);

        if (alternativas && alternativas.length > 0) {
            const idAlternativas = alternativas.map(a => a.id_alternativa);
            
            const { data: respostas, error } = await supabaseClient
                .from("pontuacao_atividade")
                .select("id_alternativa, pontos_atividade")
                .in("id_alternativa", idAlternativas);

            totalRespostas = respostas ? respostas.length : 0;
            totalAcertos = respostas ? respostas.filter(r => r.pontos_atividade === 1).length : 0;
        }
    }

    const mediaAcertos = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : 0;

    const valorPerguntas = document.querySelector(".ativFeitas .valor");
    const valorRespostas = document.querySelector(".redaFeitas .valor");
    const valorTaxa = document.querySelector(".mediaRedacao .valor");

    if (valorPerguntas) valorPerguntas.textContent = perguntasCriadas || 0;
    if (valorRespostas) valorRespostas.textContent = totalRespostas;
    if (valorTaxa) valorTaxa.textContent = mediaAcertos + "%";
}

export async function carregarProvasRecentesProfessor(idUsuario) {
    const container = document.getElementById("provasRecentesContainer");
    if (!container) return;

    const { data: perguntas } = await supabaseClient
        .from("perguntas")
        .select("id_materia, id_conteudo")
        .eq("id_usuario", idUsuario)
        .order("data_pergunta", { ascending: false });

    if (!perguntas || perguntas.length === 0) {
        container.innerHTML = '<div class="cardAtividades"><p>Nenhuma atividade encontrada</p></div>';
        return;
    }

    const atividadesUnicas = [];
    const seen = new Set();
    for (const p of perguntas) {
        const key = `${p.id_materia}-${p.id_conteudo}`;
        if (!seen.has(key)) {
            seen.add(key);
            atividadesUnicas.push(p);
        }
    }

    container.innerHTML = '';

    for (const atividade of atividadesUnicas.slice(0, 5)) {
        let nomeMateria = "Matéria";
        let nomeConteudo = "Conteúdo";

        if (atividade.id_materia) {
            const { data: materia } = await supabaseClient
                .from("materia")
                .select("nome_materia")
                .eq("id_materia", atividade.id_materia)
                .single();
            nomeMateria = materia?.nome_materia || "Matéria";
        }

        if (atividade.id_conteudo) {
            const { data: conteudo } = await supabaseClient
                .from("conteudo")
                .select("nome_conteudo")
                .eq("id_conteudo", atividade.id_conteudo)
                .single();
            nomeConteudo = conteudo?.nome_conteudo || "Conteúdo";
        }

        const div = document.createElement("div");
        div.className = "cardAtividades";
        div.style.cursor = "pointer";
        div.innerHTML = `
            <i class="fa-solid fa-book-open"></i>
            <p>${nomeMateria} - ${nomeConteudo}</p>
        `;
        div.addEventListener("click", () => {
            window.location.href = `historico_prof.html?materia=${encodeURIComponent(nomeMateria)}&conteudo=${encodeURIComponent(nomeConteudo)}`;
        });
        container.appendChild(div);
    }
}

export function initDadosConta() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    
    const path = window.location.pathname;
    const isPaginaLogin = path.includes("inicio.html") || path.includes("inicio") || path.endsWith("/") || path.endsWith("\\");
    const isPaginaPublica = path.includes("cadastro.html") || path.includes("cadastro") || path.includes("recuperar") || path.includes("redefinir-senha") || path.includes("redefinirSenha") || path.includes("callback") || path.includes("confirmar") || isPaginaLogin;
    
    if (!userLogado && !isPaginaPublica) {
        window.location.href = "inicio.html";
        return;
    }
    
    if (isPaginaPublica) return;
    
    if (userLogado.tipo_conta === 'aluno') {
        carregarEstatisticasAluno(userLogado.id_usuario);
        carregarProvasRecentes(userLogado.id_usuario, true);
    } else if (userLogado.tipo_conta === 'professor') {
        carregarEstatisticasProfessor(userLogado.id_usuario);
        carregarProvasRecentesProfessor(userLogado.id_usuario);
    }
    
    const nomeUsuario = document.getElementById("nomeUsuario");
    const tipoConta = document.getElementById("tipoConta");
    const dataCriacao = document.getElementById("dataCriacao");
    const imgPerfil = document.getElementById("imgPerfil");
    const inputFoto = document.getElementById("inputFotoPerfil");
    const btnEditar = document.querySelector(".editar");
    
    if (nomeUsuario) {
        nomeUsuario.textContent = userLogado.username;
    }
    
    if (tipoConta) {
        tipoConta.textContent = userLogado.tipo_conta === 'aluno' ? 'Aluno' : 'Professor';
    }
    
    if (dataCriacao && userLogado.data_criacao) {
        const data = new Date(userLogado.data_criacao);
        const mes = data.toLocaleString('pt-BR', { month: 'long' });
        const ano = data.getFullYear();
        dataCriacao.textContent = `Membro desde ${mes}/${ano}`;
    }
    
    if (imgPerfil && userLogado.foto_url) {
        imgPerfil.src = userLogado.foto_url;
    }
    
    if (btnEditar) {
        btnEditar.addEventListener("click", () => {
            if (nomeUsuario.innerHTML.includes("<input")) return;
            
            const nomeAtual = nomeUsuario.textContent;
            nomeUsuario.innerHTML = `<input type="text" id="inputNome" value="${nomeAtual}" style="border: 1px solid var(--primary-color); padding: 4px; border-radius: 4px; background: var(--bg-color); color: var(--text-color);">`;
            
            const inputNome = document.getElementById("inputNome");
            inputNome.focus();
            
            inputNome.addEventListener("blur", async () => {
                const novoNome = inputNome.value.trim();
                if (!novoNome) {
                    nomeUsuario.textContent = nomeAtual;
                    return;
                }
                
                if (novoNome === nomeAtual) {
                    nomeUsuario.textContent = nomeAtual;
                    return;
                }
                
                const { error } = await supabaseClient
                    .from("users")
                    .update({ username: novoNome })
                    .eq("id_usuario", userLogado.id_usuario);
                
                if (error) {
                    toast("Erro ao atualizar nome", "error");
                    nomeUsuario.textContent = nomeAtual;
                    return;
                }
                
                userLogado.username = novoNome;
                localStorage.setItem("userLogado", JSON.stringify(userLogado));
                nomeUsuario.textContent = novoNome;
                toast("Nome atualizado com sucesso!", "success");
            });
            
            inputNome.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    inputNome.blur();
                }
            });
        });
    }
    
    if (inputFoto) {
        inputFoto.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const userLogado = JSON.parse(localStorage.getItem("userLogado"));
            if (!userLogado) {
                toast("Usuário não está logado", "error");
                return;
            }
            
            const extensao = file.name.split('.').pop();
            const nomeArquivo = `perfil_${userLogado.id_usuario}_${Date.now()}.${extensao}`;
            
            const { data, error } = await supabaseClient.storage
                .from("fotos-perfil")
                .upload(nomeArquivo, file);
            
            if (error) {
                console.error("Erro ao fazer upload:", error);
                toast("Erro ao fazer upload da imagem", "error");
                return;
            }
            
            const { data: urlData } = supabaseClient.storage
                .from("fotos-perfil")
                .getPublicUrl(nomeArquivo);
            
            const fotoUrl = urlData.publicUrl;
            
            const { error: errorUpdate } = await supabaseClient
                .from("users")
                .update({ foto_url: fotoUrl })
                .eq("id_usuario", userLogado.id_usuario);
            
            if (errorUpdate) {
                console.error("Erro ao salvar URL:", errorUpdate);
                toast("Erro ao salvar foto", "error");
                return;
            }
            
            imgPerfil.src = fotoUrl;
            userLogado.foto_url = fotoUrl;
            localStorage.setItem("userLogado", JSON.stringify(userLogado));
            toast("Foto atualizada com sucesso!", "success");
        });
    }
}