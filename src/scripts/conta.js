import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

export function initDadosConta() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    
    if (!userLogado) {
        window.location.href = "inicio.html";
        return;
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