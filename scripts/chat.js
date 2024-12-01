class ChatBot {
    constructor() {
        this.respostas = {
            // Saudações
            saudacoes: {
                padrao: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite'],
                resposta: ['Olá! Sou o assistente virtual da EETEPA. Como posso ajudar você hoje?', 'Oi! Posso te ajudar com informações sobre nossos cursos!']
            },
            
            // Informações gerais sobre os cursos
            cursos: {
                padrao: ['quais cursos', 'cursos disponíveis', 'que cursos tem', 'mostrar cursos'],
                resposta: ['Oferecemos os seguintes cursos técnicos:\n- Informática\n- Edificações\n- Agropecuária\n- Mineração\nSobre qual curso você quer saber mais?']
            },
            
            // Informática
            informatica: {
                padrao: ['informatica', 'informática', 'computação', 'programação', 'curso de informatica'],
                resposta: ['O curso Técnico em Informática forma profissionais para atuar com desenvolvimento de sistemas, manutenção de computadores e redes. Duração: 18 meses. Aulas práticas em laboratórios modernos.']
            },
            
            // Edificações
            edificacoes: {
                padrao: ['edificações', 'edificacoes', 'construção', 'construcao', 'curso de edificações'],
                resposta: ['O curso Técnico em Edificações prepara profissionais para atuar na construção civil, projetos arquitetônicos e gestão de obras. Duração: 18 meses. Inclui visitas técnicas e projetos práticos.']
            },
            
            // Agropecuária
            agropecuaria: {
                padrao: ['agropecuária', 'agropecuaria', 'agricultura', 'curso de agropecuária'],
                resposta: ['O curso Técnico em Agropecuária forma profissionais para trabalhar com produção animal, vegetal e gestão rural. Duração: 18 meses. Aulas práticas em nossa fazenda experimental.']
            },
            
            // Mineração
            mineracao: {
                padrao: ['mineração', 'mineracao', 'curso de mineração', 'minas'],
                resposta: ['O curso Técnico em Mineração prepara profissionais para atuar em empresas de mineração, pesquisa mineral e gestão ambiental. Duração: 18 meses. Inclui visitas técnicas a minas da região.']
            },
            
            // Inscrições
            inscricoes: {
                padrao: ['como fazer inscrição', 'inscrição', 'inscricao', 'matricula', 'matrícula', 'como participar'],
                resposta: ['As inscrições para nossos cursos técnicos podem ser feitas:\n1. Pelo site: www.eetepa.edu.br\n2. Presencialmente na secretaria\nDocumentos necessários: RG, CPF, Histórico Escolar e Comprovante de Residência.']
            },
            
            // Horários
            horarios: {
                padrao: ['horário', 'horario', 'turno', 'período', 'periodo'],
                resposta: ['Oferecemos cursos nos seguintes turnos:\n- Manhã: 7h às 11h30\n- Tarde: 13h30 às 18h\n- Noite: 19h às 22h30\nCada curso tem horários específicos, consulte a secretaria para mais detalhes.']
            },
            
            // Localização
            local: {
                padrao: ['onde fica', 'endereço', 'endereco', 'localização', 'localizacao'],
                resposta: ['A EETEPA está localizada na Rua Principal, s/n, Centro, Xinguara-PA. Próximo ao Terminal Rodoviário. Para mais informações sobre como chegar, ligue: (94) XXXX-XXXX']
            },
            
            // Dúvidas gerais
            ajuda: {
                padrao: ['ajuda', 'dúvida', 'duvida', 'informação', 'informacao'],
                resposta: ['Posso ajudar com informações sobre:\n- Cursos disponíveis\n- Processo de inscrição\n- Horários das aulas\n- Localização da escola\nSobre o que você gostaria de saber?']
            },
            
            // Agradecimentos
            agradecimento: {
                padrao: ['obrigado', 'obrigada', 'valeu', 'thanks', 'agradeço'],
                resposta: ['Por nada! Estou aqui para ajudar! 😊', 'Disponha! Se tiver mais dúvidas sobre nossos cursos, é só perguntar! 👍']
            }
        };
        
        this.defaultResponse = "Desculpe, não entendi sua pergunta. Você pode perguntar sobre nossos cursos, processo de inscrição, horários ou localização da escola.";
    }

    processMessage(message) {
        message = message.toLowerCase().trim();
        
        for (const categoria in this.respostas) {
            const { padrao, resposta } = this.respostas[categoria];
            if (padrao.some(p => {
                return message === p || message.includes(p);
            })) {
                return this.getRandomResponse(resposta);
            }
        }
        
        return this.defaultResponse;
    }

    getRandomResponse(respostas) {
        return respostas[Math.floor(Math.random() * respostas.length)];
    }
}

class ChatWidget {
    constructor() {
        this.chatRef = db.ref('chat');
        this.currentUser = `user_${Math.random().toString(36).substr(2, 9)}`;
        this.bot = new ChatBot();
        this.botId = 'bot_pjd';
        this.messageQueue = Promise.resolve();
        
        // Limpar mensagens antigas ao iniciar
        this.clearChatHistory();
        this.setupEventListeners();
    }

    // Adicione este novo método
    async clearChatHistory() {
        try {
            // Limpa todas as mensagens no Firebase
            await this.chatRef.remove();
            
            // Limpa a div de mensagens
            const messagesDiv = document.getElementById('chatMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = '';
            }

            // Envia mensagem de boas-vindas após limpar
            setTimeout(() => {
                this.sendBotMessage("Olá! Sou o assistente virtual do P.J.D. Como posso ajudar você hoje? 🤖");
            }, 1000);
        } catch (error) {
            console.error('Erro ao limpar histórico do chat:', error);
        }
    }

    setupEventListeners() {
        const elements = {
            trigger: document.getElementById('chatTrigger'),
            close: document.getElementById('closeChat'),
            send: document.getElementById('sendMessage'),
            input: document.getElementById('messageInput'),
            container: document.getElementById('chatContainer'),
            messages: document.getElementById('chatMessages')
        };

        if (!elements.trigger || !elements.close || !elements.send || 
            !elements.input || !elements.container || !elements.messages) {
            console.error('Elementos do chat não encontrados');
            return;
        }

        elements.trigger.addEventListener('click', () => this.toggleChat(elements.container));
        elements.close.addEventListener('click', () => this.toggleChat(elements.container));
        elements.send.addEventListener('click', () => this.handleSendMessage(elements.input));
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSendMessage(elements.input);
            }
        });

        const suggestionButtons = document.querySelectorAll('.suggestion-btn');
        suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const question = button.dataset.question;
                if (question) {
                    elements.input.value = question;
                    this.handleSendMessage(elements.input);
                }
            });
        });

        // Limpar mensagens antigas e mostrar histórico recente
        this.chatRef.limitToLast(50).on('child_added', (snapshot) => {
            this.displayMessage(snapshot.val());
        });

        // Mensagem de boas-vindas
        setTimeout(() => {
            this.sendBotMessage("Olá! Sou o assistente virtual do P.J.D. Como posso ajudar você hoje? 🤖");
        }, 1000);
    }

    toggleChat(container) {
        container.classList.toggle('hidden');
        if (!container.classList.contains('hidden')) {
            document.getElementById('messageInput').focus();
        }
    }

    async handleSendMessage(input) {
        const message = input.value.trim();
        if (!message) return;

        input.value = '';
        input.focus();

        // Enfileirar mensagens para garantir ordem
        this.messageQueue = this.messageQueue
            .then(() => this.sendUserMessage(message))
            .then(() => new Promise(resolve => setTimeout(resolve, 1000))) // Delay natural
            .then(() => this.sendBotMessage(this.bot.processMessage(message)))
            .catch(error => console.error('Erro ao processar mensagens:', error));
    }

    async sendUserMessage(text) {
        return this.chatRef.push({
            text,
            userId: this.currentUser,
            timestamp: Date.now()
        });
    }

    async sendBotMessage(text) {
        return this.chatRef.push({
            text,
            userId: this.botId,
            timestamp: Date.now()
        });
    }

    displayMessage(message) {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return;

        const messageElement = document.createElement('div');
        const isBot = message.userId === this.botId;
        
        messageElement.className = `chat-message ${isBot ? 'message-received' : 'message-sent'}`;
        
        if (isBot) {
            messageElement.innerHTML = `
                <span class="bot-icon">🤖</span>
                <span class="message-text">${this.formatMessage(message.text)}</span>
            `;
        } else {
            messageElement.textContent = message.text;
        }
        
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    formatMessage(text) {
        // Converter URLs em links clicáveis
        return text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
    }
}

// Inicializar o chat quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.chatWidget = new ChatWidget();
    } catch (error) {
        console.error('Erro ao inicializar o chat:', error);
    }
}); 