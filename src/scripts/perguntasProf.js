import { carregarMaterias, carregarConteudos } from "./genereAsk.js";

const toolbar = document.getElementById("altToolbar");
let hideTimer = null;
let altFocada = null;


const btnVisibilidade = document.getElementById("btnVisibilidade");
const visibilidadeInput = document.getElementById("visibilidade");

btnVisibilidade.addEventListener("click", () => {
    if (visibilidadeInput.value === "publico") {
        visibilidadeInput.value = "privado";
        btnVisibilidade.textContent = "Privado";
        btnVisibilidade.classList.remove("publico");
        btnVisibilidade.classList.add("privado");
    } else {
        visibilidadeInput.value = "publico";
        btnVisibilidade.textContent = "Público";
        btnVisibilidade.classList.remove("privado");
        btnVisibilidade.classList.add("publico");
    }
});

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function mostrarToolbar(altEl) {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }

    const box = altEl.closest('.boxInputs');
    if (!box) return;

    if (toolbar.parentNode !== box.parentNode) {
        box.parentNode.insertBefore(toolbar, box);
    } else if (toolbar.nextElementSibling !== box) {
        box.parentNode.insertBefore(toolbar, box);
    }

    toolbar.classList.add("visible");
}

function esconderToolbar() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        const active = document.activeElement;
        if (active && (active.closest('.textAlternativa') || active.closest('.alt-format-toolbar'))) return;
        toolbar.classList.remove("visible");
    }, 200);
}

document.querySelectorAll('.textAlternativa').forEach(textarea => {
    autoResize(textarea);
    textarea.addEventListener('input', () => autoResize(textarea));

    textarea.addEventListener('focus', () => {
        altFocada = textarea;
        mostrarToolbar(textarea);
    });

    textarea.addEventListener('blur', esconderToolbar);
});

document.querySelectorAll('.alt-tb-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const active = document.activeElement;
        let el = (active && active.closest('.textAlternativa')) || altFocada || document.querySelector('.textAlternativa');

        if (!el) return;

        el.focus();

        if (cmd === 'sqrt') {
            inserirNaAlternativa(el, '√');
        } else if (cmd === 'frac') {
            const sel = window.getSelection();
            const texto = sel.toString().trim();
            if (texto) {
                document.execCommand('insertHTML', false, `<sup>${texto.split('/')[0] || texto}</sup>&frasl;<sub>${texto.split('/')[1] || ''}</sub>`);
            } else {
                document.execCommand('insertText', false, 'a/b');
            }
        } else {
            document.execCommand(cmd, false, null);
        }

        el.dispatchEvent(new Event('input'));
    });

    btn.addEventListener('focus', () => {
        if (altFocada) mostrarToolbar(altFocada);
    });

    btn.addEventListener('blur', esconderToolbar);
});

function inserirNaAlternativa(el, char) {
    const sel = window.getSelection();
    const texto = sel.toString().trim();

    if (texto) {
        document.execCommand('insertHTML', false, char + '(' + texto + ')');
    } else {
        document.execCommand('insertText', false, char);
    }
}
