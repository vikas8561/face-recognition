/**
 * PehchanAI — Indian Traditional Dress Virtual Try-On
 * Main Application Controller — Immersive Edition
 */

(function () {
    'use strict';

    // ===== STATE =====
    const state = {
        capturedImage: null,
        capturedFile: null,
        selectedDress: null,
        selectedState: null,
        dressData: null,
        webcamStream: null,
        isProcessing: false,
        currentGender: 'boys',     // boys | girls
        currentState: 'all',       // all | state_id
        searchQuery: '',
    };

    // ===== CULTURAL FACTS FOR PROCESSING SCREEN =====
    const culturalFacts = [
        "India has over 30 UNESCO World Heritage textile traditions!",
        "The Banarasi silk saree can take up to 6 months to weave by hand.",
        "India is the world's second-largest textile exporter after China.",
        "The Pashmina shawl is made from the fine wool of Changthangi goats found only in Ladakh.",
        "India produces 97% of the world's raw silk varieties.",
        "The art of Bandhani (tie-dye) in India dates back 5,000 years!",
        "Indian textiles were so prized that the word 'calico' comes from the Indian city Kozhikode.",
        "Rajasthan's textile market is worth over ₹30,000 crore!",
        "Indian weavers can create over 100 different types of saree draping styles!",
        "The Muga silk of Assam is the only golden silk in the world and lasts 50+ years.",
        "A single Kanjeevaram saree uses real gold threads and can weigh over 1 kg!",
        "India has over 4.3 million handloom workers — the world's largest handloom workforce.",
        "The Himachali cap's pattern can tell you exactly which valley the wearer belongs to!",
        "A Punjabi Phulkari dupatta creates patterns entirely from the back of the fabric!",
        "A traditional Rajasthani Ghagra can have up to 15 meters of fabric in its flare!",
    ];

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        createHeroParticles();
        loadDressData();
        setupNavigation();
        setupWebcam();
        setupFileUpload();
        setupGenderToggle();
        setupGallerySearch();
        setupModal();
        setupResultActions();
    }

    // ===== HERO PARTICLES =====
    function createHeroParticles() {
        const container = document.getElementById('hero-particles');
        if (!container) return;

        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'hero-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = (Math.random() * 15) + 's';
            particle.style.width = (Math.random() * 3 + 1) + 'px';
            particle.style.height = particle.style.width;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            container.appendChild(particle);
        }
    }

    // ===== DATA LOADING =====
    async function loadDressData() {
        try {
            const res = await fetch('/api/dresses');
            if (!res.ok) throw new Error('Failed to load dress data');
            state.dressData = await res.json();
            onDataLoaded();
        } catch (err) {
            console.error('Error loading dress data:', err);
            try {
                const res = await fetch('/static/data/dresses.json');
                state.dressData = await res.json();
                onDataLoaded();
            } catch (e) {
                console.error('Fallback failed too:', e);
            }
        }
    }

    function onDataLoaded() {
        updateGenderCounts();
        renderStatePills();
        renderGallery();
        updateHeroDressCount();
    }

    function updateHeroDressCount() {
        if (!state.dressData) return;
        let total = 0;
        state.dressData.states.forEach(s => {
            total += s.dresses.length;
        });
        const el = document.getElementById('hero-dress-count');
        if (el) el.textContent = total;
    }

    // ===== NAVIGATION =====
    function setupNavigation() {
        const nav = document.getElementById('main-nav');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });

        document.querySelectorAll('.nav-link, .hero-actions a, .hero-scroll-indicator').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });

        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    const id = entry.target.id;
                    const activeLink = document.querySelector(`.nav-link[data-section="${id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(s => observer.observe(s));

        // Fade-in animations
        const fadeObserverOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };
        const fadeObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, fadeObserverOptions);

        state.fadeObserver = fadeObserver;

        document.querySelectorAll('.step-card, .about-card').forEach((card, index) => {
            card.classList.add('fade-in-hidden');
            card.style.transitionDelay = `${(index % 4) * 0.15}s`;
            fadeObserver.observe(card);
        });
    }

    // ===== WEBCAM =====
    function setupWebcam() {
        const btnStart = document.getElementById('btn-start-webcam');
        const btnCapture = document.getElementById('btn-capture');
        const btnRetake = document.getElementById('btn-retake');

        btnStart.addEventListener('click', startWebcam);
        btnCapture.addEventListener('click', capturePhoto);
        btnRetake.addEventListener('click', retakePhoto);
    }

    async function startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                    facingMode: 'user',
                },
                audio: false,
            });

            state.webcamStream = stream;
            const video = document.getElementById('webcam-video');
            video.srcObject = stream;

            document.getElementById('capture-placeholder').style.display = 'none';
            document.getElementById('webcam-container').style.display = 'block';
            document.getElementById('capture-area').classList.add('active');

        } catch (err) {
            console.error('Webcam error:', err);
            alert('Unable to access webcam. Please check permissions or try uploading a photo instead.');
        }
    }

    function capturePhoto() {
        const video = document.getElementById('webcam-video');
        const flash = document.getElementById('webcam-flash');

        flash.classList.add('flash');
        setTimeout(() => flash.classList.remove('flash'), 400);

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            state.capturedFile = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
            state.capturedImage = URL.createObjectURL(blob);
            showPreview();
        }, 'image/jpeg', 0.92);

        stopWebcam();
    }

    function stopWebcam() {
        if (state.webcamStream) {
            state.webcamStream.getTracks().forEach(track => track.stop());
            state.webcamStream = null;
        }
    }

    function showPreview() {
        document.getElementById('webcam-container').style.display = 'none';
        document.getElementById('capture-placeholder').style.display = 'none';

        const preview = document.getElementById('preview-container');
        const img = document.getElementById('preview-image');
        img.src = state.capturedImage;
        preview.style.display = 'block';

        document.getElementById('capture-area').classList.add('active');
    }

    function retakePhoto() {
        state.capturedImage = null;
        state.capturedFile = null;

        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('capture-placeholder').style.display = 'block';
        document.getElementById('capture-area').classList.remove('active');
    }

    // ===== FILE UPLOAD =====
    function setupFileUpload() {
        const fileInput = document.getElementById('file-upload');
        fileInput.addEventListener('change', handleFileUpload);

        const captureArea = document.getElementById('capture-area');
        captureArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            captureArea.style.borderColor = 'var(--primary-400)';
            captureArea.style.background = 'var(--primary-50)';
        });

        captureArea.addEventListener('dragleave', () => {
            captureArea.style.borderColor = '';
            captureArea.style.background = '';
        });

        captureArea.addEventListener('drop', (e) => {
            e.preventDefault();
            captureArea.style.borderColor = '';
            captureArea.style.background = '';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processUploadedFile(files[0]);
            }
        });
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) processUploadedFile(file);
    }

    function processUploadedFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG, or WebP).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large. Please upload an image under 10MB.');
            return;
        }

        state.capturedFile = file;
        state.capturedImage = URL.createObjectURL(file);
        stopWebcam();
        showPreview();
    }

    // ===== GENDER TOGGLE =====
    function setupGenderToggle() {
        const boysBtn = document.getElementById('btn-gender-boys');
        const girlsBtn = document.getElementById('btn-gender-girls');

        boysBtn.addEventListener('click', () => setGender('boys'));
        girlsBtn.addEventListener('click', () => setGender('girls'));
    }

    function setGender(gender) {
        state.currentGender = gender;
        state.currentState = 'all';

        // Update toggle UI
        const slider = document.getElementById('gender-slider');
        const boysBtn = document.getElementById('btn-gender-boys');
        const girlsBtn = document.getElementById('btn-gender-girls');

        slider.className = 'gender-toggle-slider ' + gender;

        if (gender === 'boys') {
            boysBtn.classList.add('active');
            girlsBtn.classList.remove('active');
        } else {
            girlsBtn.classList.add('active');
            boysBtn.classList.remove('active');
        }

        renderStatePills();
        renderGallery();
    }

    function updateGenderCounts() {
        if (!state.dressData) return;

        let boysCount = 0;
        let girlsCount = 0;

        state.dressData.states.forEach(stateObj => {
            stateObj.dresses.forEach(dress => {
                if (dress.gender === 'boys') boysCount++;
                else if (dress.gender === 'girls') girlsCount++;
            });
        });

        const boysEl = document.getElementById('boys-count');
        const girlsEl = document.getElementById('girls-count');
        if (boysEl) boysEl.textContent = boysCount;
        if (girlsEl) girlsEl.textContent = girlsCount;
    }

    // ===== STATE FILTER PILLS =====
    function renderStatePills() {
        const bar = document.getElementById('state-filter-bar');
        if (!bar || !state.dressData) return;

        let html = `<button class="state-pill active" data-state="all" data-gender="${state.currentGender}">
            <span class="state-pill-dot" style="background: var(--primary-500)"></span>
            All States
            <span class="state-pill-count">${getGenderCount('all')}</span>
        </button>`;

        state.dressData.states.forEach(stateObj => {
            const count = getGenderCountForState(stateObj.id);
            if (count > 0) {
                html += `<button class="state-pill" data-state="${stateObj.id}" data-gender="${state.currentGender}">
                    <span class="state-pill-dot" style="background: ${stateObj.color}"></span>
                    ${stateObj.name}
                    <span class="state-pill-count">${count}</span>
                </button>`;
            }
        });

        bar.innerHTML = html;

        // Event listeners
        bar.querySelectorAll('.state-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                bar.querySelectorAll('.state-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.currentState = pill.dataset.state;
                renderGallery();
            });
        });
    }

    function getGenderCount(stateFilter) {
        if (!state.dressData) return 0;
        let count = 0;
        state.dressData.states.forEach(stateObj => {
            if (stateFilter !== 'all' && stateObj.id !== stateFilter) return;
            stateObj.dresses.forEach(dress => {
                if (dress.gender === state.currentGender) count++;
            });
        });
        return count;
    }

    function getGenderCountForState(stateId) {
        if (!state.dressData) return 0;
        let count = 0;
        state.dressData.states.forEach(stateObj => {
            if (stateObj.id !== stateId) return;
            stateObj.dresses.forEach(dress => {
                if (dress.gender === state.currentGender) count++;
            });
        });
        return count;
    }

    // ===== GALLERY =====
    function setupGallerySearch() {
        const searchInput = document.getElementById('gallery-search');
        const clearBtn = document.getElementById('search-clear');

        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            clearBtn.style.display = state.searchQuery ? 'flex' : 'none';
            renderGallery();
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            state.searchQuery = '';
            clearBtn.style.display = 'none';
            renderGallery();
        });
    }

    function renderGallery() {
        const grid = document.getElementById('gallery-grid');
        const empty = document.getElementById('gallery-empty');

        if (!state.dressData || !state.dressData.states) {
            grid.innerHTML = '<p style="text-align:center;color:var(--neutral-400);grid-column:1/-1;">Loading dresses...</p>';
            return;
        }

        let cards = [];
        let index = 0;

        state.dressData.states.forEach(stateObj => {
            // State filter
            if (state.currentState !== 'all' && stateObj.id !== state.currentState) return;

            stateObj.dresses.forEach(dress => {
                // Gender filter
                if (dress.gender !== state.currentGender) return;

                // Search filter
                if (state.searchQuery) {
                    const searchStr = `${stateObj.name} ${dress.name} ${dress.description} ${dress.fabric} ${dress.occasion}`.toLowerCase();
                    if (!searchStr.includes(state.searchQuery)) return;
                }

                cards.push(createDressCard(stateObj, dress, index));
                index++;
            });
        });

        if (cards.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            grid.innerHTML = cards.join('');
        }

        // Attach click handlers and animate cards
        grid.querySelectorAll('.dress-card').forEach((card, idx) => {
            card.classList.add('card-entering');
            card.style.animationDelay = `${idx * 0.08}s`;

            card.addEventListener('click', () => {
                const dressId = card.dataset.dressId;
                const stateId = card.dataset.stateId;
                openDressModal(stateId, dressId);
            });
        });
    }

    function createDressCard(stateObj, dress, index) {
        const genderLabel = dress.gender === 'boys' ? 'Boys' : 'Girls';
        const genderClass = dress.gender;
        const imgSrc = `/static/images/${dress.garment_image}`;

        return `
            <div class="dress-card" data-dress-id="${dress.id}" data-state-id="${stateObj.id}" data-gender="${dress.gender}">
                <div class="dress-card-image">
                    <img src="${imgSrc}" alt="${dress.name}" loading="lazy">
                    <span class="dress-card-state-chip">${stateObj.name}</span>
                    <span class="dress-card-gender ${genderClass}">${genderLabel}</span>
                </div>
                <div class="dress-card-body">
                    <div class="dress-card-name">${dress.name}</div>
                    <div class="dress-card-region">${stateObj.name} • North India</div>
                    <div class="dress-card-desc">${dress.description}</div>
                    <div class="dress-card-footer">
                        <span class="dress-card-fabric">🧵 ${truncate(dress.fabric, 28)}</span>
                        <span class="dress-card-cta">View details →</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== MODAL =====
    function setupModal() {
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('dress-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        document.getElementById('btn-try-on-modal').addEventListener('click', handleTryOn);
    }

    function openDressModal(stateId, dressId) {
        if (!state.dressData) return;

        let stateObj, dress;
        for (const s of state.dressData.states) {
            if (s.id === stateId) {
                stateObj = s;
                dress = s.dresses.find(d => d.id === dressId);
                break;
            }
        }

        if (!stateObj || !dress) return;

        state.selectedDress = dress;
        state.selectedState = stateObj;

        // Set modal image
        const imgSrc = `/static/images/${dress.garment_image}`;
        const modalImageArea = document.querySelector('.modal-image-area');
        const existingImg = document.getElementById('modal-dress-image');

        if (existingImg.tagName === 'IMG') {
            existingImg.src = imgSrc;
            existingImg.alt = dress.name;
        } else {
            modalImageArea.innerHTML = `<img id="modal-dress-image" src="${imgSrc}" alt="${dress.name}">
                <div class="modal-state-badge" id="modal-state-badge">${stateObj.name}</div>`;
        }

        document.getElementById('modal-state-badge').textContent = stateObj.name;

        const genderBadge = document.getElementById('modal-gender-badge');
        genderBadge.textContent = capitalize(dress.gender);
        genderBadge.className = `modal-gender-badge ${dress.gender}`;

        document.getElementById('modal-dress-name').textContent = dress.name;
        document.getElementById('modal-dress-state').textContent = `${stateObj.name} • North India`;
        document.getElementById('modal-dress-description').textContent = dress.description;

        document.getElementById('modal-fabric').textContent = dress.fabric;
        document.getElementById('modal-colors').textContent = dress.colors;
        document.getElementById('modal-occasion').textContent = dress.occasion;

        document.getElementById('modal-cultural-text').textContent = dress.cultural_significance;
        document.getElementById('modal-funfact-text').textContent = dress.fun_fact;

        // Update try-on button state
        const tryOnBtn = document.getElementById('btn-try-on-modal');
        const tryOnNote = document.getElementById('modal-try-on-note');

        if (state.capturedImage) {
            tryOnBtn.disabled = false;
            tryOnBtn.style.opacity = '1';
            tryOnNote.style.display = 'none';
        } else {
            tryOnBtn.disabled = false;
            tryOnBtn.style.opacity = '1';
            tryOnNote.style.display = 'block';
        }

        // Show modal
        document.getElementById('dress-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('dress-modal').style.display = 'none';
        document.body.style.overflow = '';
    }

    // ===== TRY-ON =====
    async function handleTryOn() {
        if (!state.selectedDress) {
            alert('Please select a dress first.');
            return;
        }

        if (!state.capturedImage || !state.capturedFile) {
            alert('Please capture or upload a photo first! Scroll up to the "Capture Your Photo" section.');
            closeModal();
            document.getElementById('capture').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (state.isProcessing) return;
        state.isProcessing = true;

        closeModal();
        showProcessing();

        try {
            const formData = new FormData();
            formData.append('person', state.capturedFile);
            formData.append('dress_id', state.selectedDress.id);

            animateProgress();

            const response = await fetch('/api/try-on', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                showResult(result);
            } else {
                hideProcessing();
                alert(`Try-on failed: ${result.error}\n\nThis may be because the AI service is busy. Please try again in a moment.`);
            }
        } catch (err) {
            hideProcessing();
            console.error('Try-on error:', err);
            alert('An error occurred while processing. Please check your internet connection and try again.');
        } finally {
            state.isProcessing = false;
        }
    }

    // ===== PROCESSING SCREEN =====
    function showProcessing() {
        const overlay = document.getElementById('processing-overlay');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (state.selectedDress && state.selectedState) {
            document.getElementById('processing-subtitle').textContent =
                `Dressing you in ${state.selectedDress.name} from ${state.selectedState.name}...`;
        }

        showRandomFact();
        state._factInterval = setInterval(showRandomFact, 3000);
    }

    function hideProcessing() {
        const overlay = document.getElementById('processing-overlay');
        overlay.style.display = 'none';
        document.body.style.overflow = '';

        if (state._factInterval) {
            clearInterval(state._factInterval);
            state._factInterval = null;
        }

        document.getElementById('progress-fill').style.width = '0%';
    }

    function showRandomFact() {
        const fact = culturalFacts[Math.floor(Math.random() * culturalFacts.length)];
        const factText = document.getElementById('processing-fact-text');
        factText.style.opacity = '0';
        setTimeout(() => {
            factText.textContent = fact;
            factText.style.opacity = '1';
        }, 300);
    }

    function animateProgress() {
        const fill = document.getElementById('progress-fill');
        const text = document.getElementById('progress-text');

        const stages = [
            { pct: 10, msg: 'Uploading your photo...', time: 200 },
            { pct: 40, msg: 'Extracting face features...', time: 1000 },
            { pct: 70, msg: 'Swapping face onto model...', time: 2000 },
            { pct: 90, msg: 'Applying final touches...', time: 3500 },
        ];

        stages.forEach(stage => {
            setTimeout(() => {
                if (state.isProcessing) {
                    fill.style.width = stage.pct + '%';
                    text.textContent = stage.msg;
                }
            }, stage.time);
        });
    }

    // ===== RESULT =====
    function showResult(result) {
        hideProcessing();

        document.getElementById('result-original').src = state.capturedImage;
        document.getElementById('result-tryon').src = result.result_url;

        if (state.selectedDress && state.selectedState) {
            document.getElementById('result-description').textContent =
                `You in ${state.selectedDress.name} from ${state.selectedState.name}`;
            document.getElementById('result-dress-name').textContent = state.selectedDress.name;
            document.getElementById('result-dress-name-badge').textContent = `In ${state.selectedDress.name}`;
            document.getElementById('result-dress-state').textContent =
                `${state.selectedState.name} • North India`;
        }

        const timeText = result.cached
            ? `Served from cache (${result.processing_time}s)`
            : `Generated by AI in ${result.processing_time}s`;
        document.getElementById('result-time').textContent = timeText;

        const resultSection = document.getElementById('result');
        resultSection.style.display = 'block';

        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);

        document.getElementById('progress-fill').style.width = '100%';
    }

    function setupResultActions() {
        document.getElementById('btn-download-result').addEventListener('click', () => {
            const img = document.getElementById('result-tryon');
            const link = document.createElement('a');
            link.href = img.src;
            link.download = `PehchanAI_${state.selectedDress?.name || 'result'}_${Date.now()}.png`;
            link.click();
        });

        document.getElementById('btn-try-another').addEventListener('click', () => {
            document.getElementById('result').style.display = 'none';
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('btn-new-photo').addEventListener('click', () => {
            document.getElementById('result').style.display = 'none';
            retakePhoto();
            document.getElementById('capture').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ===== UTILITIES =====
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function truncate(str, max) {
        if (!str) return '';
        return str.length > max ? str.slice(0, max) + '…' : str;
    }

})();
