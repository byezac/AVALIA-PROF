document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;

    // Credenciais do admin master
    const masterAdmin = {
        user: 'master',
        pass: 'master@2024#feira'
    };

    // Credenciais dos cursos
    const credentials = {
        'administracao': { user: 'adm', pass: 'adm@2024' },
        'agricultura': { user: 'agri', pass: 'agri@2024' },
        'agroindustria': { user: 'agroind', pass: 'agroind@2024' },
        'agropecuaria': { user: 'agrop', pass: 'agrop@2024' },
        'mineracao': { user: 'min', pass: 'min@2024' },
        'multimidia': { user: 'multi', pass: 'multi@2024' },
        'recursoshumanos': { user: 'rh', pass: 'rh@2024' },
        'programacao': { user: 'prog', pass: 'prog@2024' }
    };

    // Verifica primeiro se é admin master
    if (username === masterAdmin.user && password === masterAdmin.pass) {
        Swal.fire({
            title: 'Sucesso!',
            text: 'Login realizado com sucesso!',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false,
            position: 'center'
        }).then(() => {
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('userCourse', 'master');
            sessionStorage.setItem('isMaster', 'true');
            window.location.href = 'admin.html';
        });
        return;
    }

    // Verifica credenciais dos cursos
    let isValid = false;
    let userCourse = '';

    for (const [course, cred] of Object.entries(credentials)) {
        if (username === cred.user && password === cred.pass) {
            isValid = true;
            userCourse = course;
            break;
        }
    }

    if (isValid) {
        Swal.fire({
            title: 'Sucesso!',
            text: 'Login realizado com sucesso!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            position: 'center'
        }).then(() => {
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('userCourse', userCourse);
            sessionStorage.setItem('isMaster', 'false');
            window.location.href = 'admin.html';
        });
    } else {
        Swal.fire({
            title: 'Erro!',
            text: 'Credenciais inválidas!',
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            position: 'center'
        });
    }
});

// Adicionar evento para mostrar/ocultar senha
document.getElementById('showPassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}
