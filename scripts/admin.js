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
            dadosFiltrados = dadosFiltrados.filter(av => av.turma === filtroTurma.value);
        }

        // Filtro de curso
        if (filtroCurso.value !== 'todos') {
            dadosFiltrados = dadosFiltrados.filter(av => {
                const [curso] = av.turma.split('°'); // Extrai o curso da turma
                return curso.toLowerCase().includes(filtroCurso.value.toLowerCase());
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
                const row = tabelaAvaliacoes.insertRow();
                row.innerHTML = `
                    <td>${av.data.toLocaleDateString()}</td>
                    <td>${av.professor}</td>
                    <td>${av.turma}</td>
                    <td>${mediaAv.toFixed(1)}</td>
                `;
            });
    }

    function atualizarGraficos(dados) {
        // Destruir gráficos existentes
        if (graficoProfessores) graficoProfessores.destroy();
        if (graficoGestao) graficoGestao.destroy();

        // Preparar dados dos professores
        const dadosProfessores = {};
        new Set(dados.map(av => av.professor)).forEach(prof => {
            const avaliacoesProf = dados.filter(av => av.professor === prof);
            dadosProfessores[prof] = calcularMedia(
                avaliacoesProf.flatMap(av => Object.values(av.avaliacoes.professor))
            );
        });

        // Configurações comuns para ambos os gráficos
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: true, // Mantém a proporção do gráfico
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        };

        // Gráfico de professores
        graficoProfessores = new Chart(document.getElementById('grafico-professores'), {
            type: 'bar',
            data: {
                labels: Object.keys(dadosProfessores),
                datasets: [{
                    label: 'Média das Avaliações',
                    data: Object.values(dadosProfessores),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    barThickness: 30
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        ...chartOptions.plugins.title,
                        text: 'Desempenho dos Professores'
                    }
                }
            }
        });

        // Preparar dados da gestão
        const mediasGestao = {
            'Coordenação': calcularMedia(dados.flatMap(av => 
                Object.values(av.avaliacoes.gestao.coordenacao)
            )),
            'Direção': calcularMedia(dados.flatMap(av => 
                Object.values(av.avaliacoes.gestao.direcao)
            )),
            'Vice-direção': calcularMedia(dados.flatMap(av => 
                Object.values(av.avaliacoes.gestao.vicedirecao)
            ))
        };

        // Gráfico da gestão
        graficoGestao = new Chart(document.getElementById('grafico-gestao'), {
            type: 'radar',
            data: {
                labels: Object.keys(mediasGestao),
                datasets: [{
                    label: 'Avaliação da Gestão',
                    data: Object.values(mediasGestao),
                    backgroundColor: 'rgba(255, 99, 132, 0.3)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        ...chartOptions.plugins.title,
                        text: 'Avaliação da Equipe Gestora'
                    }
                },
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
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });

        // 1. Gráfico de Evolução Temporal
        const evolucaoTemporal = new Chart(document.getElementById('grafico-evolucao'), {
            type: 'line',
            data: {
                labels: [...new Set(dados.map(av => 
                    av.data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                ))].sort(),
                datasets: [{
                    label: 'Média Mensal',
                    data: calcularMediasMensais(dados),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução das Avaliações',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });

        // 2. Gráfico de Distribuição de Notas
        const distribuicaoNotas = new Chart(document.getElementById('grafico-distribuicao'), {
            type: 'doughnut',
            data: {
                labels: ['1-2', '2-3', '3-4', '4-5'],
                datasets: [{
                    data: calcularDistribuicaoNotas(dados),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribuição das Notas',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // 3. Gráfico Comparativo entre Cursos
        const comparativoCursos = new Chart(document.getElementById('grafico-cursos'), {
            type: 'bar',
            data: {
                labels: [...new Set(dados.map(av => av.turma.split('°')[0].trim()))],
                datasets: [{
                    label: 'Média por Curso',
                    data: calcularMediasPorCurso(dados),
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparativo entre Cursos',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
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
        const mediasPorCurso = {};
        dados.forEach(av => {
            const curso = av.turma.split('°')[0].trim();
            if (!mediasPorCurso[curso]) {
                mediasPorCurso[curso] = [];
            }
            mediasPorCurso[curso].push(
                calcularMedia(Object.values(av.avaliacoes.professor))
            );
        });

        return Object.entries(mediasPorCurso).map(([_, notas]) => 
            calcularMedia(notas)
        );
    }

    function popularFiltros(dados) {
        // Popular select de turmas
        const turmas = new Set(dados.map(av => av.turma));
        filtroTurma.innerHTML = '<option value="todas">Todas as turmas</option>';
        turmas.forEach(turma => {
            filtroTurma.innerHTML += `<option value="${turma}">${turma}</option>`;
        });

        // Popular select de cursos
        const cursos = new Set(dados.map(av => {
            const [curso] = av.turma.split('°');
            return curso.trim();
        }));
        filtroCurso.innerHTML = '<option value="todos">Todos os cursos</option>';
        cursos.forEach(curso => {
            filtroCurso.innerHTML += `<option value="${curso}">${curso}</option>`;
        });
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
                    ultimaAvaliacao: av.data
                };
            }

            resumoProfessores[av.professor].notas.push(
                ...Object.values(av.avaliacoes.professor)
            );
            resumoProfessores[av.professor].totalAvaliacoes++;
            
            if (av.data > resumoProfessores[av.professor].ultimaAvaliacao) {
                resumoProfessores[av.professor].ultimaAvaliacao = av.data;
            }
        });

        tabelaProfessores.innerHTML = '';
        Object.entries(resumoProfessores).forEach(([prof, dados]) => {
            const media = calcularMedia(dados.notas);
            const row = tabelaProfessores.insertRow();
            row.innerHTML = `
                <td>${prof}</td>
                <td>${dados.disciplina}</td>
                <td>${media.toFixed(1)}</td>
                <td>${dados.totalAvaliacoes}</td>
                <td>${dados.ultimaAvaliacao.toLocaleDateString()}</td>
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
        console.log('Dados recebidos:', dados);
        
        dadosOriginais = [];
        
        for (let key in dados) {
            if (dados[key] && dados[key].professor) {
                try {
                    const avaliacao = {
                        data: new Date(dados[key].timestamp),
                        professor: dados[key].professor.nome,
                        disciplina: dados[key].professor.disciplina,
                        turma: dados[key].turma ? `${dados[key].turma.ano} - ${dados[key].turma.periodo}` : 'N/A',
                        avaliacoes: dados[key].avaliacoes || {}
                    };
                    dadosOriginais.push(avaliacao);
                } catch (error) {
                    console.error('Erro ao processar avaliação:', error, dados[key]);
                }
            }
        }

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
}); 