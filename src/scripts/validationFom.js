const passwordIcons = document.querySelectorAll('.password-icon')

passwordIcons.forEach(icon => {
    icon.addEventListener('click', function(){
        const input = this.parentElement.querySelector('input');
        input.type = input.type ==='password' ? 'text' : 'password';
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    })
})

function initPasswordCriteria(inputId) {
    const input = document.getElementById(inputId);
    const criteriaList = document.getElementById('passwordCriteria');
    if (!input || !criteriaList) return;

    input.addEventListener('focus', () => {
        criteriaList.classList.add('visible');
    });

    input.addEventListener('blur', () => {
        criteriaList.classList.remove('visible');
    });

    input.addEventListener('input', () => {
        const senha = input.value;

        document.getElementById('critMinimo').classList.toggle('valido', senha.length >= 8);
        document.getElementById('critMaiuscula').classList.toggle('valido', /[A-Z]/.test(senha));
        document.getElementById('critMinuscula').classList.toggle('valido', /[a-z]/.test(senha));
        document.getElementById('critNumero').classList.toggle('valido', /[0-9]/.test(senha));
        document.getElementById('critEspecial').classList.toggle('valido', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha));
    });
}

initPasswordCriteria('senha');
initPasswordCriteria('novaSenha');