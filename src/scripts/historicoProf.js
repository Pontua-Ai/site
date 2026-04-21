import supabaseClient from "./supabase.js";

export async function carregarHistorico() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado || userLogado.tipo_conta !== 'professor') {
        window.location.href = "inicio.html";
        return;
    }

    const { data: perguntas, error } = await supabaseClient
        .from("perguntas")
        .select("*, materia(nome_materia), conteudo(nome_conteudo)")
        .eq("id_usuario", userLogado.id_usuario)
        .order("id_pergunta", { ascending: false });

    if (error || !perguntas || perguntas.length === 0) {
        document.getElementById("historicoContainer").innerHTML = '<div class="cardBox"><p>Nenhuma pergunta encontrada</p></div>';
        return;
    }

    const container = document.getElementById("historicoContainer");
    container.innerHTML = '';

    for (const pergunta of perguntas) {
        const { data: alternativas } = await supabaseClient
            .from("alternativa")
            .select("id_alternativa, correta")
            .eq("id_pergunta", pergunta.id_pergunta);

        const idAlternativas = alternativas?.map(a => a.id_alternativa) || [];
        
        let acertos = 0;
        let respostas = 0;

        if (idAlternativas.length > 0) {
            const { data: pontuacoes } = await supabaseClient
                .from("pontuacao_atividade")
                .select("pontos_atividade")
                .in("id_alternativa", idAlternativas);
            
            respostas = pontuacoes?.length || 0;
            acertos = pontuacoes?.filter(p => p.pontos_atividade === 1).length || 0;
        }

        const materiaNome = pergunta.materia?.nome_materia || "Matéria";
        const conteudoNome = pergunta.conteudo?.nome_conteudo || "Conteúdo";

        const card = document.createElement("div");
        card.className = "cardBox";
        card.innerHTML = `
            <div class="headerBox">
                <h4>${pergunta.pergunta_texto.replace(/<[^>]*>/g, "").substring(0, 50)}${pergunta.pergunta_texto.length > 50 ? "..." : ""}</h4>
                <div class="botoesAcoes">
                    <button class="olho"><i class="fa-regular fa-eye"></i></button>
                    <button class="mudar"><i class="fa-regular fa-pen-to-square"></i></button>
                </div>
            </div>
            <div class="mainBox">
                <p>${materiaNome} - ${conteudoNome}</p>
                <p>${respostas} respostas | ${respostas > 0 ? Math.round((acertos / respostas) * 100) : 0}% de acertos</p>
            </div>
        `;
        container.appendChild(card);
    }
}