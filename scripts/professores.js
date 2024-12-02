class ProfessorController {
    constructor() {
        this.setupProfessores();
        this.setupEventListeners();
        this.verificarAvaliacaoGestao();
        this.db = window.db;
    }

    verificarAvaliacaoGestao() {
        const avaliacoesGestao = localStorage.getItem('avaliacoesGestao');
        if (!avaliacoesGestao) {
            // Se não tiver avaliado a gestão, volta para a página inicial
            Swal.fire({
                title: 'Atenção!',
                text: 'Você precisa avaliar a gestão primeiro.',
                icon: 'warning'
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    }

    setupEventListeners() {
        const form = document.getElementById('avaliacaoProfessorForm');
        const turmaSelect = document.getElementById('turma');
        const submitBtn = document.getElementById('submitButton');

        if (turmaSelect) {
            turmaSelect.addEventListener('change', (e) => {
                this.atualizarProfessores(e.target.value);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarAvaliacaoProfessor();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.salvarAvaliacaoProfessor();
            });
        }
    }

    setupProfessores() {
        this.professoresInfo = {
            'anderson': { id: 'prof_anderson', nome: 'ANDERSON' },
            'antonia': { id: 'prof_antonia', nome: 'ANTONIA' },
            'ayslan': { id: 'prof_ayslan', nome: 'AYSLAN' },
            'bruno': { id: 'prof_bruno', nome: 'BRUNO' },
            'camila': { id: 'prof_camila', nome: 'CAMILA' },
            'erica': { id: 'prof_erica', nome: 'ERICA' },
            'ernandes': { id: 'prof_ernandes', nome: 'ERNANDES' },
            'fabricio': { id: 'prof_fabricio', nome: 'FABRICIO' },
            'isabel': { id: 'prof_isabel', nome: 'ISABEL' },
            'jacimaria': { id: 'prof_jacimaria', nome: 'JACIMARIA' },
            'jhayson': { id: 'prof_jhayson', nome: 'JHAYSON' },
            'josue': { id: 'prof_josue', nome: 'JOSUE' },
            'klayton': { id: 'prof_klayton', nome: 'KLAYTON' },
            'laissy': { id: 'prof_laissy', nome: 'LAISSY' },
            'leo_cruz': { id: 'prof_leo_cruz', nome: 'LEO CRUZ' },
            'luciano': { id: 'prof_luciano', nome: 'LUCIANO' },
            'ludmilla': { id: 'prof_ludmilla', nome: 'LUDMILLA' },
            'maria_sinaria': { id: 'prof_maria_sinaria', nome: 'MARIA SINARIA' },
            'maryelle': { id: 'prof_maryelle', nome: 'MARYELLE' },
            'mateus': { id: 'prof_mateus', nome: 'MATEUS' },
            'neli': { id: 'prof_neli', nome: 'NELI' },
            'paulo_henrique': { id: 'prof_paulo_henrique', nome: 'PAULO HENRIQUE' },
            'renata': { id: 'prof_renata', nome: 'RENATA' },
            'rogerio': { id: 'prof_rogerio', nome: 'ROGERIO' },
            'sinaria': { id: 'prof_sinaria', nome: 'SINARIA' }
        };

        this.professoresPorTurma = {
            // 1° ANO - MANHÃ
            'adm1m': ['ayslan', 'bruno', 'camila', 'fabricio', 'isabel', 'jacimaria', 'josue', 'klayton', 'ludmilla', 'maryelle', 'paulo_henrique', 'renata', 'rogerio'],
            'agro1m': ['ayslan', 'bruno', 'camila', 'isabel', 'jacimaria', 'klayton', 'ludmilla', 'maryelle', 'mateus', 'rogerio', 'sinaria'],
            'agrop1m': ['ayslan', 'bruno', 'camila', 'erica', 'fabricio', 'isabel', 'jacimaria', 'klayton', 'laissy', 'maria_sinaria', 'mateus', 'rogerio', 'sinaria'],
            'mult1m': ['ayslan', 'bruno', 'camila', 'ernandes', 'fabricio', 'isabel', 'klayton', 'ludmilla', 'paulo_henrique', 'renata', 'rogerio', 'sinaria'],

            // 1° ANO - TARDE
            'agri1t': ['antonia', 'ayslan', 'camila', 'erica', 'fabricio', 'jacimaria', 'klayton', 'laissy', 'luciano', 'maryelle', 'neli', 'sinaria'],
            'jogos1t': ['anderson', 'antonia', 'ayslan', 'camila', 'erica', 'fabricio', 'klayton', 'laissy', 'leo_cruz', 'luciano', 'neli'],
            'rh1t': ['anderson', 'antonia', 'ayslan', 'camila', 'erica', 'fabricio', 'jacimaria', 'josue', 'klayton', 'laissy', 'luciano', 'neli', 'renata'],

            // 2° ANO - MANHÃ
            'agri2m': ['ayslan', 'bruno', 'camila', 'erica', 'fabricio', 'isabel', 'jacimaria', 'klayton', 'laissy', 'leo_cruz', 'maryelle', 'mateus', 'rogerio', 'sinaria'],
            'jogos2m': ['anderson', 'bruno', 'camila', 'erica', 'fabricio', 'isabel', 'klayton', 'laissy', 'leo_cruz', 'rogerio'],
            'min2m': ['ayslan', 'bruno', 'camila', 'erica', 'fabricio', 'isabel', 'jacimaria', 'jhayson', 'klayton', 'laissy', 'leo_cruz', 'rogerio'],
            'rh2m': ['ayslan', 'bruno', 'camila', 'erica', 'fabricio', 'isabel', 'jacimaria', 'josue', 'klayton', 'laissy', 'leo_cruz', 'rogerio'],

            // 2° ANO - TARDE
            'agro2t': ['antonia', 'ayslan', 'camila', 'fabricio', 'jacimaria', 'klayton', 'laissy', 'leo_cruz', 'luciano', 'ludmilla', 'maryelle', 'neli'],
            'agrop2t': ['antonia', 'camila', 'fabricio', 'jacimaria', 'klayton', 'laissy', 'leo_cruz', 'luciano', 'mateus', 'neli', 'sinaria'],
            'mult2t': ['antonia', 'camila', 'ernandes', 'fabricio', 'jacimaria', 'klayton', 'laissy', 'leo_cruz', 'luciano', 'neli', 'renata']
        };
    }

    atualizarProfessores(turma) {
        const professoresSelect = document.getElementById('avaliado');
        professoresSelect.innerHTML = '<option value="">Selecione um professor</option>';
        
        if (this.professoresPorTurma[turma]) {
            // Obtém os professores da turma e suas informações completas
            const professoresDaTurma = this.professoresPorTurma[turma]
                .map(codigo => ({
                    codigo,
                    ...this.professoresInfo[codigo]
                }))
                .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena por nome
            
            professoresDaTurma.forEach(professor => {
                const option = document.createElement('option');
                option.value = professor.id; // Usa o ID único do professor
                option.textContent = professor.nome; // Usa o nome formatado
                professoresSelect.appendChild(option);
            });
            professoresSelect.disabled = false;
        } else {
            professoresSelect.disabled = true;
        }
    }

    salvarAvaliacaoProfessor() {
        const turma = document.getElementById('turma').value;
        const professorSelect = document.getElementById('avaliado');
        const professorId = professorSelect.value;
        const professorNome = professorSelect.options[professorSelect.selectedIndex].text;
        
        if (!turma || !professorId) {
            Swal.fire({
                title: 'Atenção!',
                text: 'Por favor, selecione a turma e o professor antes de enviar.',
                icon: 'warning'
            });
            return;
        }

        const dadosProfessor = this.coletarDadosProfessor();
        if (!this.validarDadosProfessor(dadosProfessor)) {
            Swal.fire({
                title: 'Atenção!',
                text: 'Por favor, preencha todos os campos de avaliação do professor.',
                icon: 'warning'
            });
            return;
        }

        // Recupera os dados da gestão do localStorage
        const dadosGestao = JSON.parse(localStorage.getItem('avaliacoesGestao'));

        // Estrutura organizada dos dados
        const avaliacaoData = {
            timestamp: new Date().toISOString(),
            turma: {
                codigo: turma,
                periodo: this.getPeriodo(turma),
                ano: this.getAno(turma)
            },
            professor: {
                id: professorId,
                nome: professorNome
            },
            avaliacoes: {
                professor: dadosProfessor,
                gestao: dadosGestao
            }
        };

        console.log("Dados a serem salvos:", avaliacaoData);

        // Vamos tentar salvar diretamente na raiz do Firebase
        const dbRef = firebase.database().ref();
        
        dbRef.child('avaliacoes').push(avaliacaoData)
            .then(() => {
                console.log("Dados enviados com sucesso para o Firebase!");
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Avaliação enviada com sucesso! Deseja avaliar outro professor?',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Sim',
                    cancelButtonText: 'Não'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Apenas reseta o formulário mantendo a turma selecionada
                        const turmaAtual = document.getElementById('turma').value;
                        document.getElementById('avaliacaoProfessorForm').reset();
                        document.getElementById('turma').value = turmaAtual;
                        this.atualizarProfessores(turmaAtual);
                    } else {
                        // Se clicar em "Não", volta para a página inicial
                        window.location.href = 'index.html';
                    }
                });
            })
            .catch((error) => {
                console.error("Erro ao enviar para o Firebase:", error);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Erro ao salvar no Firebase: ' + error.message,
                    icon: 'error'
                });
            });
    }

    coletarDadosProfessor() {
        const dados = {};
        const radios = document.querySelectorAll('input[type="radio"][name^="professor_"]:checked');
        radios.forEach(radio => {
            const campo = radio.name.replace('professor_', '');
            dados[campo] = radio.value;
        });
        return dados;
    }

    validarDadosProfessor(dados) {
        const camposObrigatorios = [
            'didatica',
            'relacionamento',
            'assiduidade',
            'pontualidade',
            'respeito_regras',
            'atividades_interessantes',
            'seguranca_conteudos',
            'linguagem_adequada',
            'respeito_alunos',
            'gosta_aulas'
        ];

        return camposObrigatorios.every(campo => dados.hasOwnProperty(campo));
    }

    getPeriodo(turma) {
        return turma.endsWith('m') ? 'Manhã' : 'Tarde';
    }

    getAno(turma) {
        return turma.includes('1') ? '1° Ano' : '2° Ano';
    }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ProfessorController();
});
