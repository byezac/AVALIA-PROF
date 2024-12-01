class DashboardController {
    constructor() {
        this.initFirebase();
        this.charts = {};
        this.setupEventListeners();
        this.loadInitialData();
    }

    initFirebase() {
        try {
            this.db = firebase.database();
            console.log('Firebase inicializado');
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
        }
    }

    setupEventListeners() {
        // Navegação do menu
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.changePage(page);
            });
        });
    }

    changePage(page) {
        // Remove active de todos os itens e views
        document.querySelectorAll('.nav-item').forEach(item => 
            item.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => 
            view.classList.remove('active'));

        // Adiciona active ao item e view selecionados
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        document.getElementById(`${page}-view`)?.classList.add('active');

        // Carrega os dados da página
        this.loadPageData(page);
    }

    async loadInitialData() {
        try {
            console.log('Iniciando carregamento de dados...');
            
            // Referência para 'avaliacoes' no Firebase
            const avaliacoesRef = this.db.ref('avaliacoes');
            
            // Adiciona listener para mudanças em tempo real
            avaliacoesRef.on('value', (snapshot) => {
                console.log('Dados recebidos do Firebase');
                const avaliacoes = snapshot.val();
                
                if (!avaliacoes) {
                    console.log('Nenhuma avaliação encontrada no banco');
                    return;
                }

                console.log('Dados das avaliações:', avaliacoes);
                
                // Processa os dados
                const stats = this.calculateDashboardStats(avaliacoes);
                console.log('Estatísticas calculadas:', stats);
                
                // Atualiza a interface
                this.updateDashboardUI(stats);
                
                // Inicializa/Atualiza os gráficos
                if (!this.charts.evolucao) {
                    this.initCharts(); // Inicializa os gráficos se ainda não existirem
                }
                this.updateAllCharts(avaliacoes);
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    updateAllCharts(avaliacoes) {
        console.log('Atualizando todos os gráficos...');
        
        // Atualiza gráfico de evolução
        if (this.charts.evolucao) {
            const dadosEvolucao = this.prepararDadosEvolucao(avaliacoes);
            this.charts.evolucao.data.labels = dadosEvolucao.labels;
            this.charts.evolucao.data.datasets[0].data = dadosEvolucao.dados;
            this.charts.evolucao.update();
        }

        // Atualiza gráfico de distribuição de notas
        if (this.charts.notas) {
            const dadosNotas = this.prepararDadosNotas(avaliacoes);
            this.charts.notas.data.datasets[0].data = dadosNotas;
            this.charts.notas.update();
        }

        // Atualiza gráfico de turmas
        if (this.charts.turmas) {
            const dadosTurmas = this.prepararDadosTurmas(avaliacoes);
            this.charts.turmas.data.labels = dadosTurmas.labels;
            this.charts.turmas.data.datasets[0].data = dadosTurmas.dados;
            this.charts.turmas.update();
        }
    }

    prepararDadosEvolucao(avaliacoes) {
        console.log('Preparando dados de evolução...', avaliacoes);
        const avaliacoesPorData = {};
        
        Object.values(avaliacoes).forEach(av => {
            if (!av.timestamp) return;
            
            const data = new Date(av.timestamp).toLocaleDateString('pt-BR');
            if (!avaliacoesPorData[data]) {
                avaliacoesPorData[data] = {
                    soma: 0,
                    count: 0
                };
            }
            
            if (av.notas) {
                const notas = Object.values(av.notas).map(Number);
                if (notas.length > 0) {
                    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
                    avaliacoesPorData[data].soma += media;
                    avaliacoesPorData[data].count++;
                }
            }
        });

        const labels = Object.keys(avaliacoesPorData).sort((a, b) => 
            new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))
        );
        
        const dados = labels.map(data => {
            const mediaData = avaliacoesPorData[data].soma / avaliacoesPorData[data].count;
            return Number(mediaData.toFixed(2));
        });

        console.log('Dados de evolução processados:', { labels, dados });
        return { labels, dados };
    }

    prepararDadosNotas(avaliacoes) {
        console.log('Preparando dados de notas...', avaliacoes);
        const distribuicao = [0, 0, 0, 0, 0]; // Para notas de 1 a 5
        
        Object.values(avaliacoes).forEach(av => {
            if (av.notas) {
                Object.values(av.notas).forEach(nota => {
                    const notaNum = Math.round(Number(nota));
                    if (notaNum >= 1 && notaNum <= 5) {
                        distribuicao[notaNum - 1]++;
                    }
                });
            }
        });

        console.log('Distribuição de notas:', distribuicao);
        return distribuicao;
    }

    prepararDadosTurmas(avaliacoes) {
        console.log('Preparando dados de turmas...', avaliacoes);
        const turmasCount = {};
        
        Object.values(avaliacoes).forEach(av => {
            if (av.turma) {
                // Formata o nome da turma usando as propriedades disponíveis
                const nomeTurma = `${av.turma.ano} ${av.turma.codigo} - ${av.turma.periodo}`;
                turmasCount[nomeTurma] = (turmasCount[nomeTurma] || 0) + 1;
            }
        });

        const result = {
            labels: Object.keys(turmasCount),
            dados: Object.values(turmasCount)
        };
        
        console.log('Dados de turmas processados:', result);
        return result;
    }

    updateDashboardUI(stats) {
        console.log('Atualizando UI com stats:', stats);
        
        // Atualiza os elementos do DOM com os dados calculados
        const elements = {
            'total-avaliacoes': stats.totalAvaliacoes || 0,
            'media-geral': (stats.mediaGeral || 0).toFixed(1),
            'melhor-professor': stats.melhorProfessor?.nome || '-',
            'melhor-professor-media': (stats.melhorProfessor?.media || 0).toFixed(1),
            'ultima-avaliacao': stats.ultimaAvaliacao || '-'
        };

        // Atualiza cada elemento se ele existir
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`Atualizando elemento ${id} com valor:`, value);
            } else {
                console.warn(`Elemento com id '${id}' não encontrado`);
            }
        });
    }

    async loadPageData(page) {
        const avaliacoes = await this.db.ref('avaliacoes').once('value').then(snap => snap.val());
        
        switch(page) {
            case 'dashboard':
                this.updateDashboard(avaliacoes);
                break;
            case 'professores':
                this.showProfessores(avaliacoes);
                break;
            case 'turmas':
                this.showTurmas(avaliacoes);
                break;
            case 'avaliacoes':
                this.showAvaliacoes(avaliacoes);
                break;
        }
    }

    updateDashboard(avaliacoes) {
        if (!avaliacoes) return;

        // Atualiza cards de estatísticas
        const totalAvaliacoes = Object.keys(avaliacoes).length;
        document.getElementById('total-avaliacoes').textContent = totalAvaliacoes;

        // Calcula média geral
        let somaTotal = 0;
        let countNotas = 0;
        Object.values(avaliacoes).forEach(av => {
            if (av.notas) {
                const notas = Object.values(av.notas).map(Number);
                somaTotal += notas.reduce((a, b) => a + b, 0);
                countNotas += notas.length;
            }
        });
        const mediaGeral = countNotas > 0 ? (somaTotal / countNotas).toFixed(1) : '0.0';
        document.getElementById('media-geral').textContent = mediaGeral;

        // Atualiza os gráficos
        this.updateEvolucaoChart(avaliacoes);
        this.updateDistribuicaoChart(avaliacoes);
        this.updateTurmasChart(avaliacoes);
    }

    updateEvolucaoChart(avaliacoes) {
        if (!this.charts.evolucao) return;

        // Agrupa avaliações por data
        const avaliacoesPorData = {};
        Object.values(avaliacoes).forEach(av => {
            if (!av.timestamp) return;
            const data = new Date(av.timestamp).toLocaleDateString('pt-BR');
            if (!avaliacoesPorData[data]) {
                avaliacoesPorData[data] = {
                    soma: 0,
                    count: 0
                };
            }
            
            if (av.notas) {
                const notas = Object.values(av.notas).map(Number);
                avaliacoesPorData[data].soma += notas.reduce((a, b) => a + b, 0) / notas.length;
                avaliacoesPorData[data].count++;
            }
        });

        // Prepara dados para o gráfico
        const labels = Object.keys(avaliacoesPorData).sort();
        const data = labels.map(data => 
            avaliacoesPorData[data].soma / avaliacoesPorData[data].count
        );

        // Atualiza o gráfico
        this.charts.evolucao.data.labels = labels;
        this.charts.evolucao.data.datasets[0].data = data;
        this.charts.evolucao.update();
    }

    updateDistribuicaoChart(avaliacoes) {
        if (!this.charts.notas) return;

        // Conta a frequência de cada nota
        const distribuicao = [0, 0, 0, 0, 0]; // Para notas de 1 a 5
        Object.values(avaliacoes).forEach(av => {
            if (av.notas) {
                Object.values(av.notas).forEach(nota => {
                    const notaNum = Math.round(Number(nota));
                    if (notaNum >= 1 && notaNum <= 5) {
                        distribuicao[notaNum - 1]++;
                    }
                });
            }
        });

        // Atualiza o gráfico
        this.charts.notas.data.datasets[0].data = distribuicao;
        this.charts.notas.update();
    }

    updateTurmasChart(avaliacoes) {
        if (!this.charts.turmas) return;

        // Conta avaliações por turma
        const turmasCount = {};
        Object.values(avaliacoes).forEach(av => {
            if (av.turma) {
                turmasCount[av.turma] = (turmasCount[av.turma] || 0) + 1;
            }
        });

        // Prepara dados para o gráfico
        const labels = Object.keys(turmasCount);
        const data = Object.values(turmasCount);

        // Atualiza o gráfico
        this.charts.turmas.data.labels = labels;
        this.charts.turmas.data.datasets[0].data = data;
        this.charts.turmas.update();
    }

    showProfessores(avaliacoes) {
        if (!avaliacoes) return;

        const professoresContainer = document.getElementById('professores-list');
        professoresContainer.innerHTML = '';

        const profData = {};
        Object.values(avaliacoes).forEach(av => {
            if (!av.professor?.nome) return;
            
            // Formata o nome da turma
            const turmaNome = av.turma ? 
                `${av.turma.ano} ${av.turma.codigo} - ${av.turma.periodo}` : 
                'Sem turma';
            
            if (!profData[av.professor.nome]) {
                profData[av.professor.nome] = {
                    avaliacoes: [],
                    turmas: new Set(),
                    totalAvaliacoes: 0
                };
            }
            profData[av.professor.nome].avaliacoes.push({
                ...av,
                turmaNome // Usa o nome formatado da turma
            });
            profData[av.professor.nome].turmas.add(turmaNome);
            profData[av.professor.nome].totalAvaliacoes++;
        });

        // Cria cards dos professores
        Object.entries(profData).forEach(([nome, dados]) => {
            const card = document.createElement('div');
            card.className = 'professor-card';
            card.innerHTML = `
                <h3>${nome}</h3>
                <p>Total de avaliações: ${dados.totalAvaliacoes}</p>
                <p>Turmas: ${Array.from(dados.turmas).join(', ')}</p>
                <button onclick="dashboard.verDetalhesProfessor('${nome}')">
                    Ver Detalhes
                </button>
            `;
            professoresContainer.appendChild(card);
        });
    }

    showTurmas(avaliacoes) {
        if (!avaliacoes) return;

        const turmasContainer = document.getElementById('turmas-list');
        turmasContainer.innerHTML = '';

        const turmasData = {};
        Object.values(avaliacoes).forEach(av => {
            if (!av.turma) return;
            
            // Formata o nome da turma
            const turmaNome = `${av.turma.ano} ${av.turma.codigo} - ${av.turma.periodo}`;
            
            if (!turmasData[turmaNome]) {
                turmasData[turmaNome] = {
                    avaliacoes: [],
                    totalAvaliacoes: 0,
                    turmaObj: av.turma // Guarda o objeto original da turma
                };
            }
            turmasData[turmaNome].avaliacoes.push(av);
            turmasData[turmaNome].totalAvaliacoes++;
        });

        Object.entries(turmasData).forEach(([turmaNome, dados]) => {
            const card = document.createElement('div');
            card.className = 'turma-card';
            card.innerHTML = `
                <h3>${turmaNome}</h3>
                <p>Total de avaliações: ${dados.totalAvaliacoes}</p>
                <button onclick="dashboard.verDetalhesTurma('${dados.turmaObj.codigo}')">
                    Ver Detalhes
                </button>
            `;
            turmasContainer.appendChild(card);
        });
    }

    showAvaliacoes(avaliacoes) {
        if (!avaliacoes) return;

        const avaliacoesContainer = document.getElementById('avaliacoes-list');
        avaliacoesContainer.innerHTML = ''; // Limpa o container

        Object.entries(avaliacoes).forEach(([id, av]) => {
            const card = document.createElement('div');
            card.className = 'avaliacao-card';
            card.innerHTML = `
                <h3>Professor: ${av.professor?.nome || 'N/A'}</h3>
                <p>Turma: ${av.turma || 'N/A'}</p>
                <p>Data: ${new Date(av.timestamp).toLocaleDateString('pt-BR')}</p>
            `;
            avaliacoesContainer.appendChild(card);
        });
    }

    verDetalhesProfessor(nome) {
        console.log('Ver detalhes do professor:', nome);
        // Implementar visualização detalhada
    }

    verDetalhesTurma(turma) {
        console.log('Ver detalhes da turma:', turma);
        // Implementar visualiza��ão detalhada
    }

    initCharts() {
        // Gráfico de Evolução
        const ctxEvolucao = document.getElementById('evolucao-chart')?.getContext('2d');
        if (ctxEvolucao) {
            this.charts.evolucao = new Chart(ctxEvolucao, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Média das Avaliações',
                        data: [],
                        borderColor: '#4361ee',
                        backgroundColor: '#4361ee',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                stepSize: 0.5
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
        }

        // Gráfico de Distribuição de Notas
        const ctxNotas = document.getElementById('notas-chart')?.getContext('2d');
        if (ctxNotas) {
            this.charts.notas = new Chart(ctxNotas, {
                type: 'bar',
                data: {
                    labels: ['1', '2', '3', '4', '5'],
                    datasets: [{
                        label: 'Quantidade de Avaliações',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: '#4361ee'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Gráfico de Turmas
        const ctxTurmas = document.getElementById('turmas-chart')?.getContext('2d');
        if (ctxTurmas) {
            this.charts.turmas = new Chart(ctxTurmas, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#4361ee',
                            '#3f37c9',
                            '#3a0ca3',
                            '#480ca8',
                            '#560bad',
                            '#7209b7',
                            '#b5179e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
        }
    }

    updateDashboardStats(avaliacoes) {
        const stats = this.calculateDashboardStats(avaliacoes);
        
        // Atualiza Total de Avaliações
        const totalElement = document.querySelector('.stat-card:nth-child(1) h2');
        if (totalElement) totalElement.textContent = stats.totalAvaliacoes;
        
        // Atualiza Média Geral
        const mediaElement = document.querySelector('.stat-card:nth-child(2) h2');
        if (mediaElement) mediaElement.textContent = stats.mediaGeral.toFixed(1);
        
        // Atualiza Melhor Professor
        const profElement = document.querySelector('.stat-card:nth-child(3)');
        if (profElement) {
            const nomeElement = profElement.querySelector('h2');
            const mediaElement = profElement.querySelector('.stat-change');
            if (nomeElement) nomeElement.textContent = stats.melhorProfessor.nome || '-';
            if (mediaElement) mediaElement.textContent = `Média: ${stats.melhorProfessor.media.toFixed(1)}`;
        }
        
        // Atualiza Última Avaliação
        const dataElement = document.querySelector('.stat-card:nth-child(4) h2');
        if (dataElement) {
            const data = stats.ultimaAvaliacao !== '-' ? 
                new Date(stats.ultimaAvaliacao).toLocaleDateString('pt-BR') : 
                '00/00/0000';
            dataElement.textContent = data;
        }
    }

    calculateDashboardStats(avaliacoes) {
        const avaliacoesArray = Object.values(avaliacoes);
        let melhorProfessor = { nome: '-', media: 0 };
        let ultimaAvaliacao = '-';
        let mediaGeral = 0;
        
        // Processamento dos professores
        const professoresStats = {};
        
        avaliacoesArray.forEach(av => {
            if (av.notas && av.professor?.nome) {
                const notas = Object.values(av.notas).map(Number);
                const mediaAvaliacao = notas.reduce((a, b) => a + b, 0) / notas.length;
                
                const nome = av.professor.nome;
                if (!professoresStats[nome]) {
                    professoresStats[nome] = {
                        somaNotas: 0,
                        qtdAvaliacoes: 0
                    };
                }
                
                professoresStats[nome].somaNotas += mediaAvaliacao;
                professoresStats[nome].qtdAvaliacoes++;
            }
            
            // Atualiza última avaliação
            if (av.timestamp) {
                const dataAvaliacao = new Date(av.timestamp);
                if (ultimaAvaliacao === '-' || dataAvaliacao > new Date(ultimaAvaliacao)) {
                    ultimaAvaliacao = dataAvaliacao.toLocaleDateString('pt-BR');
                }
            }
        });
        
        // Encontra o melhor professor
        Object.entries(professoresStats).forEach(([nome, stats]) => {
            const mediaProfessor = stats.somaNotas / stats.qtdAvaliacoes;
            if (mediaProfessor > melhorProfessor.media) {
                melhorProfessor = {
                    nome: nome,
                    media: mediaProfessor
                };
            }
        });
        
        // Calcula média geral
        let somaTotal = 0;
        let qtdTotal = 0;
        avaliacoesArray.forEach(av => {
            if (av.notas) {
                const notas = Object.values(av.notas).map(Number);
                somaTotal += notas.reduce((a, b) => a + b, 0);
                qtdTotal += notas.length;
            }
        });
        
        if (qtdTotal > 0) {
            mediaGeral = somaTotal / qtdTotal;
        }

        return {
            totalAvaliacoes: avaliacoesArray.length,
            mediaGeral: mediaGeral,
            melhorProfessor: melhorProfessor,
            ultimaAvaliacao: ultimaAvaliacao
        };
    }
}

// Inicialização global
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardController();
});