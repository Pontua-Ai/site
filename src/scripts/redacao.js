import { GoogleGenAI } from "https://esm.run/@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDYNrj-aPPtQFoCe6t2fKD0Q1wYJw3jpDw"
});

let estaCorrigindo = false;

window.corrigir = async function () {
  if (estaCorrigindo) return;
  
  const botao = document.querySelector('button[onclick="corrigir()"]');
  const texto = document.getElementById("texto").value;
  const titulo = document.getElementById("title").value;

  if (!texto.trim()) {
    alert("Por favor, escreva uma redação primeiro!");
    return;
  }

  estaCorrigindo = true;
  botao.disabled = true;
  botao.textContent = "Carregando...";
  console.log("[DEBUG] Iniciando correção da redação...");
  console.log("[DEBUG] Titulo capturado:", titulo);
  console.log("[DEBUG] Texto capturado, tamanho:", texto.length, "caracteres");

  const prompt = `
Corrija a redação no padrão ENEM.
Seja rigido.
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "C1": { "nota": number, "motivo": string }, 
  "C2": { "nota": number, "motivo": string },
  "C3": { "nota": number, "motivo": string },
  "C4": { "nota": number, "motivo": string },
  "C5": { "nota": number, "motivo": string },
  "nota_final": number,
  "dicas": string
}
Titulo:
${titulo}

Texto:
${texto}
  `;

  console.log("[DEBUG] Enviando requisição para a API Gemini...");

  async function fazerRequisicao(retentativas = 3) {
    for (let i = 0; i < retentativas; i++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        return response;
      } catch (error) {
        if (i < retentativas - 1) {
          const tempo = Math.pow(2, i) * 1000;
          await new Promise(r => setTimeout(r, tempo));
        } else {
          throw error;
        }
      }
    }
  }

  try {
    const response = await fazerRequisicao();
    console.log("[DEBUG] Resposta recebida da API!");

    const data = JSON.parse(response.text);

    console.log("[DEBUG] Exibindo resultado na tela...");
    document.getElementById("resultado").innerHTML = `
<span class="titulo-competencia">Competência 1 (Domínio da norma culta):</span>
${data.C1.nota}

Motivo: ${data.C1.motivo}

<span class="titulo-competencia">Competência 2 (Compreensão do tema):</span>
${data.C2.nota}

Motivo: ${data.C2.motivo}

<span class="titulo-competencia">Competência 3 (Argumentação):</span>
${data.C3.nota}

Motivo: ${data.C3.motivo}

<span class="titulo-competencia">Competência 4 (Coesão):</span>
${data.C4.nota}

Motivo: ${data.C4.motivo}

<span class="titulo-competencia">Competência 5 (Intervenção):</span>
${data.C5.nota}

Motivo: ${data.C5.motivo}

<br><br>
<strong>Nota Final: ${data.nota_final}</strong>
<br><br>
<strong>Dicas para próxima redação:</strong>
${data.dicas}
`;
  } catch (error) {
    document.getElementById("resultado").textContent = "Erro ao corrigir redação. Tente novamente mais tarde.";
  }

  estaCorrigindo = false;
  botao.disabled = false;
  botao.textContent = "Avaliar";
  document.querySelector(".resultado-box").scrollIntoView({
  behavior: "smooth"
});
};