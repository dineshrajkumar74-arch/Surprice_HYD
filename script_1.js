// Behavior:
// - YES floats to a new random position inside yesnoArea when pointer gets within threshold
// - Does this for maxAttempts (10), incrementing attempts each time (attempts display hidden)
// - After maxAttempts, freeze movement, show large SMILE message with subtle progress ring
// - After 5s change text to "Inkocham Navvochu kada Ne sommu em pothadi......."
// - After 10s enable YES (clickable) and clicking reveals the journey + confetti

// Elements
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const yesnoArea = document.getElementById('yesnoArea');
const attemptsElem = document.getElementById('attempts');
const maxAttemptsElem = document.getElementById('maxAttempts');
const smileArea = document.getElementById('smileArea');
const smileText = document.getElementById('smileText');
const ring = document.querySelector('.ring');

const memorySection = document.getElementById('memory-cards');
const timelineSection = document.getElementById('timeline');
const gallerySection = document.getElementById('gallery');
const letterSection = document.getElementById('love-letter');
const quizSection = document.getElementById('quiz');
const wishesSection = document.getElementById('wishes');
const finaleSection = document.getElementById('finale');

// Configuration
let attempts = 0;
const maxAttempts = 10;        // requested
const approachThreshold = 110; // px
const totalSmileSeconds = 10;  // total wait visible ring
const midSmileSeconds = 5;     // after this change text
let movingEnabled = true;
let smallCooldown = false;

maxAttemptsElem.textContent = maxAttempts;
attemptsElem.textContent = attempts;

// initial YES position
function initYesPosition(){
  yesBtn.style.left = '12px';
  const aH = yesnoArea.clientHeight;
  const bH = yesBtn.offsetHeight;
  yesBtn.style.top = `${Math.max(6, Math.floor((aH - bH)/2))}px`;
}
window.addEventListener('load', initYesPosition);
window.addEventListener('resize', initYesPosition);

// distance helper
function distToYesCenter(clientX, clientY){
  const rect = yesBtn.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  return Math.sqrt(dx*dx + dy*dy);
}

// pick safe position avoid NO overlap
function chooseSafeRandomPos(){
  const pad = 8;
  const areaRect = yesnoArea.getBoundingClientRect();
  const btnW = yesBtn.offsetWidth;
  const btnH = yesBtn.offsetHeight;
  const noRect = noBtn.getBoundingClientRect();

  const maxLeft = Math.max(0, yesnoArea.clientWidth - btnW - pad);
  const maxTop = Math.max(0, yesnoArea.clientHeight - btnH - pad);

  for(let i=0;i<80;i++){
    const left = Math.floor(Math.random() * (maxLeft + 1));
    const top = Math.floor(Math.random() * (maxTop + 1));

    const cand = {
      left: areaRect.left + left,
      top: areaRect.top + top,
      right: areaRect.left + left + btnW,
      bottom: areaRect.top + top + btnH
    };

    const overlap = !(cand.right < noRect.left + 6 ||
                      cand.left > noRect.right - 6 ||
                      cand.bottom < noRect.top + 6 ||
                      cand.top > noRect.bottom - 6);
    if(!overlap) return { left, top };
  }
  return { left: Math.floor(maxLeft/2), top: Math.floor(maxTop/2) };
}

// move YES away
function moveYes(){
  if(!movingEnabled || smallCooldown) return;
  smallCooldown = true;
  setTimeout(()=> smallCooldown = false, 140);

  attempts++;
  attemptsElem.textContent = attempts; // hidden but tracked

  const pos = chooseSafeRandomPos();
  yesBtn.style.transition = 'left 0.18s cubic-bezier(.2,.9,.3,1), top 0.18s cubic-bezier(.2,.9,.3,1)';
  yesBtn.style.left = `${pos.left}px`;
  yesBtn.style.top = `${pos.top}px`;

  if(attempts >= maxAttempts){
    movingEnabled = false;
    setTimeout(beginSmilePhase, 300);
  }
}

// pointer detection
yesnoArea.addEventListener('mousemove', (ev) => {
  if(!movingEnabled) return;
  const d = distToYesCenter(ev.clientX, ev.clientY);
  if(d < approachThreshold) moveYes();
}, { passive:true });

yesnoArea.addEventListener('touchstart', (ev) => {
  if(!movingEnabled) return;
  const t = ev.touches[0];
  if(!t) return;
  const d = distToYesCenter(t.clientX, t.clientY);
  if(d < approachThreshold) moveYes();
}, { passive:true });

// NO button playful messages
const noReplies = [
  "Not even a little curious? 😉",
  "You're breaking my heart! 💔",
  "Come on, you know you want to peek! 🥺",
  "I'll wait... but I'll be sad 😢",
  "You can't resist forever!",
];
noBtn.addEventListener('click', ()=> alert(noReplies[Math.floor(Math.random()*noReplies.length)]));

// SMILE phase: show ring and text changes
function beginSmilePhase(){
  yesBtn.classList.add('unclickable');
  yesBtn.setAttribute('aria-disabled','true');

  smileArea.classList.remove('hidden');
  smileArea.setAttribute('aria-hidden','false');

  // center YES
  const centeredLeft = Math.max(6, Math.floor((yesnoArea.clientWidth - yesBtn.offsetWidth)/2));
  const centeredTop  = Math.max(6, Math.floor((yesnoArea.clientHeight - yesBtn.offsetHeight)/2));
  yesBtn.style.left = `${centeredLeft}px`;
  yesBtn.style.top  = `${centeredTop}px`;

  // initialize ring stroke values
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // 314...
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${circumference}`;

  // set initial smile text style (beautiful large)
  smileText.textContent = 'Give me your biggest smile! 😊';
  smileText.classList.remove('mid');

  // animate ring over totalSmileSeconds; update text at mid point
  const totalMs = totalSmileSeconds * 1000;
  const midMs = midSmileSeconds * 1000;
  const start = performance.now();

  function tick(now){
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / totalMs);
    const offset = circumference * (1 - progress);
    ring.style.strokeDashoffset = `${offset}`;

    // At midpoint change text to requested phrase and style it
    if(elapsed >= midMs && !smileText.classList.contains('mid')){
      smileText.textContent = 'Inkocham Navvochu kada Ne sommu em pothadi.......';
      smileText.classList.add('mid');
    }

    if(progress < 1){
      requestAnimationFrame(tick);
    } else {
      // finished
      enableYesAfterSmile();
    }
  }
  requestAnimationFrame(tick);
}

function enableYesAfterSmile(){
  // hide smile area
  smileArea.classList.add('hidden');
  smileArea.setAttribute('aria-hidden','true');

  // enable YES
  yesBtn.classList.remove('unclickable');
  yesBtn.classList.add('clickable');
  yesBtn.setAttribute('aria-disabled','false');
  yesBtn.style.pointerEvents = 'auto';

  yesBtn.style.left = `${Math.max(6, Math.floor((yesnoArea.clientWidth - yesBtn.offsetWidth)/2))}px`;
  yesBtn.style.top  = `${Math.max(6, Math.floor((yesnoArea.clientHeight - yesBtn.offsetHeight)/2))}px`;
  yesBtn.style.transition = 'transform .14s ease';

  yesBtn.addEventListener('click', revealTheJourney, { once:true });
}

function revealTheJourney(){
  document.querySelector('.hero-content').classList.add('hidden');
  document.querySelector('.scroll-hint').classList.add('hidden');

  [memorySection, timelineSection, gallerySection, letterSection, quizSection, wishesSection, finaleSection]
    .forEach(sec => sec.classList.remove('hidden'));

  setTimeout(()=>{
    memorySection.scrollIntoView({ behavior:'smooth' });
    createConfetti();
  }, 300);
}

// Confetti
function createConfetti(){
  const colors = ['#ff6b9d','#764ba2','#f093fb','#ffd700','#ff1493'];
  for(let i=0;i<100;i++){
    const dot = document.createElement('div');
    const size = Math.random()*10 + 6;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.background = colors[Math.floor(Math.random()*colors.length)];
    dot.style.position = 'fixed';
    dot.style.left = `${Math.random()*window.innerWidth}px`;
    dot.style.top = `-20px`;
    dot.style.borderRadius = '50%';
    dot.style.zIndex = 9999;
    dot.style.pointerEvents = 'none';
    document.body.appendChild(dot);

    const speed = Math.random()*5 + 3;
    const xVel = (Math.random()-0.5)*10;
    let y = -20;
    const interval = setInterval(()=>{
      y += speed;
      dot.style.top = `${y}px`;
      dot.style.left = `${parseFloat(dot.style.left) + xVel}px`;
      dot.style.transform = `rotate(${y*2}deg)`;
      if(y > window.innerHeight + 40){
        clearInterval(interval);
        dot.remove();
      }
    }, 20);
  }
}

console.log('YES-button playful behavior active with smile progress ring.');
