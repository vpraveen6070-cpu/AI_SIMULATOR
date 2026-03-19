// main.js - Application Orchestrator

const App = {
    currentRole: null,
    
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
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
    window.App = App; // Expose globally
    setTimeout(() => { App.navigate('login'); }, 50);
});
