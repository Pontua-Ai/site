import { initTheme } from "./theme.js";
import { reenviarConfirmacao } from "./auth.js";
import { toast } from "./utils.js";

initTheme();

const params = new URLSearchParams(window.location.search);
const email = params.get("email");

if (email) {
    document.getElementById("emailDisplay").textContent = email;
}

const linkReenviar = document.getElementById("linkReenviar");
if (linkReenviar) {
    linkReenviar.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!email) {
            toast("Email não encontrado.", "error");
            return;
        }

        linkReenviar.textContent = "Enviando...";
        linkReenviar.style.pointerEvents = "none";

        const result = await reenviarConfirmacao(email);

        if (result.success) {
            toast("Email reenviado com sucesso! Verifique sua caixa de entrada.", "success");
        } else {
            toast(result.error, "error");
        }

        linkReenviar.textContent = "Reenviar";
        linkReenviar.style.pointerEvents = "auto";
    });
}
