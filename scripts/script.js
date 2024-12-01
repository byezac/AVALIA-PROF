class AvaliacaoController {
    constructor() {
        this.avaliacoesGestao = this.carregarAvaliacoesGestao();
        this.setupEventListeners();
        this.db = window.db;
    }

    setupEventListeners() {
        const form = document.getElementById('avaliacaoForm');
        const submitBtn = document.getElementById('submitButton');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarAvaliacaoGestao();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.salvarAvaliacaoGestao();
            });
        }
    }

    salvarAvaliacaoGestao() {
        if (!this.db) {
            console.error("Database não inicializado!");
            Swal.fire({
                title: 'Erro!',
                text: 'Erro de conexão com o banco de dados',
                icon: 'error'
            });
            return;
        }

        const dadosGestao = {
            coordenacao: this.coletarDadosSecao('coordenador'),
            direcao: this.coletarDadosSecao('direcao'),
            vicedirecao: this.coletarDadosSecao('vicedirecao')
        };

        console.log("Dados da gestão coletados:", dadosGestao);

        if (!this.validarDadosGestao(dadosGestao)) {
            Swal.fire({
                title: 'Atenção!',
                text: 'Por favor, preencha todos os campos obrigatórios antes de enviar.',
                icon: 'warning'
            });
            return;
        }

        // Salva no localStorage para usar na avaliação dos professores
        localStorage.setItem('avaliacoesGestao', JSON.stringify(dadosGestao));

        const avaliacaoData = {
            timestamp: new Date().toISOString(),
            gestao: dadosGestao
        };

        try {
            // Salva na estrutura: avaliacoes/gestao/[TIMESTAMP]
            const gestaoRef = this.db.ref('avaliacoes/gestao').push();
            
            gestaoRef.set(avaliacaoData)
                .then(() => {
                    console.log("Avaliação da gestão salva com sucesso!");
                    Swal.fire({
                        title: 'Sucesso!',
                        text: 'Avaliação da gestão realizada com sucesso! Você será redirecionado para avaliar os professores.',
                        icon: 'success'
                    }).then(() => {
                        window.location.href = 'prof.html';
                    });
                })
                .catch((error) => {
                    console.error("Erro ao salvar gestão:", error);
                    Swal.fire({
                        title: 'Erro!',
                        text: 'Erro ao salvar: ' + error.message,
                        icon: 'error'
                    });
                });
        } catch (error) {
            console.error("Erro ao criar referência:", error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao criar referência no banco de dados',
                icon: 'error'
            });
        }
    }

    coletarDadosSecao(prefixo) {
        const dados = {};
        
        // Coleta apenas os radio buttons (avaliações)
        const radios = document.querySelectorAll(`input[type="radio"][name^="${prefixo}_"]`);
        radios.forEach(radio => {
            if (radio.checked) {
                const campo = radio.name.replace(`${prefixo}_`, '');
                dados[campo] = radio.value; // Mantém como string para compatibilidade
            }
        });
        
        // Coleta os campos de texto (opiniões) - não obrigatórios
        const textos = document.querySelectorAll(`input[type="text"][name^="${prefixo}_"]`);
        textos.forEach(input => {
            const campo = input.name.replace(`${prefixo}_`, '');
            const valor = input.value.trim();
            if (valor) { // Só inclui se tiver algum valor
                dados[campo] = valor;
            }
        });
        
        return dados;
    }

    carregarAvaliacoesGestao() {
        const avaliacoes = localStorage.getItem('avaliacoesGestao');
        console.log('Carregando avaliações da gestão:', avaliacoes);
        return avaliacoes ? JSON.parse(avaliacoes) : null;
    }

    validarDadosGestao(dados) {
        // Apenas campos de avaliação (radio buttons) são obrigatórios
        const camposObrigatorios = {
            coordenacao: ['disponibilidade', 'respeito_regras', 'pontualidade', 'relacionamento'],
            direcao: ['higiene', 'respeito_regras', 'disponibilidade', 'exposicao', 'confiabilidade', 
                     'responsabilidade', 'etica', 'relacionamento'],
            vicedirecao: ['respeito_regras', 'disponibilidade', 'relacionamento']
        };

        // Verifica cada seção
        for (const [secao, campos] of Object.entries(camposObrigatorios)) {
            const dadosSecao = dados[secao];
            
            console.log(`\nValidando seção ${secao}:`);
            console.log('Dados da seção:', dadosSecao);
            
            // Verifica apenas os campos de avaliação obrigatórios
            for (const campo of campos) {
                const valor = dadosSecao[campo];
                console.log(`Campo ${campo}: ${valor}`);
                
                if (!valor || valor === '') {
                    console.log(`Campo de avaliação não preenchido: ${campo}`);
                    return false;
                }
            }
        }

        return true;
    }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new AvaliacaoController();
});