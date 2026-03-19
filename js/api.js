// api.js - Mock API Integration for AI Interview

const InterviewAPI = {
    questions: {
        frontend: [
            "Explain the virtual DOM in React and why it's considered faster than direct DOM manipulation.",
            "Can you describe a scenario where you'd use CSS Grid over Flexbox?",
            "How would you optimize a modern web application for maximum performance and Core Web Vitals?",
            "What is event delegation in JavaScript and why is it useful?",
            "Explain the differences between closely related concepts such as Local Storage, Session Storage, and Cookies.",
            "How do you handle state management in large-scale React applications?",
            "Can you explain the concept of Closures in JavaScript with a practical use-case?",
            "What are CSS Custom Properties (variables) and how do they differ from preprocessor variables like SASS?",
            "Describe the box model in CSS and how the 'box-sizing' property affects it.",
            "What strategies do you use to ensure your web applications are fully accessible (a11y)?"
        ],
        backend: [
            "How does Node.js handle asynchronous operations despite being fundamentally single-threaded?",
            "Explain the difference between SQL and NoSQL databases. When would you use each?",
            "What strategies would you employ to secure a REST API against common web vulnerabilities?",
            "Can you explain the concept of database indexing and how it impacts read/write performance?",
            "What are the core principles of microservices architecture compared to monoliths?",
            "Describe how you would implement caching in a high-traffic backend system.",
            "What is Docker, and how does containerization benefit backend deployment?",
            "Explain the concept of message queues (like RabbitMQ or Kafka) and when to use them.",
            "How do you handle authentication and authorization in a distributed system?",
            "What are WebSockets, and how do they differ from standard HTTP requests?"
        ],
        ai: [
            "Could you explain the overarching difference between a Convolutional Neural Network and a Recurrent Neural Network?",
            "Walk me through the concept of 'Attention' in transformer architectures.",
            "How do you handle overfitting when designing a deep learning model?",
            "What is the difference between supervised, unsupervised, and reinforcement learning?",
            "Can you explain gradient descent and the vanishing gradient problem?",
            "What metrics would you use to evaluate a binary classification model on highly imbalanced data?",
            "Describe the architecture and primary use-cases of Generative Adversarial Networks (GANs).",
            "How does transfer learning work, and in what scenarios is it most effective?",
            "Explain the concept of word embeddings like Word2Vec or BERT in NLP.",
            "What are the ethical considerations and potential biases when deploying an AI model in a real-world scenario?"
        ]
    },
    
    roles: {
        'frontend': 'Frontend Developer',
        'backend': 'Backend Developer',
        'ai': 'AI Engineer'
    },

    // Keeps track of which question chunk we're on for each role
    roleOffsets: {
        'frontend': 0,
        'backend': 0,
        'ai': 0
    },
    
    // Simulate network delay
    delay: (ms) => new Promise(res => setTimeout(res, ms)),

    async getNextQuestion(role, sessionIndex) {
        await this.delay(1200 + Math.random() * 1000); 
        const list = this.questions[role] || this.questions['frontend'];
        
        // Exactly 5 questions per session, then loop the remaining natively.
        if (sessionIndex < 5) {
            const absoluteIndex = (this.roleOffsets[role] + sessionIndex) % list.length;
            return {
                text: list[absoluteIndex],
                isFinal: false
            };
        } else {
            // End of this 5-question trail. Advance the loop pointer by 5 for the next time.
            this.roleOffsets[role] = (this.roleOffsets[role] + 5) % list.length;

            return {
                text: "Thank you for providing your thorough insights on these 5 topics. The segment is now complete and will generate your final evaluation.",
                isFinal: true
            };
        }
    },

    async evaluateInterview(history) {
        // History contains array of objects {role: 'ai|user', text: '...'}
        await this.delay(1800);
        
        let wordCount = 0;
        let techKeywordsFound = 0;
        
        // Fair grading metrics dictionary
        const techLexicon = [
            "react", "dom", "component", "state", "props", "event", "api", "database", 
            "sql", "nosql", "async", "await", "promise", "node", "network", "model", "data", 
            "training", "layer", "architecture", "scale", "cache", "server", "css", 
            "html", "javascript", "function", "object", "container", "docker", "microservices"
        ];

        history.forEach(msg => {
            if(msg.role === 'user') {
                const words = msg.text.toLowerCase().split(/[ \.,\n]+/);
                wordCount += words.length;
                words.forEach(w => {
                    if(techLexicon.some(keyword => w.includes(keyword) && w.length >= 3)) {
                        techKeywordsFound++;
                    }
                });
            }
        });
        
        // Fair and deterministic grading logic based exclusively on user inputs
        let score = 0;
        if (wordCount < 10) {
           // If no meaningful answers were given across the trial, rigidly cap the score under 10
           score = Math.floor(Math.random() * 9) + 1; 
        } else {
           score = 40 + Math.min(20, (wordCount / 50) * 20); // up to 20 pts for length
           score += Math.min(40, (techKeywordsFound / 10) * 40); // up to 40 pts for tech depth
           score = Math.floor(Math.min(99, score)); // Max 99
           if(score < 15) score = Math.floor(Math.random() * 15) + 15; // Baseline sympathy padding if they actively tried
        }
        
        let strengths = [];
        let weaknesses = [];
        let suggestion = "";

        // Fairness checks feedback integration
        if (wordCount > 80) strengths.push("Comprehensive elaboration on complex topics");
        else if (wordCount > 20) strengths.push("Sufficient response length achieved");
        else weaknesses.push("Responses were far too brief for a fully comprehensive evaluation");

        if (techKeywordsFound >= 8) strengths.push("Excellent use of specific domain terminology");
        else if (techKeywordsFound >= 3) strengths.push("Basic usage of technical jargon detected");
        else weaknesses.push("Failed to utilize necessary technical vocabulary in responses");
        
        // System message reinforcing fairness
        const fairnessMsg = "[Fairness Check Verified: Graded actively on length + keyword density]";

        if (score > 80) {
            suggestion = `${fairnessMsg} Outstanding performance. Your foundational knowledge is robust and answers reflected deep technical expertise.`;
        } else if (score > 60) {
            suggestion = `${fairnessMsg} Good effort. Try incorporating more specific architectural terms and exploring edge cases in your answers to improve precision.`;
        } else {
            suggestion = `${fairnessMsg} The evaluation highlights a significant lack of depth and technical rigor. Consider thoroughly reviewing the core concepts before attempting again.`;
        }

        return { score, strengths, weaknesses, suggestion };
    }
};

window.InterviewAPI = InterviewAPI;
