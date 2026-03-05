// ── GSAP Initialization ───────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── Reveal Animations ────────────────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');

reveals.forEach((el) => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  });
});

// ── Hero Asset Tilt ──────────────────────────────────────────────────────
const heroAsset = document.querySelector('#heroAsset');
if (heroAsset) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * -15;
    gsap.to(heroAsset, {
      rotateY: x,
      rotateX: y + 15, // Base 15deg tilt
      duration: 1.2,
      ease: 'power2.out',
    });
  });
}

// ── Theme Logic ──────────────────────────────────────────────────────────
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', targetTheme);
  localStorage.setItem('synapse-theme', targetTheme);
  
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = targetTheme === 'light' ? '☀️' : '🌙';
  console.log(`[SynapseJS] Theme switched to ${targetTheme}`);
}

// Initialize Theme
const savedTheme = localStorage.getItem('synapse-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
window.addEventListener('DOMContentLoaded', () => {
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = savedTheme === 'light' ? '☀️' : '🌙';
});

// ── Magnetic Buttons ─────────────────────────────────────────────────────
const magneticEls = document.querySelectorAll('.magnetic');
magneticEls.forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.35, y: y * 0.35, duration: 0.5, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
  });
});

// ── Assistant Logic ──────────────────────────────────────────────────────
const assistant = document.getElementById('synapse-assistant');
const chatBox = document.getElementById('chat-box');
const aiInput = document.getElementById('ai-input');

function toggleAssistant() {
  assistant.classList.toggle('active');
  if (assistant.classList.contains('active')) {
    aiInput.focus();
  }
}

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = aiInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  aiInput.value = '';

  // Simulate AI Thinking
  const thinking = addMessage('...', 'ai');
  await new Promise(r => setTimeout(r, 800));
  thinking.remove();

  // Simple Pattern Matching for Demo
  const input = text.toLowerCase();
  
  if (input.includes('highlight') || input.includes('show features')) {
    addMessage('Highlighting the features grid for you. Emitting HIGHLIGHT_ELEMENT signal...', 'ai');
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => card.classList.add('synapse-highlight'));
    setTimeout(() => cards.forEach(card => card.classList.remove('synapse-highlight')), 3000);
  } else if (input.includes('scroll') && input.includes('top')) {
    addMessage('Scrolling to the top. Emitting SCROLL_TO signal...', 'ai');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (input.includes('scroll') && (input.includes('feature') || input.includes('down'))) {
    addMessage('Scrolling to features. Emitting SCROLL_TO signal...', 'ai');
    document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
  } else if (input.includes('docs') || input.includes('documentation')) {
    addMessage('Documentation is available via the Documentation link. Emitting NAVIGATE signal...', 'ai');
    document.querySelector('.nav-link[href="intro.html"]').classList.add('synapse-highlight');
    setTimeout(() => document.querySelector('.nav-link[href="intro.html"]').classList.remove('synapse-highlight'), 3000);
  } else {
    addMessage("I can highlight parts of this page or scroll to sections. Try: 'Highlight features' or 'Scroll to bottom'.", 'ai');
  }
}

// ── Design Spells: Particle Background ──────────────────────────────────────
const particles = [];
const particleCount = 40;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.pointerEvents = 'none';
canvas.style.zIndex = '0';
canvas.style.opacity = '0.5';
document.body.appendChild(canvas);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.alpha = Math.random() * 0.5 + 0.1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
  }
  draw() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isLight ? `rgba(13, 148, 136, ${this.alpha})` : `rgba(45, 212, 191, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < particleCount; i++) particles.push(new Particle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ── Enhanced Magnetic Magic (Design Spells) ──────────────────────────────────
magneticEls.forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Physics-based tracking with lag
    gsap.to(el, { 
      x: x * 0.45, 
      y: y * 0.45, 
      duration: 0.8, 
      ease: 'power3.out',
      overwrite: 'auto'
    });
    
    // Magnetic pulse effect
    if (el.classList.contains('logo') || el.classList.contains('btn-primary')) {
       gsap.to(el, { scale: 1.05, duration: 0.3 });
    }
  });
  
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.3)' });
  });
});

console.log('[SynapseJS] Design Spells: Magnetic Magic & Particles Active. ✨');
const orbs = document.querySelectorAll('.glow-orb');
window.addEventListener('mousemove', (e) => {
  const { clientX, clientY } = e;
  const xPercent = (clientX / window.innerWidth - 0.5) * 100;
  const yPercent = (clientY / window.innerHeight - 0.5) * 100;

  orbs.forEach((orb, i) => {
    const factor = (i + 1) * 0.2;
    gsap.to(orb, {
      x: xPercent * factor,
      y: yPercent * factor,
      duration: 2,
      ease: 'power1.out'
    });
  });
});
