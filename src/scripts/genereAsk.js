import supabaseClient from "./supabase.js";

function getUserId() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.id_usuario || null;
}

function isProfessor() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.tipo_conta === 'professor';
}

export async function carregarMaterias() {
    const select = document.getElementById("materia");
    if (select.dataset.loaded === "true") return;
    
    let query = supabaseClient
        .from("materia")
        .select("id_materia, nome_materia");
    
    if (isProfessor()) {
        query = query.or(`id_usuario.is.null,id_usuario.eq.${getUserId()}`);
        const { data: ocultas } = await supabaseClient
            .from("materia_oculta")
            .select("id_materia")
            .eq("id_usuario", getUserId());
        const idsOcultas = (ocultas || []).map(o => o.id_materia);
        if (idsOcultas.length > 0) {
            query = query.not('id_materia', 'in', `(${idsOcultas.join(',')})`);
        }
    }
    
    const { data, error } = await query;
    if (error) {
        console.error("Erro:", error);
        return;
    }
    
    select.dataset.loaded = "true";
    select.innerHTML = '<option disabled selected hidden value="">Máteria</option>';
    
    const materiasUnicas = {};
    data.forEach(materia => {
        if (!materiasUnicas[materia.nome_materia]) {
            materiasUnicas[materia.nome_materia] = materia;
        }
    });
    
    Object.values(materiasUnicas).forEach(materia => {
        const option = document.createElement("option");
        option.value = materia.id_materia;
        option.textContent = materia.nome_materia;
        select.appendChild(option);
    });
};

if(document.getElementById("materia")){
    carregarMaterias().then(() => {
        $('#materia').select2({
            minimumResultsForSearch: 0,
            language: {
                noResults: function() {
                    return "Nenhuma matéria encontrada";
                }
            }
        });
        $('#conteudo').select2({
            minimumResultsForSearch: 0,
            language: {
                noResults: function() {
                    return "Nenhum conteúdo encontrado";
                }
            }
        });
        $('#materia').on('change', function() {
            carregarConteudos();
        });
    });
};

export async function carregarConteudos() {
    const idMateria = document.getElementById("materia").value;
    if (!idMateria) return;

    let query = supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria);
    
    if (isProfessor()) {
        query = query.or(`id_usuario.is.null,id_usuario.eq.${getUserId()}`);
        const userId = getUserId();
        const { data: ocultos } = await supabaseClient
            .from("conteudo_oculto")
            .select("id_conteudo")
            .eq("id_usuario", userId);
        const idsOcultos = (ocultos || []).map(o => o.id_conteudo);
        const { data: materiasOcultas } = await supabaseClient
            .from("materia_oculta")
            .select("id_materia")
            .eq("id_usuario", userId);
        const idsMateriasOcultas = (materiasOcultas || []).map(m => m.id_materia);
        if (idsMateriasOcultas.length > 0) {
            const { data: conteudosDasMaterias } = await supabaseClient
                .from("conteudo")
                .select("id_conteudo")
                .in("id_materia", idsMateriasOcultas);
            if (conteudosDasMaterias) {
                conteudosDasMaterias.forEach(c => {
                    if (!idsOcultos.includes(c.id_conteudo)) {
                        idsOcultos.push(c.id_conteudo);
                    }
                });
            }
        }
        if (idsOcultos.length > 0) {
            query = query.not('id_conteudo', 'in', `(${idsOcultos.join(',')})`);
        }
    }
    
    const { data, error } = await query;
    if (error) {
        console.error("Erro:", error);
        return;
    }
    const select = document.getElementById("conteudo");
    select.innerHTML = '';
    data.forEach(conteudo => {
        const option = document.createElement("option");
        option.value = conteudo.id_conteudo;
        option.textContent = conteudo.nome_conteudo;
        select.appendChild(option);
    });
    $('#conteudo').select2({
        minimumResultsForSearch: Infinity
    });
}
