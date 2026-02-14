const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const yesnoArea = document.getElementById('yesnoArea');
const attemptsElem = document.getElementById('attempts');
const maxAttemptsElem = document.getElementById('maxAttempts');
const smileArea = document.getElementById('smileArea');
const smileText = document.getElementById('smileText');
const ring = document.querySelector('.ring');

// Section visibility
const sections = ['memory-cards', 'quiz', 'valentine-letter', 'finale'];

let attempts = 0;
const maxAttempts = 25;            // UPDATED: increase attempts
const approachThreshold = 110;
const totalSmileSeconds = 10;
const midSmileSeconds = 5;
let movingEnabled = true;
let smallCooldown = false;

// UPDATED: slow down how frequently YES moves (increase for more time)
const moveCooldownMs = 250;
let lastMoveTime = 0;

// --- QUIZ DATA ---
const quizQuestions = [
    { q: "Where did we first meet?", a: ["Office", "Park", "Online", "Cafe"], correct: 0 },
    { q: "What is my favorite nickname for you?", a: ["Babu", "Potti", "Chinnu", "Bangaram"], correct: 1 },
    { q: "Which habit of mine do you handle best?", a: ["Anger", "Patience", "Talkativeness", "Laziness"], correct: 1 }
];
let currentQuestionIndex = 0;
let score = 0;

// --- INITIALIZATION ---
function initYesPosition(){
  yesBtn.style.left = '12px';
  yesBtn.style.top = `${Math.max(6, Math.floor((yesnoArea.clientHeight - yesBtn.offsetHeight)/2))}px`;

  // UPDATED: show max attempts in UI
  if(maxAttemptsElem) maxAttemptsElem.textContent = maxAttempts;
}
window.addEventListener('load', initYesPosition);

function distToYesCenter(clientX, clientY){
  const rect = yesBtn.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  return Math.sqrt(Math.pow(clientX-cx, 2) + Math.pow(clientY-cy, 2));
}

function moveYes(){
  if(!movingEnabled) return;

  // UPDATED: cooldown so it doesn't move too fast
  const now = Date.now();
  if(now - lastMoveTime < moveCooldownMs) return;
  lastMoveTime = now;

  attempts++;
  attemptsElem.textContent = attempts;

  const maxLeft = yesnoArea.clientWidth - yesBtn.offsetWidth - 10;
  const maxTop = yesnoArea.clientHeight - yesBtn.offsetHeight - 10;

  yesBtn.style.left = `${Math.random() * maxLeft}px`;
  yesBtn.style.top = `${Math.random() * maxTop}px`;

  if(attempts >= maxAttempts){
    movingEnabled = false;
    setTimeout(beginSmilePhase, 300);
  }
}

yesnoArea.addEventListener('mousemove', (ev) => {
  if(movingEnabled && distToYesCenter(ev.clientX, ev.clientY) < approachThreshold) moveYes();
});

// --- SMILE PHASE ---
function beginSmilePhase(){
  smileArea.classList.remove('hidden');
  const circumference = 314;
  const totalMs = totalSmileSeconds * 1000;
  const start = performance.now();

  function tick(now){
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / totalMs);
    ring.style.strokeDashoffset = circumference * (1 - progress);

    if(elapsed >= (midSmileSeconds * 1000)){
      smileText.textContent = 'Inkocham Navvochu kada Ne sommu em pothadi.......';
      smileText.classList.add('mid');
    }
    if(progress < 1) requestAnimationFrame(tick);
    else enableYesAfterSmile();
  }
  requestAnimationFrame(tick);
}

function enableYesAfterSmile(){
  smileArea.classList.add('hidden');
  yesBtn.classList.replace('unclickable', 'clickable');
  yesBtn.style.pointerEvents = 'auto';
  yesBtn.addEventListener('click', revealTheJourney, { once:true });
}

function revealTheJourney(){
  document.querySelector('.hero-content').classList.add('hidden');
  sections.forEach(id => document.getElementById(id).classList.remove('hidden'));
  startQuiz();
  createConfetti();
  document.getElementById('memory-cards').scrollIntoView({ behavior:'smooth' });

  // Make all flip-cards the same height (based on the tallest one)
  requestAnimationFrame(setUniformFlipCardHeight);
  setTimeout(setUniformFlipCardHeight, 50);
}

// --- QUIZ LOGIC ---
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    const questionElem = document.getElementById('question');
    const btnContainer = document.getElementById('answer-buttons');
    const data = quizQuestions[currentQuestionIndex];

    questionElem.innerText = data.q;
    btnContainer.innerHTML = '';

    data.a.forEach((choice, index) => {
        const button = document.createElement('button');
        button.innerText = choice;
        button.classList.add('quiz-btn');
        button.onclick = () => selectAnswer(index);
        btnContainer.appendChild(button);
    });
}

function selectAnswer(index) {
    if(index === quizQuestions[currentQuestionIndex].correct) score++;
    currentQuestionIndex++;
    if(currentQuestionIndex < quizQuestions.length) showQuestion();
    else showResult();
}

function showResult() {
    document.getElementById('quiz-content').classList.add('hidden');
    const resultArea = document.getElementById('quiz-result');
    resultArea.classList.remove('hidden');
    document.getElementById('score-text').innerText = `You got ${score} out of ${quizQuestions.length} right! ❤️`;
}

function resetQuiz() {
    document.getElementById('quiz-content').classList.remove('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    startQuiz();
}

// --- CONFETTI ---
function createConfetti(){
  for(let i=0; i<80; i++){
    const dot = document.createElement('div');
    dot.style.cssText = `position:fixed; width:8px; height:8px; background:hsl(${Math.random()*360}, 100%, 50%); left:${Math.random()*100}vw; top:-10px; border-radius:50%; z-index:100; pointer-events:none;`;
    document.body.appendChild(dot);
    let y = -10;
    const fall = setInterval(() => {
        y += 5;
        dot.style.top = y + 'px';
        if(y > window.innerHeight) { clearInterval(fall); dot.remove(); }
    }, 20);
  }
}

function setUniformFlipCardHeight(){
  const cards = Array.from(document.querySelectorAll('.flip-card'));
  if(!cards.length) return;

  // Reset to natural height first so we can measure correctly
  cards.forEach(c => (c.style.height = ''));

  let maxH = 0;

  cards.forEach(card => {
    const front = card.querySelector('.flip-card-front');
    const back  = card.querySelector('.flip-card-back');
    if(!front || !back) return;

    // Temporarily remove absolute stacking to measure content height
    const pf = front.style.position;
    const pb = back.style.position;

    front.style.position = 'relative';
    back.style.position  = 'relative';

    maxH = Math.max(maxH, front.scrollHeight, back.scrollHeight);

    // Restore original positions for flip
    front.style.position = pf || 'absolute';
    back.style.position  = pb || 'absolute';
  });

  // Apply the tallest height to every card
  cards.forEach(card => {
    card.style.height = maxH + 'px';
    const inner = card.querySelector('.flip-card-inner');
    if(inner) inner.style.height = maxH + 'px';
  });
}

window.addEventListener('load', setUniformFlipCardHeight);
window.addEventListener('resize', () => {
  clearTimeout(window.__uniformFlipTimer);
  window.__uniformFlipTimer = setTimeout(setUniformFlipCardHeight, 100);
});
