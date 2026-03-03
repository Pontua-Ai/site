const passwordIcons = document.querySelectorAll('.password-icon')

passwordIcons.forEach(icon => {
    icon.addEventListener('click', function(){
        const input = this.parentElement.querySelector('input');
        input.type = input.type ==='password' ? 'text' : 'password';
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    })
})