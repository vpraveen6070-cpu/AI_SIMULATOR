// interview.js - Chat Interface and Result Controller

const InterviewController = {
    role: null,
    history: [],
    questionIndex: 0,
    timerInterval: null,
    secondsElapsed: 0,
    aiTypingSound: null,
    
    init(selectedRole) {
        this.role = selectedRole || 'frontend';
        this.history = [];
        this.questionIndex = 0;
        this.secondsElapsed = 0;
        
        // Setup Header UI
        document.getElementById('current-role-title').innerText = window.InterviewAPI.roles[this.role];
        const iconClasses = {
            'frontend': 'fa-code',
            'backend': 'fa-server',
            'ai': 'fa-network-wired'
        };
        document.getElementById('current-role-icon').className = `fa-solid ${iconClasses[this.role] || 'fa-code'}`;
        
        this.startTimer();
        this.bindEvents();
        
        // Init Voice logic
        window.VoiceSystem.init();
        
        // Audio effect (simple blip) Let's rely on synthesis primarily to save assets fetch reqs, 
        // but we can add small click sounds for UI if we had the files. 
        
        // Start interview flow with initial AI prompt
        setTimeout(() => {
            this.pushAIMessage("Simulation initialized. I am your AI architect. Are you prepared to begin the evaluation?");
        }, 800);
    },
    
    bindEvents() {
        const sendBtn = document.getElementById('btn-send');
        const inputField = document.getElementById('chat-input');
        const voiceBtn = document.getElementById('btn-voice-toggle');
        const endBtn = document.getElementById('btn-end-interview');
        
        const handleSend = () => {
            const text = inputField.value.trim();
            if (text) {
                this.handleUserSubmit(text);
                inputField.value = '';
                // If they used voice, toggling send will stop mic
                if (window.VoiceSystem.isRecording) {
                    window.VoiceSystem.stopRecording();
                }
            }
        };
        
        // Unbind previous to prevent multiple fires
        sendBtn.onclick = handleSend;
        inputField.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        
        voiceBtn.onclick = () => {
            window.VoiceSystem.toggleRecording(
                (finalText, interimText) => {
                    inputField.value = finalText || interimText;
                },
                () => {
                    // Auto-focus input so user can edit or send
                    inputField.focus();
                }
            );
        };
        
        endBtn.onclick = () => this.concludeInterview();
    },
    
    startTimer() {
        clearInterval(this.timerInterval);
        const timerDisplay = document.getElementById('session-timer');
        
        this.timerInterval = setInterval(() => {
            this.secondsElapsed++;
            const m = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
            const s = (this.secondsElapsed % 60).toString().padStart(2, '0');
            timerDisplay.innerText = `${m}:${s}`;
        }, 1000);
    },
    
    scrollToBottom() {
        const historyContainer = document.getElementById('chat-history');
        historyContainer.scrollTop = historyContainer.scrollHeight;
    },
    
    pushAIMessage(text, isEval = false) {
        const historyContainer = document.getElementById('chat-history');
        
        const typingId = 'typing-' + Date.now();
        const typingHtml = `
            <div id="${typingId}" class="chat-msg api-ai" style="display:flex; align-items:center;">
                <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
        `;
        historyContainer.insertAdjacentHTML('beforeend', typingHtml);
        this.scrollToBottom();
        
        // Simulate reading / typing time (fast enough for good UX)
        let delay = text.length * 20; 
        if (delay < 800) delay = 800;
        if (delay > 2500) delay = 2500;
        
        setTimeout(() => {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            
            const msgHtml = `<div class="chat-msg api-ai">${text}</div>`;
            historyContainer.insertAdjacentHTML('beforeend', msgHtml);
            this.scrollToBottom();
            
            this.history.push({ role: 'ai', text: text });
            
            window.VoiceSystem.speak(text);
            
            if (isEval) {
                setTimeout(() => this.concludeInterview(), 5000);
            }
        }, delay);
    },
    
    handleUserSubmit(text) {
        window.VoiceSystem.synthesis.cancel();
        
        const historyContainer = document.getElementById('chat-history');
        const msgHtml = `<div class="chat-msg user">${text}</div>`;
        historyContainer.insertAdjacentHTML('beforeend', msgHtml);
        this.scrollToBottom();
        
        this.history.push({ role: 'user', text: text });
        
        this.askNextQuestion();
    },
    
    async askNextQuestion() {
        const historyContainer = document.getElementById('chat-history');
        
        const typingId = 'typing-' + Date.now();
        historyContainer.insertAdjacentHTML('beforeend', `<div id="${typingId}" class="chat-msg api-ai" style="display:flex; align-items:center;"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`);
        this.scrollToBottom();

        const qData = await window.InterviewAPI.getNextQuestion(this.role, this.questionIndex);
        
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        this.pushAIMessage(qData.text, qData.isFinal);
        
        this.questionIndex++;
    },
    
    async concludeInterview() {
        clearInterval(this.timerInterval);
        if(window.VoiceSystem.synthesis) {
            window.VoiceSystem.synthesis.cancel();
        }
        
        // Navigate
        await window.App.navigate('result');
    }
};

window.InterviewController = InterviewController;


// --- Result Controller ---

const ResultController = {
    async init() {
        const history = window.InterviewController ? window.InterviewController.history : [];
        document.getElementById('final-score').innerText = "...";
        
        try {
            const evalData = await window.InterviewAPI.evaluateInterview(history);
            
            const scoreDisplay = document.getElementById('final-score');
            const scoreCircle = document.getElementById('score-circle');
            
            let currentScore = 0;
            const targetScore = evalData.score;
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0] + ' | ' + now.toTimeString().split(' ')[0];
            const roleNameMap = {
                'frontend': 'Frontend Developer',
                'backend': 'Backend Developer',
                'ai': 'AI Engineer'
            };
            const roleKey = window.InterviewController ? window.InterviewController.role : 'frontend';
            window.App.HistoryManager.addHistory({
                role: roleKey,
                roleName: roleNameMap[roleKey] || 'Developer',
                score: targetScore,
                date: dateStr
            });
            
            const offset = 283 - (targetScore / 100) * 283;
            setTimeout(() => {
                scoreCircle.style.strokeDashoffset = offset;
            }, 300);

            const counter = setInterval(() => {
                currentScore++;
                scoreDisplay.innerText = currentScore;
                if(currentScore >= targetScore) {
                    clearInterval(counter);
                    scoreDisplay.innerText = targetScore;
                }
            }, 15); 

            // Render eval lists
            document.getElementById('list-strengths').innerHTML = evalData.strengths.map(s => `<li>${s}</li>`).join('');
            document.getElementById('list-weaknesses').innerHTML = evalData.weaknesses.map(w => `<li>${w}</li>`).join('') || '<li>None</li>';
            document.getElementById('eval-suggestion').innerText = evalData.suggestion;
            
            setTimeout(() => {
                window.VoiceSystem.speak(`Simulation complete. Architecture analysis indicates a ${targetScore} percent competency match.`);
            }, 1000);

        } catch (error) {
            console.error(error);
            document.getElementById('final-score').innerText = "ERR";
        }
    }
};

window.ResultController = ResultController;
