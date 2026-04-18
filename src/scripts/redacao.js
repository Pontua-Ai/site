import { GoogleGenAI } from "https://esm.run/@google/genai";
import { toast } from "./utils.js";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDYNrj-aPPtQFoCe6t2fKD0Q1wYJw3jpDw"
});

let estaCorrigindo = false;

window.corrigir = async function () {
  if (estaCorrigindo) return;
  
  const botao = document.querySelector('button[onclick="corrigir()"]');
  const texto = document.getElementById("texto").value;
  const titulo = document.getElementById("title").value;
  const vestibular = document.getElementById("vestibular").value;

  if (!texto.trim()) {
    toast("Por favor, escreva uma redação primeiro!", "error");
    return;
  }

  estaCorrigindo = true;
  botao.disabled = true;
  botao.textContent = "Carregando...";
  console.log("[DEBUG] Iniciando correção da redação...");
  console.log("[DEBUG] Titulo capturado:", titulo);
  console.log("[DEBUG] Texto capturado, tamanho:", texto.length, "caracteres");
  console.log("[DEBUG] Vestibular selecionado:", vestibular);

  const prompts = {
    enem: `
Corrija a redação no padrão ENEM.
Seguindo os seguintes critérios:
Competencia 1: Demonstrar domínio da modalidade escrita formal da língua portuguesa
  Atribui-se 200 pontos para essa competencia caso: Demonstre excelente domínio da modalidade escrita formal da língua portuguesa e de escolha de registro. Desvios gramaticais ou de convenções da escrita serão aceitos somente como excepcionalidade e quando não caracterizarem reincidência.
  Atribui-se 160 pontos para essa competencia caso: Demonstra bom domínio da modalidade escrita formal da língua portuguesa e de escolha de registro, com poucos desvios gramaticais e de convenções da escrita.
  Atribui-se 120 pontos para essa competencia caso: Demonstra domínio mediano da modalidade escrita formal da língua portuguesa e de escolha de registro, com alguns desvios gramaticais e de convenções da escrita.
  Atribui-se 80 pontos para essa competencia caso: Demonstra domínio insuficiente da modalidade escrita formal da língua portuguesa, com muitos desvios gramaticais, de escolha de registro e de convenções da escrita.
  Atribui-se 40 pontos para essa competencia caso: Demonstra domínio precário da modalidade escrita formal da língua portuguesa, de forma sistemática, com diversificados e frequentes desvios gramaticais, de escolha de registro e de convenções da escrita.
  Atribui-se 0 pontos para essa competencia caso: Demonstra desconhecimento da modalidade escrita formal da língua portuguesa.

Competencia 2: Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema dentro dos limites estruturais do texto dissertativo-argumentativo em prosa.
  Atribui-se 200 pontos para essa competencia caso: Desenvolve o tema por meio de argumentação consistente, a partir de um repertório sociocultural produtivo, e apresenta excelente domínio do texto dissertativo-argumentativo.
  Atribui-se 160 pontos para essa competencia caso: Desenvolve o tema por meio de argumentação consistente e apresenta bom domínio do texto dissertativo-argumentativo, com proposição, argumentação e conclusão.
  Atribui-se 120 pontos para essa competencia caso: Desenvolve o tema por meio de argumentação previsível e apresenta domínio mediano do texto dissertativo-argumentativo, com proposição, argumentação e conclusão.
  Atribui-se 80 pontos para essa competencia caso: Desenvolve o tema recorrendo à cópia de trechos dos textos motivadores ou apresenta domínio insuficiente do texto dissertativo-argumentativo, não atendendo à estrutura com proposição, argumentação e conclusão.
  Atribui-se 40 pontos para essa competencia caso: Apresenta o assunto, tangenciando o tema, ou demonstra domínio precário do texto dissertativo-argumentativo, com traços constantes de outros tipos textuais.
  Atribui-se 0 pontos para essa competencia caso: Fuga ao tema/não atendimento à estrutura dissertativo-argumentativa. Nestes casos a redação recebe nota 0 (zero) e é anulada.

Competencia 3: Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.
  Atribui-se 200 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema proposto, de forma consistente e organizada, configurando autoria, em defesa de um ponto de vista.
  Atribui-se 160 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema, de forma organizada, com indícios de autoria, em defesa de um ponto de vista.
  Atribui-se 120 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema, limitados aos argumentos dos textos motivadores e pouco organizados, em defesa de um ponto de vista.
  Atribui-se 80 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema, mas desorganizados ou contraditórios e limitados aos argumentos dos textos motivadores, em defesa de um ponto de vista.
  Atribui-se 40 pontos para essa competencia caso: Apresenta informações, fatos e opiniões pouco relacionados ao tema ou incoerentes e sem defesa de um ponto de vista.
  Atribui-se 0 pontos para essa competencia caso: Apresenta informações, fatos e opiniões não relacionados ao tema e sem defesa de um ponto de vista.

Competencia 4: Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.
  Atribui-se 200 pontos para essa competencia caso: Articula bem as partes do texto e apresenta repertório diversificado de recursos coesivos.
  Atribui-se 160 pontos para essa competencia caso: Articula as partes do texto, com poucas inadequações, e apresenta repertório diversificado de recursos coesivos.
  Atribui-se 120 pontos para essa competencia caso: Articula as partes do texto, de forma mediana, com inadequações, e apresenta repertório pouco diversificado de recursos coesivos.
  Atribui-se 80 pontos para essa competencia caso: Articula as partes do texto, de forma insuficiente, com muitas inadequações, e apresenta repertório limitado de recursos coesivos.
  Atribui-se 40 pontos para essa competencia caso: Articula as partes do texto de forma precária.
  Atribui-se 0 pontos para essa competencia caso: Não articula as informações.

Competencia 5: Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.
  Atribui-se 200 pontos para essa competencia caso: Elabora muito bem proposta de intervenção, detalhada, relacionada ao tema e articulada à discussão desenvolvida no texto.
  Atribui-se 160 pontos para essa competencia caso: Elabora bem proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto.
  Atribui-se 120 pontos para essa competencia caso: Elabora, de forma mediana, proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto.
  Atribui-se 80 pontos para essa competencia caso: Elabora, de forma insuficiente, proposta de intervenção relacionada ao tema, ou não articulada com a discussão desenvolvida no texto.
  Atribui-se 40 pontos para essa competencia caso: Apresenta proposta de intervenção vaga, precária ou relacionada apenas ao assunto.
  Atribui-se 0 pontos para essa competencia caso: Não apresenta proposta de intervenção ou apresenta proposta não relacionada ao tema ou ao assunto

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
Titulo:
${titulo}

Texto:
${texto}
    `,
vunesp: `
Corrija a redação no padrão VUNESP.
Critérios de avaliação:
A) Tema: atende ao tema proposto? Fuga ao tema = nota 0.
B) Estrutura: avaliação do gênero dissertativo-argumentativo, coerência, argumentação e organização (introdução, desenvolvimento, conclusão). Deve haver defesa clara de um ponto de vista.
C) Língua: adequação à norma-padrão, aspectos gramaticais (concordância, regência, ortografia, pontuação) e escolha lexical.
D) Coesão: emprego de recursos coesivos (anáforas, catáforas, conectivos).
Atribua nota de 0 a 7 para cada critério A, B, C, D (total máximo 28 pontos).
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `,
fuvest: `
Corrija a redação no padrão FUVEST.
Critérios de avaliação:
A) Tema e autoria: desenvolvimento do tema com repertório, uso da coletânea, demonstração de autoria.
B) Gênero e tipo de texto: atendimento ao gênero e tipo de texto solicitados.
C) Coesão e coerência: organização do texto, progressão textual, recursos coesivos.
D) Convenções da escrita: domínio da norma-padrão, ortografia, pontuação, vocabular adequado.
Atribua nota de 0 a 12,5 para cada critério A, B, C, D (total máximo 50).
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `,
    unicamp: `
Corrija a redação no padrão UNICAMP.
Critérios de avaliação:
A) Proposta temática: atendimento ao tema e às tarefas solicitadas.
B) Gênero: representatividade do gênero discursivo solicitado.
C) Leitura: análise crítica dos textos de apoio, não apenas reprodução.
D) Articulação escrita: coesão, coerência, recursos coesivos e clareza.
Atribua nota de 0 a 3 para cada critério A, B, C, D (total máximo 12).
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `,
ita: `
Corrija a redação no padrão ITA/IME.
Critérios de avaliação:
A) Tema: atendimento ao tema proposto. Fuga total = desclassificação.
B) Tipo de texto: estrutura dissertativo-argumentativa, extensão 25-35 linhas.
C) Coerência: argumentação clara, repertório atualizado, defesa do ponto de vista.
D) Coesão: recursos coesivos, articulação entre partes do texto.
E) Modalidade escrita: norma-padrão, ortografia, concordância, pontuação.
Atribua nota de 0 a 2 para cada critério A, B, C, D, E (total máximo 10).
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "E": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `
  };

  const prompt = prompts[vestibular];

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
    console.log("[DEBUG] Response text:", response.text);

    const data = JSON.parse(response.text);

    console.log("[DEBUG] Exibindo resultado na tela...");

    let resultadoHtml = "";
    if (vestibular === "enem") {
      resultadoHtml = `
<span class="titulo-competencia">Competência 1 (Domínio da norma culta):</span>
${data.C1.nota} / 200
Motivo: ${data.C1.motivo}
<span class="titulo-competencia">Competência 2 (Compreensão do tema):</span>
${data.C2.nota} / 200
Motivo: ${data.C2.motivo}
<span class="titulo-competencia">Competência 3 (Argumentação):</span>
${data.C3.nota} / 200
Motivo: ${data.C3.motivo}
<span class="titulo-competencia">Competência 4 (Coesão):</span>
${data.C4.nota} / 200
Motivo: ${data.C4.motivo}
<span class="titulo-competencia">Competência 5 (Intervenção):</span>
${data.C5.nota} / 200
Motivo: ${data.C5.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 1000</strong>
`;
    } else if (vestibular === "vunesp") {
      resultadoHtml = `
<span class="titulo-competencia">A) Tema:</span>
${data.A.nota} / 7
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Estrutura:</span>
${data.B.nota} / 7
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Língua:</span>
${data.C.nota} / 7
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Coesão:</span>
${data.D.nota} / 7
Motivo: ${data.D.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 28</strong>
`;
    } else if (vestibular === "fuvest") {
      resultadoHtml = `
<span class="titulo-competencia">A) Tema e autoria:</span>
${data.A.nota} / 50
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Gênero e tipo:</span>
${data.B.nota} / 50
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Coesão e coerência:</span>
${data.C.nota} / 50
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Convenções da escrita:</span>
${data.D.nota} / 50
Motivo: ${data.D.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 50</strong>
`;
    } else if (vestibular === "unicamp") {
      resultadoHtml = `
<span class="titulo-competencia">A) Proposta temática:</span>
${data.A.nota} / 3
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Gênero:</span>
${data.B.nota} / 3
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Leitura:</span>
${data.C.nota} / 3
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Articulação escrita:</span>
${data.D.nota} / 3
Motivo: ${data.D.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 12</strong>
`;
    } else if (vestibular === "ita") {
      resultadoHtml = `
<span class="titulo-competencia">A) Tema:</span>
${data.A.nota} / 2
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Tipo de texto:</span>
${data.B.nota} / 2
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Coerência:</span>
${data.C.nota} / 2
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Coesão:</span>
${data.D.nota} / 2
Motivo: ${data.D.motivo}
<span class="titulo-competencia">E) Modalidade escrita:</span>
${data.E.nota} / 2
Motivo: ${data.E.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 10</strong>
`;
    }

    document.getElementById("resultado").innerHTML = resultadoHtml;
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