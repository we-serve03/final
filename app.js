const sideBar = document.querySelector('.sidebar');
const menu = document.querySelector('.menu-icon');
const closeIcon = document.querySelector('.close-icon');

function openSidebar() {
    if (!sideBar) return;
    sideBar.classList.remove("close-sidebar");
    sideBar.classList.add("open-sidebar");
}

function closeSidebar() {
    if (!sideBar) return;
    sideBar.classList.remove("open-sidebar");
    sideBar.classList.add("close-sidebar");
}

if (menu && sideBar) {
    menu.addEventListener("click", openSidebar);
    menu.addEventListener("touchstart", (event) => {
        event.preventDefault();
        openSidebar();
    }, { passive: false });
}

if (closeIcon && sideBar) {
    closeIcon.addEventListener("click", closeSidebar);
    closeIcon.addEventListener("touchstart", (event) => {
        event.preventDefault();
        closeSidebar();
    }, { passive: false });
}

const sidebarLinks = document.querySelectorAll('.sidebar a');
sidebarLinks.forEach(link => {
    link.addEventListener("click", closeSidebar);
});

document.querySelectorAll('a[href^="#"], [data-scroll]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetSelector = this.getAttribute('href') || this.getAttribute('data-scroll');
        const target = document.querySelector(targetSelector);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

function setFormStatus(form, message, isError = false) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    let status = form.querySelector('.form-status');
    if (!status) {
        status = document.createElement('div');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        submitBtn.insertAdjacentElement('afterend', status);
    }

    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
    status.classList.toggle('is-success', !isError);
}

const formStatusStyle = document.createElement('style');
formStatusStyle.textContent = `
    .form-status {
        margin-top: 12px;
        font-size: 14px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(217, 155, 154, 0.45);
        background: #fff7f6;
        color: #352c2a;
    }
    .form-status.is-error {
        border-color: rgba(181, 75, 75, 0.6);
        background: #fff0f0;
        color: #6f2b2b;
    }
`;
document.head.appendChild(formStatusStyle);

function initFormspreeForms() {
    const forms = document.querySelectorAll('form[action*="formspree.io"]');
    if (!forms.length) return;

    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    setFormStatus(form, 'Thank you! Your message was sent.');
                    form.reset();
                } else {
                    setFormStatus(form, 'Sorry, something went wrong. Please try again.', true);
                }
            } catch (error) {
                setFormStatus(form, 'Network error. Please try again.', true);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    });
}

initFormspreeForms();

const lightbox = document.getElementById('lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
const lightboxClose = lightbox?.querySelector('.lightbox-close');
const lightboxBackdrop = lightbox?.querySelector('[data-lightbox-close]');
const portfolioCards = document.querySelectorAll('.portfolio-card');
const portfolioTrack = document.querySelector('.portfolio-track');
const portfolioPrevBtn = document.querySelector('.portfolio-slider .slider-btn-prev');
const portfolioNextBtn = document.querySelector('.portfolio-slider .slider-btn-next');
const videoTrack = document.querySelector('.media-track');
const videoPrevBtn = document.querySelector('.media-slider .slider-btn-prev');
const videoNextBtn = document.querySelector('.media-slider .slider-btn-next');

function openLightbox(card) {
    const img = card.querySelector('img');
    if (!img || !lightbox || !lightboxImage) return;
    const title = card.querySelector('h3')?.textContent?.trim();
    const desc = card.querySelector('p')?.textContent?.trim();

    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt || 'Portfolio preview';
    if (lightboxCaption) {
        lightboxCaption.textContent = [title, desc].filter(Boolean).join(' — ');
    }

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

if (portfolioTrack) {
    portfolioTrack.addEventListener('click', (event) => {
        const card = event.target.closest('.portfolio-card');
        if (card) {
            openLightbox(card);
        }
    });
}

function scrollPortfolio(direction) {
    if (!portfolioTrack) return;
    const scrollAmount = Math.round(portfolioTrack.clientWidth * 0.8);
    portfolioTrack.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

if (portfolioPrevBtn) {
    portfolioPrevBtn.addEventListener('click', () => scrollPortfolio(-1));
}

if (portfolioNextBtn) {
    portfolioNextBtn.addEventListener('click', () => scrollPortfolio(1));
}

function initInfiniteSlider(track, prevBtn, nextBtn, cloneAttr, options = {}) {
    if (!track) return;
    let loopReady = false;
    let originalWidth = 0;
    let startOffset = 0;
    let itemWidth = 0;
    let jumping = false;
    let cloneCount = 3;
    let autoTimer = null;
    const autoDelay = options.autoDelay || 2600;
    const autoStep = options.autoStep || 1;

    const clearClones = () => {
        const clones = track.querySelectorAll(`[${cloneAttr}="true"]`);
        clones.forEach(clone => clone.remove());
    };

    const setupLoop = () => {
        if (loopReady) return;
        const originalItems = Array.from(track.children);
        if (originalItems.length === 0) return;

        cloneCount = Math.max(1, originalItems.length);
        const headClones = originalItems.slice(0, cloneCount).map(item => {
            const clone = item.cloneNode(true);
            clone.setAttribute(cloneAttr, 'true');
            return clone;
        });
        const tailClones = originalItems.slice(-cloneCount).map(item => {
            const clone = item.cloneNode(true);
            clone.setAttribute(cloneAttr, 'true');
            return clone;
        });
        tailClones.forEach(clone => track.insertBefore(clone, track.firstChild));
        headClones.forEach(clone => track.appendChild(clone));

        const sample = originalItems[0];
        const trackStyle = window.getComputedStyle(track);
        const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0');
        const sampleWidth = sample.getBoundingClientRect().width;
        itemWidth = sampleWidth + gap;
        startOffset = itemWidth * cloneCount;
        originalWidth = itemWidth * originalItems.length;
        track.scrollLeft = startOffset;
        loopReady = true;
    };

    const rebuildLoop = () => {
        loopReady = false;
        clearClones();
        setupLoop();
    };

    const scrollByPage = (direction) => {
        const amount = Math.round(track.clientWidth * 0.8);
        track.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', () => scrollByPage(-1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => scrollByPage(1));
    }

    window.addEventListener('load', rebuildLoop);
    window.addEventListener('resize', () => {
        clearTimeout(track.__loopResize);
        track.__loopResize = setTimeout(rebuildLoop, 150);
    });

    track.addEventListener('scroll', () => {
        if (!loopReady || jumping) return;
        const left = track.scrollLeft;
        const min = startOffset - itemWidth;
        const max = startOffset + originalWidth;
        if (left <= min) {
            jumping = true;
            const prevBehavior = track.style.scrollBehavior;
            track.style.scrollBehavior = 'auto';
            track.scrollLeft = left + originalWidth;
            track.style.scrollBehavior = prevBehavior;
            requestAnimationFrame(() => { jumping = false; });
        } else if (left >= max) {
            jumping = true;
            const prevBehavior = track.style.scrollBehavior;
            track.style.scrollBehavior = 'auto';
            track.scrollLeft = left - originalWidth;
            track.style.scrollBehavior = prevBehavior;
            requestAnimationFrame(() => { jumping = false; });
        }
    });

    const stopAuto = () => {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    };

    const startAuto = () => {
        if (autoTimer) return;
        autoTimer = setInterval(() => {
            const amount = Math.round(track.clientWidth * 0.35) * autoStep;
            track.scrollBy({ left: amount, behavior: 'smooth' });
        }, autoDelay);
    };

    track.addEventListener('mouseenter', stopAuto);
    track.addEventListener('mouseleave', startAuto);
    track.addEventListener('focusin', stopAuto);
    track.addEventListener('focusout', startAuto);
    track.addEventListener('touchstart', stopAuto, { passive: true });
    track.addEventListener('touchend', startAuto);

    startAuto();
}

if (portfolioTrack) {
    initInfiniteSlider(portfolioTrack, portfolioPrevBtn, portfolioNextBtn, 'data-portfolio-clone', { autoDelay: 2400 });
}

if (videoTrack) {
    initInfiniteSlider(videoTrack, videoPrevBtn, videoNextBtn, 'data-video-clone', { autoDelay: 3200 });
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener('click', closeLightbox);
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox?.classList.contains('open')) {
        closeLightbox();
    }
});

const statNumbers = document.querySelectorAll('.stat-number');
let statsAnimated = false;

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
            statNumbers.forEach(stat => {
                const target = Number(stat.dataset.target || 0);
                animateCounter(stat, target);
            });
            statsAnimated = true;
        }
    });
}, { threshold: 0.4 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    counterObserver.observe(statsSection);
}

function animateCounter(element, target, duration = 1600) {
    let current = 0;
    const step = Math.max(1, Math.floor(target / (duration / 16)));

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = `${target}+`;
            clearInterval(timer);
        } else {
            element.textContent = `${current}+`;
        }
    }, 16);
}

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a, .sidebar a');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href')?.slice(1) === current) {
            link.classList.add('active');
        }
    });
});
