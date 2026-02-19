const API_KEY = "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";

const PROMPT_CORRECAO_ENEM = `Atue como corretor oficial da redação do Exame Nacional do Ensino Médio (ENEM), seguindo rigorosamente a matriz de avaliação do Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP). Seja técnico, criterioso e imparcial.
Contexto:
Você irá avaliar uma redação dissertativo-argumentativa escrita nos moldes do ENEM. A correção deve simular o padrão real de avaliação, atribuindo nota de 0 a 200 pontos para cada uma das 5 competências, totalizando até 1000 pontos.
Tarefa:
Leia atentamente a redação.
Avalie separadamente as 5 competências:
Competência 1: Domínio da norma-padrão da língua escrita.
Competência 2: Compreensão do tema e desenvolvimento dentro do formato dissertativo-argumentativo.
Competência 3: Seleção e organização de argumentos.
Competência 4: Coesão e mecanismos linguísticos.
Competência 5: Proposta de intervenção (agente, ação, meio, finalidade e detalhamento, respeitando os Direitos Humanos).
Para cada competência:
Atribua uma nota (0, 40, 80, 120, 160 ou 200).
Justifique detalhadamente a pontuação com base nos critérios oficiais.
Aponte trechos específicos que fundamentem a nota.
Calcule a nota final (soma das cinco competências).
Ao final, forneça:
✔️ Pontos fortes da redação
❌ Pontos a melhorar
📈 Orientações práticas para alcançar nota 1000
Formato de Saída (OBRIGATÓRIO):
📌 Competência 1: X/200  
Justificativa:  
📌 Competência 2: X/200  
Justificativa:  
📌 Competência 3: X/200  
Justificativa:  
📌 Competência 4: X/200  
Justificativa:  
📌 Competência 5: X/200  
Justificativa:  
🎯 Nota Final: X/1000  
✔️ Pontos Fortes:  
-  
❌ Pontos a Melhorar:  
-  
📈 Como chegar à nota 1000:  
-  
Restrições:
Não seja genérico nas justificativas.
Não atribua nota máxima sem justificar com critérios claros.
Não ignore desvios gramaticais.
Não deixe de avaliar a proposta de intervenção de forma técnica.
Não utilize opinião pessoal — baseie-se apenas na matriz oficial.
Texto do candidato:`;

async function enviarParaIA(texto) {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const body = {
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "user", content: texto }
        ]
    };

    try {
        const resposta = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });

        const dados = await resposta.json();
        
        if (dados.choices && dados.choices[0].message.content) {
            return dados.choices[0].message.content;
        } else if (dados.error) {
            return "Erro da API: " + dados.error.message;
        } else {
            return "Erro: Resposta vazia. Verifique o console para mais detalhes.";
        }
    } catch (erro) {
        return "Erro: " + erro.message;
    }
}

async function corrigirRedacao(textoUsuario) {
    const textoCompleto = PROMPT_CORRECAO_ENEM + "\n\n" + textoUsuario;
    return await enviarParaIA(textoCompleto);
}

//Ir para  https://console.groq.com e pegar a chave key gratuita