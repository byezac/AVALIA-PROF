document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
            apiKey: "AIzaSyClZ6rmkBhomtbWlKIduUrcUddbBXnUAtk",
            authDomain: "avalia-eetepa.firebaseapp.com",
            databaseURL: "https://avalia-eetepa-default-rtdb.firebaseio.com",
            projectId: "avalia-eetepa",
            storageBucket: "avalia-eetepa.firebasestorage.app",
            messagingSenderId: "64803456634",
            appId: "1:64803456634:web:95b40112477142f7ce5dc3",
            measurementId: "G-K9K9ZGC3J5"
    };

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase inicializado com sucesso");
        }
        
        window.db = firebase.database();
        
        // Teste de conexão
        const avaliacoesRef = window.db.ref('avaliacoes');
        avaliacoesRef.once('value')
            .then((snapshot) => {
                console.log("Conexão com Firebase bem-sucedida");
                console.log("Dados disponíveis:", snapshot.exists());
                if (snapshot.exists()) {
                    console.log("Número de avaliações:", Object.keys(snapshot.val()).length);
                }
            })
            .catch((error) => {
                console.error("Erro ao acessar dados:", error);
            });

    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
    }
});
