// ============================================
// CAPTION ART - APPLICATION LOGIC
// Modern JavaScript with Animations
// ============================================

// State Management
const state = {
    selectedStyle: 'creative',
    currentImage: null,
    gallery: []
};

// Caption Templates by Style
const captionTemplates = {
    creative: [
        "Where imagination meets reality ✨",
        "A moment frozen in time, painted with dreams",
        "Poetry in motion, captured in stillness",
        "When art whispers, the soul listens",
        "Dancing between light and shadow",
        "The universe in a single frame"
    ],
    funny: [
        "When you accidentally take a masterpiece 📸",
        "Plot twist: This wasn't planned",
        "Professional over-thinker at work",
        "My phone's camera: *chef's kiss*",
        "Accidentally renaissance",
        "This photo has main character energy"
    ],
    poetic: [
        "Soft whispers of forgotten dreams 🌸",
        "In the garden of memory, flowers bloom eternal",
        "Time flows like water through ancient stones",
        "Stars remember what we forget",
        "The moon writes poetry on silent waters",
        "Between heartbeats, infinity breathes"
    ],
    minimal: [
        "Less is more ⚪",
        "Simplicity speaks volumes",
        "Clean lines, clear mind",
        "Essence over excess",
        "Minimal yet meaningful",
        "Pure. Simple. Perfect."
    ],
    dramatic: [
        "A tale written in light and shadow 🎭",
        "The crescendo of a silent symphony",
        "When destiny meets the lens",
        "Chronicles of the extraordinary",
        "Epic moments deserve epic frames",
        "The stage is set, history awaits"
    ],
    quirky: [
        "Delightfully weird, wonderfully unique 🎪",
        "Normal is overrated anyway",
        "Chaos with a creative license",
        "Perfectly imperfect in every way",
        "Embracing the beautiful bizarre",
        "Too cool for conventional"
    ]
};

// DOM Elements
const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    themeToggle: document.getElementById('themeToggle'),

    // Views
    generatorView: document.getElementById('generatorView'),
    galleryView: document.getElementById('galleryView'),

    // Upload
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    previewContainer: document.getElementById('previewContainer'),
    preview: document.getElementById('preview'),
    removeBtn: document.getElementById('removeBtn'),

    // Style Selection
    styleBtns: document.querySelectorAll('.style-btn'),

    // Generate
    generateBtn: document.getElementById('generateBtn'),
    loadingBar: document.getElementById('loadingBar'),

    // Results
    resultsCard: document.getElementById('resultsCard'),
    captionText: document.getElementById('captionText'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    shareBtn: document.getElementById('shareBtn'),

    // Gallery
    galleryGrid: document.getElementById('galleryGrid'),
    clearGallery: document.getElementById('clearGallery'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ============================================
// INITIALIZATION
// ============================================

function init() {
    setupEventListeners();
    loadGalleryFromStorage();
    checkSystemTheme();
    addEntryAnimation();
}

// Add entry animations
function addEntryAnimation() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', handleNavigation);
    });

    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Upload
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);
    elements.removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage();
    });

    // Style Selection
    elements.styleBtns.forEach(btn => {
        btn.addEventListener('click', handleStyleSelect);
    });

    // Generate
    elements.generateBtn.addEventListener('click', generateCaption);
    elements.regenerateBtn.addEventListener('click', generateCaption);

    // Actions
    elements.copyBtn.addEventListener('click', copyCaption);
    elements.downloadBtn.addEventListener('click', downloadCaption);
    elements.shareBtn.addEventListener('click', shareCaption);

    // Gallery
    elements.clearGallery.addEventListener('click', clearGallery);
}

// ============================================
// NAVIGATION
// ============================================

function handleNavigation(e) {
    const view = e.target.dataset.view;

    // Update active nav button
    elements.navBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Switch views with animation
    if (view === 'generator') {
        elements.galleryView.classList.remove('active');
        setTimeout(() => {
            elements.generatorView.classList.add('active');
        }, 100);
    } else if (view === 'gallery') {
        elements.generatorView.classList.remove('active');
        setTimeout(() => {
            elements.galleryView.classList.add('active');
        }, 100);
    }
}

// ============================================
// THEME TOGGLE
// ============================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update icon
    const icon = elements.themeToggle.querySelector('.theme-icon');
    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

    showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
}

function checkSystemTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    const icon = elements.themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============================================
// IMAGE UPLOAD
// ============================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function loadImage(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        state.currentImage = e.target.result;
        elements.preview.src = e.target.result;
        elements.uploadZone.querySelector('.upload-placeholder').style.display = 'none';
        elements.previewContainer.style.display = 'block';
        elements.generateBtn.disabled = false;

        // Animate preview
        elements.preview.style.transform = 'scale(0)';
        setTimeout(() => {
            elements.preview.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            elements.preview.style.transform = 'scale(1)';
        }, 10);

        showToast('Image loaded successfully!');
    };

    reader.readAsDataURL(file);
}

function removeImage() {
    state.currentImage = null;
    elements.preview.src = '';
    elements.uploadZone.querySelector('.upload-placeholder').style.display = 'block';
    elements.previewContainer.style.display = 'none';
    elements.generateBtn.disabled = true;
    elements.fileInput.value = '';

    // Hide results
    elements.resultsCard.style.display = 'none';
}

// ============================================
// STYLE SELECTION
// ============================================

function handleStyleSelect(e) {
    const btn = e.currentTarget;
    const style = btn.dataset.style;

    // Update active style
    elements.styleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.selectedStyle = style;

    // Bounce animation
    btn.style.animation = 'none';
    setTimeout(() => {
        btn.style.animation = 'bounce 0.5s ease';
    }, 10);
}

// ============================================
// CAPTION GENERATION
// ============================================

function generateCaption() {
    if (!state.currentImage) return;

    // Show loading
    elements.loadingBar.style.display = 'block';
    const progress = elements.loadingBar.querySelector('.loading-progress');
    progress.style.width = '0%';

    // Simulate API call with progress
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 30;
        if (currentProgress > 90) currentProgress = 90;
        progress.style.width = currentProgress + '%';
    }, 200);

    // Generate caption after delay
    setTimeout(() => {
        clearInterval(progressInterval);
        progress.style.width = '100%';

        setTimeout(() => {
            elements.loadingBar.style.display = 'none';
            displayCaption();
        }, 300);
    }, 2000);
}

function displayCaption() {
    // Get random caption from selected style
    const templates = captionTemplates[state.selectedStyle];
    const caption = templates[Math.floor(Math.random() * templates.length)];

    // Display caption with typewriter effect
    elements.captionText.textContent = '';
    elements.resultsCard.style.display = 'block';

    let i = 0;
    const typeWriter = setInterval(() => {
        if (i < caption.length) {
            elements.captionText.textContent += caption.charAt(i);
            i++;
        } else {
            clearInterval(typeWriter);
            // Save to gallery
            saveToGallery(caption);
        }
    }, 30);

    showToast('Caption generated! 🎉');
}

// ============================================
// ACTIONS
// ============================================

function copyCaption() {
    const caption = elements.captionText.textContent;
    navigator.clipboard.writeText(caption).then(() => {
        showToast('Copied to clipboard! 📋');

        // Visual feedback
        elements.copyBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            elements.copyBtn.style.transform = 'scale(1)';
        }, 100);
    });
}

function downloadCaption() {
    const caption = elements.captionText.textContent;
    const image = state.currentImage;

    // Create canvas to combine image and caption
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height + 150;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Draw caption background
        ctx.fillStyle = '#FFE66D';
        ctx.fillRect(0, img.height, canvas.width, 150);

        // Draw border
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, img.height, canvas.width, 150);

        // Draw caption text
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 24px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap text
        const maxWidth = canvas.width - 40;
        const words = caption.split(' ');
        let line = '';
        let y = img.height + 75;

        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += 30;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, canvas.width / 2, y);

        // Download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `caption-art-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);

            showToast('Downloaded! 💾');
        });
    };

    img.src = image;
}

function shareCaption() {
    const caption = elements.captionText.textContent;

    if (navigator.share) {
        navigator.share({
            title: 'Caption Art',
            text: caption
        }).then(() => {
            showToast('Shared successfully! 🔗');
        }).catch(() => {
            fallbackShare(caption);
        });
    } else {
        fallbackShare(caption);
    }
}

function fallbackShare(caption) {
    // Fallback: copy link to clipboard
    const url = window.location.href;
    navigator.clipboard.writeText(`${caption}\n\nCreated with Caption Art: ${url}`).then(() => {
        showToast('Link copied to clipboard! 🔗');
    });
}

// ============================================
// GALLERY
// ============================================

function saveToGallery(caption) {
    const item = {
        image: state.currentImage,
        caption: caption,
        style: state.selectedStyle,
        timestamp: Date.now()
    };

    state.gallery.unshift(item);

    // Limit gallery size
    if (state.gallery.length > 20) {
        state.gallery = state.gallery.slice(0, 20);
    }

    saveGalleryToStorage();
    renderGallery();
}

function renderGallery() {
    elements.galleryGrid.innerHTML = '';

    if (state.gallery.length === 0) {
        elements.galleryGrid.innerHTML = `
            <div class="gallery-empty">
                <span class="empty-icon">🖼️</span>
                <p>No captions yet. Start creating!</p>
            </div>
        `;
        return;
    }

    state.gallery.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.style.animationDelay = `${index * 0.1}s`;
        galleryItem.innerHTML = `
            <img src="${item.image}" alt="Gallery item" class="gallery-image">
            <p class="gallery-caption">${item.caption}</p>
        `;
        elements.galleryGrid.appendChild(galleryItem);
    });
}

function clearGallery() {
    if (confirm('Are you sure you want to clear all gallery items?')) {
        state.gallery = [];
        saveGalleryToStorage();
        renderGallery();
        showToast('Gallery cleared! 🗑️');
    }
}

function saveGalleryToStorage() {
    try {
        localStorage.setItem('captionArtGallery', JSON.stringify(state.gallery));
    } catch (e) {
        console.error('Failed to save gallery:', e);
    }
}

function loadGalleryFromStorage() {
    try {
        const saved = localStorage.getItem('captionArtGallery');
        if (saved) {
            state.gallery = JSON.parse(saved);
            renderGallery();
        }
    } catch (e) {
        console.error('Failed to load gallery:', e);
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ============================================
// EASTER EGGS & FUN
// ============================================

// Konami code easter egg
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (konamiCode.join(',') === konamiSequence.join(',')) {
        activatePartyMode();
    }
});

function activatePartyMode() {
    showToast('🎉 PARTY MODE ACTIVATED! 🎉');
    document.body.style.animation = 'rainbow 2s linear infinite';

    setTimeout(() => {
        document.body.style.animation = '';
    }, 5000);
}

// Add rainbow animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZE APP
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add some fun console message
console.log('%c✨ Caption Art ✨', 'font-size: 24px; font-weight: bold; color: #FF6B6B;');
console.log('%cMade with love and modern web design 💖', 'font-size: 14px; color: #4ECDC4;');
console.log('%cTry the Konami code for a surprise! 🎮', 'font-size: 12px; color: #FFE66D;');
