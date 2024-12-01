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
        
        const db = firebase.database();
        window.db = db;

        // Teste de escrita
        const testRef = db.ref('test');
        testRef.set({
            test: true,
            timestamp: new Date().toISOString()
        })
        .then(() => {
            console.log("Teste de escrita no Firebase bem-sucedido");
        })
        .catch((error) => {
            console.error("Erro no teste de escrita:", error);
        });

    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
    }
});
