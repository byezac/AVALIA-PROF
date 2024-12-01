function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    
    if (!isAuthenticated) {
        window.location.href = 'login.html';
    }
}

// Verifica autenticação quando a página carrega
checkAuth();

// Adiciona função de logout
function logout() {
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = 'login.html';
} 