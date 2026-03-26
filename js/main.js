// main.js - Application Orchestrator

const App = {
    currentRole: null,
    isLoggedIn: false,
    
    login() {
        this.isLoggedIn = true;
        const navLogin = document.querySelector('.nav-menu [data-target="login"]');
        if (navLogin && navLogin.parentElement) {
            navLogin.parentElement.style.display = 'none';
        }
        const navHistory = document.getElementById('nav-history-item');
        if (navHistory) {
            navHistory.style.display = 'block';
        }
        this.navigate('role');
    },
    
    HistoryManager: {
        getHistory() {
            let hist = localStorage.getItem('ai_interview_history');
            if (!hist) {
                const initialMocks = [
                    { role: 'frontend', roleName: 'Frontend Developer', score: 92, date: '2026-03-18 | 14:30:00' },
                    { role: 'ai', roleName: 'AI Engineer', score: 78, date: '2026-03-15 | 09:15:22' },
                    { role: 'backend', roleName: 'Backend Developer', score: 64, date: '2026-03-10 | 18:45:10' },
                    { role: 'frontend', roleName: 'Frontend Developer', score: 88, date: '2026-02-28 | 10:20:00' },
                    { role: 'backend', roleName: 'Backend Developer', score: 95, date: '2026-02-25 | 16:00:00' },
                    { role: 'ai', roleName: 'AI Engineer', score: 82, date: '2026-02-20 | 11:11:11' },
                    { role: 'frontend', roleName: 'Frontend Developer', score: 74, date: '2026-02-15 | 13:45:00' },
                    { role: 'backend', roleName: 'Backend Developer', score: 89, date: '2026-02-10 | 09:00:00' },
                    { role: 'ai', roleName: 'AI Engineer', score: 91, date: '2026-02-05 | 15:30:22' },
                    { role: 'frontend', roleName: 'Frontend Developer', score: 68, date: '2026-01-30 | 14:20:10' }
                ];
                localStorage.setItem('ai_interview_history', JSON.stringify(initialMocks));
                return initialMocks;
            }
            return JSON.parse(hist);
        },
        addHistory(item) {
            let hist = this.getHistory();
            hist.unshift(item);
            if (hist.length > 50) {
                hist.pop();
            }
            localStorage.setItem('ai_interview_history', JSON.stringify(hist));
        }
    },

    init() {
        this.initCursor();
        this.initRouting();
    },

    initCursor() {
        // Only run on non-touch devices
        if (window.matchMedia("(pointer: coarse)").matches) return;

        const cursorDot = document.getElementById('cursor-dot');
        const cursorOutline = document.getElementById('cursor-outline');
        
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 100, fill: "forwards" });
        });

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.interactable') || e.target.closest('button') || e.target.closest('.tilt-card')) {
                cursorOutline.classList.add('cursor-hover');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if(e.target.closest('.interactable') || e.target.closest('button') || e.target.closest('.tilt-card')) {
                cursorOutline.classList.remove('cursor-hover');
            }
        });
    },

    initRouting() {
        // Bind all data-target elements like Top Nav links globally
        document.querySelectorAll('[data-target]').forEach(elem => {
            elem.removeEventListener('click', elem._navHandler);
            elem._navHandler = (e) => {
                const target = elem.getAttribute('data-target');
                if (target) this.navigate(target);
            };
            elem.addEventListener('click', elem._navHandler);
        });
    },

    async navigate(page) {
        if (page === 'login' && this.isLoggedIn) {
            page = 'role';
        }
        if (page === 'history' && !this.isLoggedIn) {
            page = 'login';
        }
        
        const dynamicContent = document.getElementById('dynamic-content');
        const loading = document.getElementById('loading-screen');
        
        if (dynamicContent.classList.contains('active')) {
            dynamicContent.classList.remove('active');
            // Wait for CSS transition fade out
            await new Promise(r => setTimeout(r, 400)); 
            dynamicContent.innerHTML = '';
        }

        loading.classList.remove('hidden');

        if (window.ThreeEngine && typeof window.ThreeEngine.transitionCameraForView === 'function') {
            window.ThreeEngine.transitionCameraForView(page);
        }

        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) throw new Error(`Page ${page} not found`);
            const html = await response.text();
            
            // Random delay to simulate complex AI routing
            const delayTime = 400 + Math.random() * 500;
            
            setTimeout(() => {
                loading.classList.add('hidden');
                dynamicContent.innerHTML = html;
                
                // Trigger reflow for animation
                void dynamicContent.offsetWidth; 
                
                dynamicContent.classList.add('active');
                this.initPageScripts(page);
                
                // Modify Three.js camera position depending on view for depth parallax transition
                if (window.ThreeEngine) {
                    window.ThreeEngine.transitionCameraForView(page);
                }
            }, delayTime);
            
        } catch (error) {
            console.error('Routing error:', error);
            loading.classList.add('hidden');
        }
    },

    initPageScripts(page) {
        if (page === 'role') {
            document.querySelectorAll('.tilt-card').forEach(card => {
                // Remove existing listeners if any
                card.removeEventListener('click', card.clicker);
                
                card.clicker = () => {
                    this.currentRole = card.dataset.role;
                    this.navigate('interview');
                };
                card.addEventListener('click', card.clicker);

                if (!window.matchMedia("(pointer: coarse)").matches) {
                    card.addEventListener('mousemove', (e) => {
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -15; 
                        const rotateY = ((x - centerX) / centerX) * 15;
                        
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                    });
                }
            });
        }
        
        if (page === 'interview') {
            if (window.InterviewController) {
                window.InterviewController.init(this.currentRole);
            }
        }

        if (page === 'result') {
            if (window.ResultController) {
                window.ResultController.init();
            }
        }

        if (page === 'history') {
            const container = document.getElementById('dynamic-history-list');
            if (container) {
                const history = this.HistoryManager.getHistory();
                container.innerHTML = history.map(h => {
                    let colorVar = '--success-green';
                    if (h.score < 70) colorVar = '--danger-red';
                    else if (h.score < 80) colorVar = '--neon-blue';
                    
                    let icon = 'fa-code';
                    if (h.role === 'backend') icon = 'fa-server';
                    if (h.role === 'ai') icon = 'fa-network-wired';

                    return `
                        <div class="history-card interactable" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-left:4px solid var(${colorVar}); padding:1.5rem 2rem; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h3 class="heading-font" style="font-size:1.3rem; color: #fff; display:flex; align-items:center; gap:10px;">
                                    <i class="fa-solid ${icon} text-muted"></i> ${h.roleName || h.role}
                                </h3>
                                <p class="text-muted mt-2" style="font-size:0.95rem; display:flex; align-items:center; gap:8px;">
                                    <i class="fa-regular fa-calendar-days"></i> ${h.date}
                                </p>
                            </div>
                            <div class="score-display text-center">
                                <div style="font-size:1.8rem; font-weight:700; color:var(${colorVar}); text-shadow:0 0 10px var(${colorVar});">${h.score}%</div>
                                <div class="text-muted" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">Match Rate</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
    window.App = App; // Expose globally
    setTimeout(() => { App.navigate('landing'); }, 50);
});
