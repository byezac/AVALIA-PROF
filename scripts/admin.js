document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos da Visão Geral
    const totalAvaliacoes = document.getElementById('total-avaliacoes');
    const mediaGeral = document.getElementById('media-geral');
    const mediaEmoji = document.getElementById('media-emoji');
    const totalProfessores = document.getElementById('total-professores');
    const melhorProfessorNome = document.getElementById('melhor-professor-nome');
    const melhorProfessorNota = document.getElementById('melhor-professor-nota');

    // Referências aos elementos do DOM
    const tabelaAvaliacoes = document.getElementById('tabela-avaliacoes').getElementsByTagName('tbody')[0];
    
    // Referências aos filtros
    const filtroPeriodo = document.getElementById('filtro-periodo');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroCurso = document.getElementById('filtro-curso');
    const buscaProfessor = document.getElementById('busca-professor');
    const btnAplicarFiltros = document.getElementById('aplicar-filtros');
    const btnLimparFiltros = document.getElementById('limpar-filtros');

    // Referências para elementos da seção Professores
    const filtroProfessor = document.getElementById('filtro-professor');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroPeriodoProf = document.getElementById('filtro-periodo-prof');
    const tabelaProfessores = document.getElementById('tabela-professores').getElementsByTagName('tbody')[0];

    // Referências para elementos da seção Gestão
    const mediaCoordenacao = document.getElementById('media-coordenacao');
    const mediaDirecao = document.getElementById('media-direcao');
    const mediaVicedirecao = document.getElementById('media-vicedirecao');

    let dadosOriginais = [];
    let graficoProfessores = null;
    let graficoGestao = null;
    let graficoProfessorIndividual = null;
    let graficoDisciplinas = null;
    let graficoEvolucaoGestao = null;
    let graficoAspectosGestao = null;

    function calcularMedia(valores) {
        return valores.reduce((a, b) => a + Number(b), 0) / valores.length;
    }

    function aplicarFiltros(dados) {
        let dadosFiltrados = [...dados];

        // Filtro de período
        const dias = parseInt(filtroPeriodo.value);
        if (dias) {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - dias);
            dadosFiltrados = dadosFiltrados.filter(av => av.data >= dataLimite);
        }

        // Filtro de turma
        if (filtroTurma.value !== 'todas') {
            dadosFiltrados = dadosFiltrados.filter(av => {
                if (av.turma && av.turma.ano && av.turma.periodo) {
                    const turmaCompleta = `${av.turma.ano} ${av.turma.periodo}`;
                    return turmaCompleta === filtroTurma.value;
                }
                return false;
            });
        }

        // Filtro de curso
        if (filtroCurso.value !== 'todos') {
            dadosFiltrados = dadosFiltrados.filter(av => {
                if (av.turma && av.turma.curso) {
                    const cursosNomes = {
                        'AGRI': 'AGRICULTURA',
                        'JOGOS': 'JOGOS DIGITAIS',
                        'MULT': 'MULTIMÍDIA'
                    };
                    const cursoNome = cursosNomes[av.turma.curso] || av.turma.curso;
                    return cursoNome.toLowerCase() === filtroCurso.value.toLowerCase();
                }
                return false;
            });
        }

        // Busca por professor
        const termoBusca = buscaProfessor.value.toLowerCase().trim();
        if (termoBusca) {
            dadosFiltrados = dadosFiltrados.filter(av => 
                av.professor.toLowerCase().includes(termoBusca)
            );
        }

        return dadosFiltrados;
    }

    function atualizarDashboard(dados) {
        const professoresSet = new Set(dados.map(av => av.professor));
        
        // Encontrar melhor professor
        const mediasPorProfessor = {};
        professoresSet.forEach(prof => {
            const avaliacoesProf = dados.filter(av => av.professor === prof);
            mediasPorProfessor[prof] = calcularMedia(
                avaliacoesProf.flatMap(av => Object.values(av.avaliacoes.professor))
            );
        });

        const melhorProfessor = Object.entries(mediasPorProfessor)
            .sort(([,a], [,b]) => b - a)[0];

        if (melhorProfessor) {
            document.getElementById('melhor-professor-nome').textContent = melhorProfessor[0];
            document.getElementById('melhor-professor-nota').textContent = 
                melhorProfessor[1].toFixed(1);
        }

        // Atualizar cards
        totalAvaliacoes.textContent = dados.length;
        totalProfessores.textContent = professoresSet.size;

        // Calcular média geral
        const todasNotas = dados.flatMap(av => 
            Object.values(av.avaliacoes.professor).map(Number)
        );
        mediaGeral.textContent = calcularMedia(todasNotas).toFixed(1);

        // Atualizar tabela
        atualizarTabela(dados);

        // Atualizar gráficos
        atualizarGraficos(dados);
    }

    function atualizarTabela(dados) {
        tabelaAvaliacoes.innerHTML = '';
        dados
            .sort((a, b) => b.data - a.data)
            .slice(0, 10)
            .forEach(av => {
                const mediaAv = calcularMedia(Object.values(av.avaliacoes.professor));
                
                // Formatar a turma corretamente
                const turmaFormatada = av.turma ? `${av.turma.ano} ${av.turma.periodo}` : 'N/A';
                
                // Determinar o status baseado na média
                let status = '';
                let statusClass = '';
                if (mediaAv >= 4) {
                    status = 'Excelente';
                    statusClass = 'text-success';
                } else if (mediaAv >= 3) {
                    status = 'Bom';
                    statusClass = 'text-primary';
                } else if (mediaAv >= 2) {
                    status = 'Regular';
                    statusClass = 'text-warning';
                } else {
                    status = 'Insatisfatório';
                    statusClass = 'text-danger';
                }

                const row = tabelaAvaliacoes.insertRow();
                row.innerHTML = `
                    <td>${av.data.toLocaleDateString()}</td>
                    <td>${av.professor}</td>
                    <td>${turmaFormatada}</td>
                    <td>${mediaAv.toFixed(1)}</td>
                    <td class="${statusClass}">${status}</td>
                `;
            });
    }

    // Configuração global para todos os gráficos
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
    Chart.defaults.scale.grid.color = '#e2e8f0';
    Chart.defaults.plugins.tooltip.backgroundColor = '#1e293b';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont.size = 14;
    Chart.defaults.plugins.tooltip.titleFont.weight = '600';

    // Paleta de cores vibrantes para os gráficos
    const chartColors = {
        // Cores principais
        primary: '#4F46E5',    // Índigo vibrante
        secondary: '#7C3AED',  // Violeta vibrante
        tertiary: '#2563EB',   // Azul vibrante
        
        // Gradientes
        gradients: {
            purple: ['#8B5CF6', '#C084FC'],   // Violeta para rosa
            blue: ['#3B82F6', '#60A5FA'],     // Azul escuro para azul claro
            green: ['#10B981', '#34D399'],    // Verde escuro para verde claro
            orange: ['#F59E0B', '#FBBF24'],   // Laranja para amarelo
            red: ['#EF4444', '#FB7185'],      // Vermelho para rosa
            indigo: ['#4F46E5', '#818CF8']    // Índigo para azul claro
        },
        
        // Cores de destaque
        accent: {
            yellow: '#FBBF24',
            green: '#10B981',
            red: '#EF4444',
            purple: '#8B5CF6',
            blue: '#3B82F6'
        },
        
        // Cores de fundo com transparência
        background: {
            purple: 'rgba(139, 92, 246, 0.1)',
            blue: 'rgba(59, 130, 246, 0.1)',
            green: 'rgba(16, 185, 129, 0.1)',
            orange: 'rgba(245, 158, 11, 0.1)',
            red: 'rgba(239, 68, 68, 0.1)'
        }
    };

    // Função para criar gradiente melhorada
    function createGradient(ctx, colorArray, vertical = true) {
        const gradient = vertical 
            ? ctx.createLinearGradient(0, 0, 0, 300)
            : ctx.createLinearGradient(0, 0, 300, 0);
        
        gradient.addColorStop(0, colorArray[0]);
        gradient.addColorStop(1, colorArray[1]);
        return gradient;
    }

    // Configurações base para todos os gráficos
    const baseChartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                        size: 12,
                        weight: '600'
                    }
                }
            },
            tooltip: {
                backgroundColor: chartColors.primary,
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                titleFont: {
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function(context) {
                        return ` ${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                    stepSize: 1,
                    padding: 10,
                    color: chartColors.primary,
                    font: {
                        weight: '600'
                    }
                },
                grid: {
                    color: 'rgba(79, 70, 229, 0.1)',
                    drawBorder: false
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    padding: 10,
                    color: chartColors.primary,
                    font: {
                        weight: '600'
                    }
                }
            }
        }
    };

    // Configurações específicas para cada tipo de gráfico
    function createBarChart(ctx, data) {
        const gradients = data.values.map((_, index) => {
            const gradientKeys = Object.keys(chartColors.gradients);
            const colorPair = chartColors.gradients[gradientKeys[index % gradientKeys.length]];
            return createGradient(ctx, colorPair);
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label,
                    data: data.values,
                    backgroundColor: gradients,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 40,
                    maxBarThickness: 40
                }]
            },
            options: {
                ...baseChartConfig,
                plugins: {
                    ...baseChartConfig.plugins,
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function createLineChart(ctx, data) {
        const gradient = createGradient(ctx, chartColors.gradients.blue);
        const backgroundGradient = createGradient(ctx, [
            'rgba(59, 130, 246, 0.2)',
            'rgba(59, 130, 246, 0.0)'
        ]);

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label,
                    data: data.values,
                    borderColor: gradient,
                    backgroundColor: backgroundGradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: chartColors.primary,
                    pointBorderWidth: 3,
                    pointHoverRadius: 8,
                    pointHoverBorderWidth: 3,
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: chartColors.accent.purple
                }]
            },
            options: {
                ...baseChartConfig,
                plugins: {
                    ...baseChartConfig.plugins,
                    tooltip: {
                        backgroundColor: chartColors.primary,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false
                    }
                }
            }
        });
    }

    function createRadarChart(ctx, data) {
        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label,
                    data: data.values,
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderColor: chartColors.gradients.purple[0],
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: chartColors.gradients.purple[1],
                    pointHoverRadius: 8,
                    pointBorderWidth: 3,
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: chartColors.accent.purple
                }]
            },
            options: {
                ...baseChartConfig,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        },
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            color: chartColors.primary
                        },
                        grid: {
                            color: 'rgba(79, 70, 229, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(79, 70, 229, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // Exemplo de uso para atualizar os gráficos existentes:
    function atualizarGraficos(dados) {
        // Gráfico de Professores (Barra)
        const ctxProfessores = document.getElementById('grafico-professores').getContext('2d');
        if (graficoProfessores) graficoProfessores.destroy();
        graficoProfessores = createBarChart(ctxProfessores, {
            labels: Object.keys(dadosProfessores),
            values: Object.values(dadosProfessores),
            label: 'Média das Avaliações'
        });

        // Gráfico de Evolução (Linha)
        const ctxEvolucao = document.getElementById('grafico-evolucao').getContext('2d');
        if (graficoEvolucao) graficoEvolucao.destroy();
        graficoEvolucao = createLineChart(ctxEvolucao, {
            labels: obterMesesAvaliacao(dados),
            values: calcularEvolucaoGestao(dados),
            label: 'Evolução das Avaliações'
        });

        // Gráfico da Gestão (Radar)
        const ctxGestao = document.getElementById('grafico-gestao').getContext('2d');
        if (graficoGestao) graficoGestao.destroy();
        graficoGestao = createRadarChart(ctxGestao, {
            labels: Object.keys(mediasGestao),
            values: Object.values(mediasGestao),
            label: 'Avaliação da Gestão'
        });
    }

    // Funções auxiliares para cálculos
    function calcularMediasMensais(dados) {
        const mediasPorMes = {};
        dados.forEach(av => {
            const mesAno = av.data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            if (!mediasPorMes[mesAno]) {
                mediasPorMes[mesAno] = [];
            }
            mediasPorMes[mesAno].push(
                calcularMedia(Object.values(av.avaliacoes.professor))
            );
        });

        return Object.values(mediasPorMes).map(notas => 
            calcularMedia(notas)
        );
    }

    function calcularDistribuicaoNotas(dados) {
        const distribuicao = [0, 0, 0, 0]; // [1-2, 2-3, 3-4, 4-5]
        dados.forEach(av => {
            const media = calcularMedia(Object.values(av.avaliacoes.professor));
            const index = Math.min(Math.floor(media - 1), 3);
            distribuicao[index]++;
        });
        return distribuicao;
    }

    function calcularMediasPorCurso(dados) {
        console.log('Dados recebidos em calcularMediasPorCurso:', dados);
        
        const mediasPorCurso = {};
        dados.forEach(av => {
            if (av.turma && av.turma.curso) {
                const curso = av.turma.curso;
                console.log('Processando curso:', curso);
                
                if (!mediasPorCurso[curso]) {
                    mediasPorCurso[curso] = [];
                }
                if (av.avaliacoes && av.avaliacoes.professor) {
                    const media = calcularMedia(Object.values(av.avaliacoes.professor));
                    mediasPorCurso[curso].push(media);
                    console.log(`Média adicionada para ${curso}:`, media);
                }
            }
        });

        console.log('Médias por curso calculadas:', mediasPorCurso);
        
        return Object.entries(mediasPorCurso).map(([curso, notas]) => {
            const mediaFinal = notas.length > 0 ? calcularMedia(notas) : 0;
            console.log(`Média final do curso ${curso}:`, mediaFinal);
            return mediaFinal;
        });
    }

    function popularFiltros(dados) {
        console.log('Dados recebidos em popularFiltros:', dados);

        // Popular select de turmas
        const turmas = new Set();
        dados.forEach(av => {
            if (av.turma && av.turma.ano && av.turma.periodo) {
                const turmaCompleta = `${av.turma.ano} ${av.turma.periodo}`;
                turmas.add(turmaCompleta);
                console.log('Turma encontrada:', turmaCompleta);
            }
        });

        filtroTurma.innerHTML = '<option value="todas">Todas as turmas</option>';
        turmas.forEach(turma => {
            if (turma && turma !== 'N/A') {
                filtroTurma.innerHTML += `<option value="${turma}">${turma}</option>`;
            }
        });
        console.log('Turmas populadas:', Array.from(turmas));

        // Popular select de cursos
        const cursos = new Set();
        const cursosNomes = {
            'AGRI': 'AGRICULTURA',
            'JOGOS': 'JOGOS DIGITAIS',
            'MULT': 'MULTIMÍDIA'
        };

        dados.forEach(av => {
            if (av.turma && av.turma.curso) {
                const cursoNome = cursosNomes[av.turma.curso] || av.turma.curso;
                cursos.add(cursoNome);
                console.log('Curso encontrado:', cursoNome);
            }
        });

        filtroCurso.innerHTML = '<option value="todos">Todos os cursos</option>';
        cursos.forEach(curso => {
            if (curso && curso !== 'N/A') {
                filtroCurso.innerHTML += `<option value="${curso}">${curso}</option>`;
            }
        });
        console.log('Cursos populados:', Array.from(cursos));
    }

    function atualizarSecaoProfessores(dados) {
        console.log('Atualizando seção professores com:', dados); // Debug
        
        // Popular filtros
        const professores = new Set();
        const disciplinas = new Set();
        
        dados.forEach(av => {
            if (av.professor) {
                professores.add(av.professor);
                if (av.disciplina) disciplinas.add(av.disciplina);
            }
        });

        console.log('Professores encontrados:', Array.from(professores)); // Debug
        console.log('Disciplinas encontradas:', Array.from(disciplinas)); // Debug

        // Atualizar select de professores
        const filtroProfessor = document.getElementById('filtro-professor');
        if (filtroProfessor) {
            filtroProfessor.innerHTML = '<option value="todos">Todos os professores</option>';
            professores.forEach(prof => {
                filtroProfessor.innerHTML += `<option value="${prof}">${prof}</option>`;
            });
        }

        // Atualizar select de disciplinas
        const filtroDisciplina = document.getElementById('filtro-disciplina');
        if (filtroDisciplina) {
            filtroDisciplina.innerHTML = '<option value="todas">Todas as disciplinas</option>';
            disciplinas.forEach(disc => {
                filtroDisciplina.innerHTML += `<option value="${disc}">${disc}</option>`;
            });
        }

        // Atualizar tabela e gráficos
        atualizarTabelaProfessores(dados);
        atualizarGraficosProfessores(dados);
    }

    function atualizarTabelaProfessores(dados) {
        const resumoProfessores = {};
        
        dados.forEach(av => {
            if (!resumoProfessores[av.professor]) {
                resumoProfessores[av.professor] = {
                    disciplina: av.disciplina,
                    notas: [],
                    totalAvaliacoes: 0,
                    ultimaAvaliacao: av.data,
                    turmas: new Set()
                };
            }

            resumoProfessores[av.professor].notas.push(
                ...Object.values(av.avaliacoes.professor)
            );
            resumoProfessores[av.professor].totalAvaliacoes++;
            
            if (av.data > resumoProfessores[av.professor].ultimaAvaliacao) {
                resumoProfessores[av.professor].ultimaAvaliacao = av.data;
            }

            // Adicionar turma ao conjunto de turmas do professor
            if (av.turma) {
                resumoProfessores[av.professor].turmas.add(
                    `${av.turma.ano} ${av.turma.periodo}`
                );
            }
        });

        const tabelaProfessores = document.getElementById('tabela-professores').getElementsByTagName('tbody')[0];
        tabelaProfessores.innerHTML = '';
        
        Object.entries(resumoProfessores).forEach(([prof, dados]) => {
            const media = calcularMedia(dados.notas);
            
            // Determinar o status baseado na média
            let status = '';
            let statusClass = '';
            if (media >= 4) {
                status = 'Excelente';
                statusClass = 'text-success';
            } else if (media >= 3) {
                status = 'Bom';
                statusClass = 'text-primary';
            } else if (media >= 2) {
                status = 'Regular';
                statusClass = 'text-warning';
            } else {
                status = 'Insatisfatório';
                statusClass = 'text-danger';
            }

            const row = tabelaProfessores.insertRow();
            row.innerHTML = `
                <td>${prof}</td>
                <td>${dados.disciplina || 'N/A'}</td>
                <td>${media.toFixed(1)}</td>
                <td>${dados.totalAvaliacoes}</td>
                <td>${dados.ultimaAvaliacao.toLocaleDateString()}</td>
                <td class="${statusClass}">${status}</td>
            `;
        });
    }

    function atualizarGraficosProfessores(dados) {
        // Destruir gráficos existentes
        if (graficoProfessorIndividual) graficoProfessorIndividual.destroy();
        if (graficoDisciplinas) graficoDisciplinas.destroy();

        const configuracoesGrafico = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        };

        // Gráfico individual do professor
        graficoProfessorIndividual = new Chart(
            document.getElementById('grafico-professor-individual'), {
                type: 'bar',
                data: {
                    labels: Array.from(new Set(dados.map(av => av.professor))),
                    datasets: [{
                        label: 'Média Individual',
                        data: calcularMediasPorProfessor(dados),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2
                    }]
                },
                options: configuracoesGrafico
            }
        );

        // Gráfico por disciplina
        graficoDisciplinas = new Chart(
            document.getElementById('grafico-disciplinas'), {
                type: 'radar',
                data: {
                    labels: Array.from(new Set(dados.map(av => av.disciplina))),
                    datasets: [{
                        label: 'Média por Disciplina',
                        data: calcularMediasPorDisciplina(dados),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2
                    }]
                },
                options: configuracoesGrafico
            }
        );
    }

    function atualizarSecaoGestao(dados) {
        console.log('Atualizando seção gestão com:', dados); // Debug

        // Calcular médias da gestão
        const mediasGestao = {
            coordenacao: calcularMediaGestao(dados, 'coordenacao'),
            direcao: calcularMediaGestao(dados, 'direcao'),
            vicedirecao: calcularMediaGestao(dados, 'vicedirecao')
        };

        console.log('Médias da gestão calculadas:', mediasGestao); // Debug

        // Atualizar cards
        const elementos = {
            coordenacao: document.getElementById('media-coordenacao'),
            direcao: document.getElementById('media-direcao'),
            vicedirecao: document.getElementById('media-vicedirecao')
        };

        // Verificar se os elementos existem antes de atualizar
        for (const [tipo, elemento] of Object.entries(elementos)) {
            if (elemento) {
                elemento.textContent = mediasGestao[tipo].toFixed(1);
                
                // Atualizar barra de progresso
                const progressBar = elemento.parentElement.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${(mediasGestao[tipo] / 5) * 100}%`;
                }
            }
        }

        // Atualizar gráficos
        atualizarGraficosGestao(dados, mediasGestao);
    }

    function atualizarGraficosGestao(dados, mediasGestao) {
        // Destruir gráficos existentes
        if (graficoEvolucaoGestao) graficoEvolucaoGestao.destroy();
        if (graficoAspectosGestao) graficoAspectosGestao.destroy();

        const configuracoesGrafico = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        };

        // Gráficos da gestão
        graficoEvolucaoGestao = new Chart(
            document.getElementById('grafico-evolucao-gestao'), {
                type: 'line',
                data: {
                    labels: obterMesesAvaliacao(dados),
                    datasets: [{
                        label: 'Evolução da Gestão',
                        data: calcularEvolucaoGestao(dados),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: configuracoesGrafico
            }
        );

        graficoAspectosGestao = new Chart(
            document.getElementById('grafico-aspectos-gestao'), {
                type: 'radar',
                data: {
                    labels: ['Coordenação', 'Direção', 'Vice-direção'],
                    datasets: [{
                        label: 'Aspectos da Gestão',
                        data: [
                            mediasGestao.coordenacao,
                            mediasGestao.direcao,
                            mediasGestao.vicedirecao
                        ],
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    ...configuracoesGrafico,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 5
                        }
                    }
                }
            }
        );
    }

    // Funções auxiliares
    function calcularMediaGestao(dados, tipo) {
        const notas = dados.flatMap(av => 
            av.avaliacoes?.gestao?.[tipo] ? Object.values(av.avaliacoes.gestao[tipo]) : []
        );
        return notas.length ? calcularMedia(notas) : 0;
    }

    function calcularMediasPorProfessor(dados) {
        const mediasPorProf = {};
        dados.forEach(av => {
            if (!mediasPorProf[av.professor]) {
                mediasPorProf[av.professor] = [];
            }
            mediasPorProf[av.professor].push(...Object.values(av.avaliacoes.professor));
        });
        return Object.values(mediasPorProf).map(notas => calcularMedia(notas));
    }

    function calcularMediasPorDisciplina(dados) {
        const mediasPorDisc = {};
        dados.forEach(av => {
            if (!mediasPorDisc[av.disciplina]) {
                mediasPorDisc[av.disciplina] = [];
            }
            mediasPorDisc[av.disciplina].push(...Object.values(av.avaliacoes.professor));
        });
        return Object.values(mediasPorDisc).map(notas => calcularMedia(notas));
    }

    function obterMesesAvaliacao(dados) {
        return [...new Set(dados.map(av => 
            av.data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        ))].sort();
    }

    function calcularEvolucaoGestao(dados) {
        const evolucao = {};
        dados.forEach(av => {
            const mesAno = av.data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            if (!evolucao[mesAno]) {
                evolucao[mesAno] = [];
            }
            if (av.avaliacoes?.gestao) {
                const mediasGestao = Object.values(av.avaliacoes.gestao).map(g => 
                    calcularMedia(Object.values(g))
                );
                evolucao[mesAno].push(calcularMedia(mediasGestao));
            }
        });
        return Object.values(evolucao).map(notas => calcularMedia(notas));
    }

    // Eventos dos filtros
    btnAplicarFiltros.addEventListener('click', () => {
        const dadosFiltrados = aplicarFiltros(dadosOriginais);
        atualizarDashboard(dadosFiltrados);
    });

    btnLimparFiltros.addEventListener('click', () => {
        filtroPeriodo.value = 'todos';
        filtroTurma.value = 'todas';
        filtroCurso.value = 'todos';
        buscaProfessor.value = '';
        atualizarDashboard(dadosOriginais);
    });

    // Buscar dados do Firebase
    const avaliacoesRef = db.ref('avaliacoes');
    avaliacoesRef.on('value', (snapshot) => {
        const dados = snapshot.val();
        console.log('Dados brutos do Firebase:', dados);
        
        dadosOriginais = [];
        
        for (let key in dados) {
            // Ignora a chave "gestao" e outras que não são avaliações de professores
            if (key !== "gestao" && key !== "test" && dados[key].professor) {
                try {
                    const avaliacao = {
                        data: new Date(dados[key].timestamp),
                        professor: dados[key].professor.nome,
                        disciplina: dados[key].professor.id.replace('prof_', '').toUpperCase(),
                        turma: {
                            ano: dados[key].turma?.ano || '',
                            periodo: dados[key].turma?.periodo || '',
                            curso: dados[key].turma?.codigo?.replace(/[0-9]+[mMtT]$/, '').toUpperCase() || '' // Extrai o curso do código
                        },
                        avaliacoes: dados[key].avaliacoes || {}
                    };
                    console.log('Avaliação processada:', avaliacao);
                    dadosOriginais.push(avaliacao);
                } catch (error) {
                    console.error('Erro ao processar avaliação:', error, dados[key]);
                }
            }
        }

        console.log('Dados processados:', dadosOriginais);
        
        // Popular os filtros com os dados carregados
        popularFiltros(dadosOriginais);
        
        // Atualizar Visão Geral
        atualizarVisaoGeral(dadosOriginais);
        
        // Atualizar outras seções
        if (dadosOriginais.length > 0) {
            atualizarSecaoProfessores(dadosOriginais);
            atualizarSecaoGestao(dadosOriginais);
        } else {
            mostrarMensagemSemDados();
        }
    });

    function atualizarVisaoGeral(dados) {
        // Total de avaliações
        totalAvaliacoes.textContent = dados.length;

        // Média geral
        const todasNotas = dados.flatMap(av => 
            Object.values(av.avaliacoes.professor || {})
        );
        const mediaGeralValor = calcularMedia(todasNotas);
        mediaGeral.textContent = mediaGeralValor.toFixed(1);

        // Emoji baseado na média
        mediaEmoji.textContent = getEmojiForNota(mediaGeralValor);

        // Total de professores únicos
        const professoresUnicos = new Set(dados.map(av => av.professor));
        totalProfessores.textContent = professoresUnicos.size;

        // Melhor professor
        const mediasPorProfessor = {};
        dados.forEach(av => {
            if (!mediasPorProfessor[av.professor]) {
                mediasPorProfessor[av.professor] = [];
            }
            mediasPorProfessor[av.professor].push(
                ...Object.values(av.avaliacoes.professor || {})
            );
        });

        let melhorProf = { nome: '-', media: 0 };
        Object.entries(mediasPorProfessor).forEach(([prof, notas]) => {
            const media = calcularMedia(notas);
            if (media > melhorProf.media) {
                melhorProf = { nome: prof, media: media };
            }
        });

        melhorProfessorNome.textContent = melhorProf.nome;
        melhorProfessorNota.textContent = melhorProf.media.toFixed(1);
    }

    function getEmojiForNota(nota) {
        if (nota >= 4.5) return '😄';
        if (nota >= 4.0) return '😊';
        if (nota >= 3.0) return '😐';
        if (nota >= 2.0) return '😕';
        return '😢';
    }

    function mostrarMensagemSemDados() {
        // Seção Professores
        const tabelaProfessores = document.getElementById('tabela-professores').getElementsByTagName('tbody')[0];
        tabelaProfessores.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Nenhuma avaliação encontrada</td>
            </tr>
        `;

        // Seção Gestão
        document.getElementById('media-coordenacao').textContent = '0.0';
        document.getElementById('media-direcao').textContent = '0.0';
        document.getElementById('media-vicedirecao').textContent = '0.0';
    }

    // Navegação da sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section-content');

    function showSection(sectionId) {
        // Esconde todas as seções
        sections.forEach(section => {
            section.classList.add('d-none');
        });

        // Remove a classe active de todos os links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Mostra a seção selecionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Adiciona a classe active ao link clicado
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Atualiza os gráficos da seção visível
        if (window.Chart) {
            const charts = targetSection.querySelectorAll('canvas');
            charts.forEach(canvas => {
                const chart = Chart.getChart(canvas);
                if (chart) {
                    chart.resize();
                }
            });
        }
    }

    // Adiciona evento de clique aos links da navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Mostra a seção inicial (Visão Geral)
    showSection('visao-geral');

    // Inicialização dos gráficos
    function initializeCharts() {
        // Gráfico de Evolução
        const ctxEvolucao = document.getElementById('evolucao-chart')?.getContext('2d');
        if (ctxEvolucao) {
            new Chart(ctxEvolucao, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Média Mensal',
                        data: [4.2, 3.8, 4.5, 4.0, 4.3, 4.6],
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Gráfico de Distribuição
        const ctxDistribuicao = document.getElementById('distribuicao-chart')?.getContext('2d');
        if (ctxDistribuicao) {
            new Chart(ctxDistribuicao, {
                type: 'bar',
                data: {
                    labels: ['1', '2', '3', '4', '5'],
                    datasets: [{
                        label: 'Quantidade de Avaliações',
                        data: [5, 10, 15, 25, 20],
                        backgroundColor: [
                            '#EF4444',
                            '#F59E0B',
                            '#10B981',
                            '#3B82F6',
                            '#6366F1'
                        ],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // Chamar a função quando o documento estiver carregado
    initializeCharts();
}); 