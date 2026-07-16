import supabaseClient from "./supabase.js";

export async function carregarHistorico() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado || userLogado.tipo_conta !== 'aluno') {
        window.location.href = "inicio.html";
        return;
    }

    const container = document.getElementById("historicoContainer");
    if (!container) return;

    container.innerHTML = '<div class="empty-state" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:60px 20px;color:var(--text-gray)"><span class="loading-spinner"></span> Carregando histórico...</div>';

    const { data: pontuacoes, error } = await supabaseClient
        .from("pontuacao_atividade")
        .select(`
            id_pontuacao_atividade,
            pontos_atividade,
            data_atividade,
            id_alternativa,
            materia(nome_materia),
            conteudo(nome_conteudo),
            alternativa(
                id_alternativa,
                nome_alternativa,
                correta,
                id_pergunta,
                perguntas(
                    id_pergunta,
                    pergunta_texto,
                    data_pergunta
                )
            )
        `)
        .eq("id_usuario", userLogado.id_usuario)
        .order("id_pontuacao_atividade", { ascending: false });

    if (error || !pontuacoes || pontuacoes.length === 0) {
        container.innerHTML = '<div class="cardBox"><p>Nenhuma atividade encontrada</p></div>';
        return;
    }

    container.innerHTML = '';

    for (const p of pontuacoes) {
        const materiaNome = p.materia?.nome_materia || "Matéria";
        const conteudoNome = p.conteudo?.nome_conteudo || "Conteúdo";
        const textoPergunta = p.alternativa?.perguntas?.pergunta_texto?.replace(/<[^>]*>/g, "").substring(0, 150) || "";
        const nomeAlternativa = p.alternativa?.nome_alternativa || "";
        const isCorreta = p.pontos_atividade === 1;
        const dataAtividade = p.data_atividade
            ? new Date(p.data_atividade).toLocaleDateString("pt-BR")
            : "";

        const div = document.createElement("div");
        div.className = "cardBox";
        div.innerHTML = `
            <div class="mainBox mainBoxTop">
                <span class="materia-badge">${materiaNome}</span>
                <span class="conteudo-badge">${conteudoNome}</span>
                ${dataAtividade ? `<span class="data-info"><i class="fa-regular fa-calendar"></i> ${dataAtividade}</span>` : ''}
            </div>
            <div class="headerBox">
                <p class="texto-enunciado">${textoPergunta}</p>
                <p>${nomeAlternativa}</p>
                <span class="${isCorreta ? 'correto-badge' : 'incorreto-badge'}">${isCorreta ? 'Correto' : 'Incorreto'}</span>
            </div>
        `;
        container.appendChild(div);
    }

}
