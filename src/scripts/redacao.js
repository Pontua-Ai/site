import { GoogleGenAI } from "https://esm.run/@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDYNrj-aPPtQFoCe6t2fKD0Q1wYJw3jpDw"
});

let estaCorrigindo = false;

window.corrigir = async function () {
  if (estaCorrigindo) return;
  
  const botao = document.querySelector('button[onclick="corrigir()"]');
  const texto = document.getElementById("texto").value;

  if (!texto.trim()) {
    alert("Por favor, escreva uma redação primeiro!");
    return;
  }

  estaCorrigindo = true;
  botao.disabled = true;
  botao.textContent = "Carregando...";
  console.log("[DEBUG] Iniciando correção da redação...");
  console.log("[DEBUG] Texto capturado, tamanho:", texto.length, "caracteres");

  const prompt = `
Corrija a redação no padrão ENEM.
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "C1": { "nota": number, "motivo": string },
  "C2": { "nota": number, "motivo": string },
  "C3": { "nota": number, "motivo": string },
  "C4": { "nota": number, "motivo": string },
  "C5": { "nota": number, "motivo": string },
  "nota_final": number,
}

Texto:
${texto}
  `;

  console.log("[DEBUG] Enviando requisição para a API Gemini...");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    console.log("[DEBUG] Resposta recebida da API!");

    const data = JSON.parse(response.text);
    console.log("[DEBUG] Dados processados:", data);

    console.log("[DEBUG] Exibindo resultado na tela...");
    document.getElementById("resultado").textContent =
      `C1: ${data.C1.nota}
      
Motivo: ${data.C1.motivo}

C2: ${data.C2.nota}

Motivo: ${data.C2.motivo}

C3: ${data.C3.nota}

Motivo: ${data.C3.motivo}

C4: ${data.C4.nota}

Motivo: ${data.C4.motivo}

C5: ${data.C5.nota}

Motivo: ${data.C5.motivo}


Nota Final: ${data.nota_final}`;
  } catch (error) {
    console.error("[DEBUG] Erro na API:", error.message);
    document.getElementById("resultado").textContent = "Erro ao corrigir redação. Tente novamente mais tarde.";
  }

  estaCorrigindo = false;
  botao.disabled = false;
  botao.textContent = "Avaliar";
};