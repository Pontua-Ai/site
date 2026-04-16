import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

const materiaMap = {
    matematica: "Matemática",
    portugues: "Português",
    fisica: "Física",
    quimica: "Química",
    biologia: "Biologia",
    historia: "História",
    geografia: "Geografia",
    ingles: "Inglês",
    artes: "Artes",
    espanhol: "Espanhol",
    filosofia: "Filosofia",
    sociologia: "Sociologia"
};

const materiaIds = Object.keys(materiaMap);

document.querySelectorAll('.subjects-button.checkbox').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (btn.id === 'provaGeral') {
            window.location.href = `perguntas.html?provaGeral=true`;
            return;
        }

        if (btn.id === 'simulado') {
            window.location.href = `perguntas.html?simulado=true`;
            return;
        }

        const nomeMateria = materiaMap[btn.id];
        if (!nomeMateria) return;

        const { data: materia } = await supabaseClient
            .from("materia")
            .select("id_materia")
            .ilike("nome_materia", nomeMateria)
            .single();

        if (!materia) {
            toast("Matéria não encontrada", "error");
            return;
        }

        window.location.href = `perguntas.html?materia=${materia.id_materia}`;
    });
});