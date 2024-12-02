document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos do DOM
    const totalAvaliacoes = document.getElementById('total-avaliacoes');
    const mediaGeral = document.getElementById('media-geral');
    const totalProfessores = document.getElementById('total-professores');
    const tabelaAvaliacoes = document.getElementById('tabela-avaliacoes').getElementsByTagName('tbody')[0];
    
    // Referências aos filtros
    const filtroPeriodo = document.getElementById('filtro-periodo');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroCurso = document.getElementById('filtro-curso');
    const buscaProfessor = document.getElementById('busca-professor');
    const btnAplicarFiltros = document.getElementById('aplicar-filtros');
    const btnLimparFiltros = document.getElementById('limpar-filtros');

    let dadosOriginais = [];
    let graficoProfessores = null;
    let graficoGestao = null;

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

        // Criar gráfico de professores
        const dadosProfessores = {};
        new Set(dados.map(av => av.professor)).forEach(prof => {
            const avaliacoesProf = dados.filter(av => av.professor === prof);
            dadosProfessores[prof] = calcularMedia(
                avaliacoesProf.flatMap(av => Object.values(av.avaliacoes.professor))
            );
        });

        graficoProfessores = new Chart(document.getElementById('grafico-professores'), {
            type: 'bar',
            data: {
                labels: Object.keys(dadosProfessores),
                datasets: [{
                    label: 'Média das Avaliações',
                    data: Object.values(dadosProfessores),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });

        // Criar gráfico da gestão
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

        graficoGestao = new Chart(document.getElementById('grafico-gestao'), {
            type: 'radar',
            data: {
                labels: Object.keys(mediasGestao),
                datasets: [{
                    label: 'Avaliação da Gestão',
                    data: Object.values(mediasGestao),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
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
        dadosOriginais = [];
        
        // Processar dados principais
        for (let key in dados) {
            if (key !== 'gestao' && dados[key].professor) {
                dadosOriginais.push({
                    data: new Date(dados[key].timestamp),
                    professor: dados[key].professor.nome,
                    turma: `${dados[key].turma.ano} - ${dados[key].turma.periodo}`,
                    avaliacoes: dados[key].avaliacoes
                });
            }
        }

        popularFiltros(dadosOriginais);
        atualizarDashboard(dadosOriginais);
    });
}); 