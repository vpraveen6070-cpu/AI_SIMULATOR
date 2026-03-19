// voice.js - Web Speech API Integration

const VoiceSystem = {
    synthesis: window.speechSynthesis,
    recognition: null,
    isRecording: false,
    onResultCallback: null,
    onEndCallback: null,
    
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true; // Set to continuous to gather entire speech until user stops it manually
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                const statusEl = document.getElementById('voice-status');
                if (statusEl) {
                    statusEl.classList.remove('hidden');
                    document.getElementById('btn-voice-toggle').classList.add('mic-listening');
                }
            };
            
            this.recognition.onresult = (event) => {
                let fullTranscript = '';

                // Build transcript cumulatively from beginning of session
                for (let i = 0; i < event.results.length; ++i) {
                    fullTranscript += event.results[i][0].transcript;
                }
                
                if (this.onResultCallback) {
                    this.onResultCallback(fullTranscript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
        }
    },
    
    startRecording(onResult, onEnd) {
        if (!this.recognition) return;
        this.onResultCallback = onResult;
        this.onEndCallback = onEnd;
        try {
            this.recognition.start();
        } catch(e) { console.error(e); }
    },
    
    stopRecording() {
        if (this.isRecording && this.recognition) {
            this.isRecording = false;
            try { this.recognition.stop(); } catch(e){}
            const statusEl = document.getElementById('voice-status');
            if (statusEl) {
                statusEl.classList.add('hidden');
                document.getElementById('btn-voice-toggle').classList.remove('mic-listening');
            }
            if (this.onEndCallback) this.onEndCallback();
        }
    },
    
    toggleRecording(onResult, onEnd) {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording(onResult, onEnd);
        }
    },

    speak(text, onStart, onEnd) {
        if (!this.synthesis) return;
        
        // Interrupt any ongoing speech naturally to avoid overlapping
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Wait till voices are populated naturally by browser
        setTimeout(() => {
            const voices = this.synthesis.getVoices();
            
            // Look for a British Voice, or 'Zira'/'Hazel' for a more distinct AI-synthetic identity
            const preferredVoice = voices.find(v => 
                v.name.includes('Google UK English') || 
                v.name.includes('Hazel') || 
                v.name.includes('Zira') || 
                v.name.includes('Daniel')
            ) || voices.find(v => v.lang === 'en-GB' || v.lang === 'en-US');

            if (preferredVoice) utterance.voice = preferredVoice;
            
            utterance.rate = 1.05;  // Slightly faster and sharper
            utterance.pitch = 1.25; // Higher pitch for that distinct synthetic digital sound
            
            utterance.onstart = () => { if (onStart) onStart(); };
            utterance.onend = () => { if (onEnd) onEnd(); };
            
            this.synthesis.speak(utterance);
        }, 50);
    }
};

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}

window.VoiceSystem = VoiceSystem;
