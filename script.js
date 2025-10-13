/* Full combined script:
   - Start screen -> Card selection -> Dialogue -> Gameplay
   - Boss timer + spawn
   - Shop with permanent upgrades
   - Card effects applied for the run
*/

// ---------- Config ----------
const BOSS_TIME = 60; // seconds until boss (set to 300 for 5 minutes)
const MAX_CARD_SELECTION = 3;
const SHOP_COST_BASE = 10;

// ---------- UI Elements ----------
const startScreen = document.getElementById('start-screen');
const btnStart = document.getElementById('btn-start');
const btnHelp = document.getElementById('btn-help');
const btnShopSS = document.getElementById('btn-shop-ss');
/* Combined shooter + start-screen + dialogue flow
   - Start screen -> Dialogue -> Gameplay
   - Uses your original shooter logic with minimal changes
*/

// ---------------------- Dialog / Start UI ----------------------
const startScreen = document.getElementById('start-screen');
const btnStart = document.getElementById('btn-start');
const btnHelp = document.getElementById('btn-help');

const dialogueBox = document.getElementById('dialogue-box');
const dialogueText = document.getElementById('dialogue-text');
const nextDialogueBtn = document.getElementById('next-dialogue');

const cardMenu = document.getElementById('card-menu');
const cardButtons = Array.from(document.querySelectorAll('.card-btn'));
const confirmCardsBtn = document.getElementById('confirm-cards');
const cancelCardsBtn = document.getElementById('cancel-cards');

const shopPanel = document.getElementById('shop-panel');
const openShopBtn = document.getElementById('open-shop');
const closeShopBtn = document.getElementById('close-shop');
const shopMeteoriteCount = document.getElementById('shop-meteorite-count');

const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const meteoriteCountEl = document.getElementById('meteorite-count');
const bossTimerEl = document.getElementById('boss-timer');

const gameOverOverlay = document.getElementById('game-over');
// Dialog lines (you can edit)
const dialogues = [
  "Mission control: Commander, you’re about to enter Mercury’s orbit.",
  "Collect meteorite fragments to upgrade your ship between missions.",
  "Survive the meteor showers and defeat the boss after 5 minutes.",
  "Good luck, Commander!"
];

let dialogueIndex = 0;
let inDialogue = true; // true while dialogue is active or before starting gameplay

// Start button shows first dialogue (hides start screen)
btnStart.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  dialogueIndex = 0;
  showDialogueLine(dialogues[dialogueIndex]);
  dialogueBox.classList.remove('hidden');
  inDialogue = true;
});

// Help button shows an alert (simple)
btnHelp.addEventListener('click', () => {
  alert('WASD to move, mouse to aim, click/hold to shoot. Collect meteorites and survive!');
});

// Next dialogue button
nextDialogueBtn.addEventListener('click', () => {
  dialogueIndex++;
  if (dialogueIndex < dialogues.length) {
    showDialogueLine(dialogues[dialogueIndex]);
  } else {
    // End dialogue and start the gameplay
    dialogueBox.classList.add('hidden');
    inDialogue = false;
    // Reset timing so game starts cleanly
    last = performance.now();
  }
});

function showDialogueLine(text){
  dialogueText.textContent = text;
  dialogueBox.classList.remove('hidden');
}

// ---------------------- Canvas & HUD Elements ----------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');           // side HUD
const healthEl = document.getElementById('health');         // side HUD
const meteoriteCountEl = document.getElementById('meteorite-count');

const gameOverPanel = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------- Dialogue content ----------
const dialogues = [
  "Mission control: Commander, you’re about to enter Mercury’s orbit.",
  "Collect meteorite fragments to upgrade your ship between missions.",
  "Survive the meteor showers and defeat the boss after the timer.",
  "Good luck, Commander!"
];

// ---------- State ----------
let dialogueIndex = 0;
let inDialogue = true;
let selectedCards = []; // strings of card ids
let cardSet = new Set();

let gameStartTime = 0;
let bossSpawned = false;

let W = 800, H = 600;
function resizeCanvas(){
  const padding = 32;
  const availableW = window.innerWidth - 2 * 220;
  const availableH = window.innerHeight - 40;
  const size = Math.max(480, Math.min(availableW, availableH));
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  // Fit canvas to available center area (make it fill available window while keeping aspect)
  const padding = 32;
  const availableW = window.innerWidth - 2 * 210; // reserve side panels width approx
  const availableH = window.innerHeight - 40; // reserve small margins
  const size = Math.max(480, Math.min(availableW, availableH));
  canvas.style.width = size + 'px';
  canvas.style.height = (size) + 'px';

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  W = rect.width;
  H = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input
const input = { up:false, down:false, left:false, right:false, mx:W/2, my:H/2, mouseDown:false };
window.addEventListener('keydown', e=>{
  if(e.key==='w'||e.key==='ArrowUp') input.up=true;
  if(e.key==='s'||e.key==='ArrowDown') input.down=true;
  if(e.key==='a'||e.key==='ArrowLeft') input.left=true;
  if(e.key==='d'||e.key==='ArrowRight') input.right=true;
});
window.addEventListener('keyup', e=>{
  if(e.key==='w'||e.key==='ArrowUp') input.up=false;
  if(e.key==='s'||e.key==='ArrowDown') input.down=false;
  if(e.key==='a'||e.key==='ArrowLeft') input.left=false;
  if(e.key==='d'||e.key==='ArrowRight') input.right=false;
});
canvas.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect();
  input.mx = e.clientX - rect.left;
  input.my = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', ()=> input.mouseDown=true);
window.addEventListener('mouseup', ()=> input.mouseDown=false);

// Basic objects (Player, Bullet, Enemy)
class Player {
  constructor(x,y){
    this.x=x; this.y=y;
    this.radius=14;
    this.baseSpeed=180; // px/sec
    this.speedMultiplier = 1;
    this.health = 100;
    this.baseMaxHealth = 100;
    this.damage = 1;
  }
  get maxHealth(){ return this.baseMaxHealth + (state.upgrades.health * 15); }
  get speed(){ return this.baseSpeed * (1 + (0.1 * state.upgrades.speed)) * this.speedMultiplier; }
  update(dt){
    if (inDialogue) return;
    let dx=0,dy=0;
    if(input.up) dy-=1;
    if(input.down) dy+=1;
    if(input.left) dx-=1;
    if(input.right) dx+=1;
    if(dx!==0||dy!==0){
      const len=Math.hypot(dx,dy); dx/=len; dy/=len;
      this.x += dx*this.speed*dt; this.y += dy*this.speed*dt;
      this.x = Math.max(this.radius, Math.min(W-this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(H-this.radius, this.y));
    if (inDialogue) return; // freeze player while in dialogue
    let dx = 0, dy = 0;
    if(input.up) dy -= 1;
    if(input.down) dy += 1;
    if(input.left) dx -= 1;
    if(input.right) dx += 1;
    if(dx!==0 || dy!==0){
      const len = Math.hypot(dx,dy);
      dx /= len; dy /= len;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      // clamp to canvas
      this.x = Math.max(this.radius, Math.min(W - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(H - this.radius, this.y));
    }
  }
  draw(){
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.fillStyle = '#8be8ff';
    ctx.arc(0,0,this.radius,0,Math.PI*2);
    ctx.fill();
    const angle = Math.atan2(input.my - this.y, input.mx - this.x);
    ctx.rotate(angle);
    ctx.fillStyle = '#04202b';
    ctx.fillRect(this.radius-2,-4,12,8);
    ctx.restore();
  }
}

class Bullet {
  constructor(x,y,vx,vy,damage=1){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.radius=4; this.life=2; this.damage=damage;
  }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.life-=dt; }
  draw(){ ctx.beginPath(); ctx.fillStyle='#fff9c4'; ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fill(); }
}

class Enemy {
  constructor(x,y,type='basic'){
    this.x=x; this.y=y; this.type=type;
    this.radius = (type==='boss'?44:(type==='tank'?18:12));
    this.speed = (type==='boss'?30:(60 + Math.random()*40));
    this.hp = (type==='boss'?40:(type==='tank'?3:1));
    this.color = (type==='boss'?'#ff6b6b':(type==='tank'?'#ff8a80':'#ffb267'));
  }
  update(dt, player){
    if(this.type==='boss'){
      // simple slow move pattern
      const centerX = W/2;
      const targetY = 120;
      const dx = centerX - this.x;
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed*dt);
      if(this.y < targetY) this.y += this.speed*dt;
    } else {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(angle) * this.speed * dt;
      this.y += Math.sin(angle) * this.speed * dt;
    }
  }
  draw(){
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fill();
  }
}

// ---------- Game State ----------
const state = {
  player: new Player(W/2,H/2),
  bullets: [],
  enemies: [],
  score: 0,
  spawnTimer: 0,
  spawnInterval: 1.1,
  shootingCooldown: 0,
  gameOver: false,
  meteorites: 0,
  upgrades: { damage:0, speed:0, health:0 },
  boss: null
};

// Utility
function randRange(a,b){ return a + Math.random() * (b-a); }
  meteorites: 0
};

/* ----- Utility ----- */
function randRange(a,b){ return a + Math.random()*(b-a); }

// ---------- Spawning ----------
function spawnEnemy(){
  if (state.boss) return; // pause normal spawns while boss active
  const edge = Math.floor(Math.random()*4);
  let x,y;
  if(edge===0){ x = randRange(0,W); y = -20; }
  if(edge===1){ x = randRange(0,W); y = H+20; }
  if(edge===2){ x = -20; y = randRange(0,H); }
  if(edge===3){ x = W+20; y = randRange(0,H); }
  const type = Math.random() < 0.10 ? 'tank' : 'basic';
  state.enemies.push(new Enemy(x,y,type));
}

function spawnBoss(){
  if (state.boss) return;
  state.boss = new Enemy(W/2, -120, 'boss');
  state.enemies.push(state.boss);
  bossSpawned = true;
}

// ---------- Shooting ----------
function shootTowards(mx,my){
  const p = state.player;
  const angle = Math.atan2(my - p.y, mx - p.x);
  const baseSpeed = 420;
  const vx = Math.cos(angle)*baseSpeed;
  const vy = Math.sin(angle)*baseSpeed;

  // card effects: overcharge chance modifies damage
  let dmg = state.player.damage + state.upgrades.damage;
  if (cardSet.has('overcharge') && Math.random() < 0.22) dmg *= 2;

  // RapidFire affects cooldown, handled in update()
  const bx = p.x + Math.cos(angle)*(p.radius + 6);
  const by = p.y + Math.sin(angle)*(p.radius + 6);
  state.bullets.push(new Bullet(bx,by,vx,vy,dmg));
}

// ---------- Loop & Timing ----------
function loop(now){
  const dt = Math.min((now - last)/1000, 0.05);
  last = now;

  // update only when not gameOver and not in dialogue
  // update only when not in dialogue and not game over
  if(!state.gameOver && !inDialogue) update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt){
  const p = state.player;

  // apply autoRepair card
  if (cardSet.has('autoRepair')){
    p.health = Math.min(p.maxHealth, p.health + 6 * dt); // 6 HP/sec regen
  }

  p.update(dt);

  // shooting cooldown with card effect
  const baseFireRate = 1/6; // cooldown seconds
  const rapidMultiplier = cardSet.has('rapidFire') ? 0.6 : 1; // faster
  state.shootingCooldown -= dt;
  const fireRate = 1/6; // 6 bullets per second
  if(input.mouseDown && state.shootingCooldown <= 0 && !inDialogue){
    shootTowards(input.mx, input.my);
    state.shootingCooldown = baseFireRate * rapidMultiplier;
  }

  // update bullets
  for(let i=state.bullets.length-1;i>=0;i--){
    const b = state.bullets[i];
    b.update(dt);
    if(b.life <= 0 || b.x < -50 || b.y < -50 || b.x > W+50 || b.y > H+50){
      state.bullets.splice(i,1);
    }
  }

  // spawn enemies periodically
  state.spawnTimer -= dt;
  if(state.spawnTimer <= 0 && !state.boss){
    spawnEnemy();
    state.spawnTimer = Math.max(0.28, state.spawnInterval - Math.min(0.8, state.score*0.02));
  }

  // update enemies
  for(let i=state.enemies.length-1;i>=0;i--){
    const e = state.enemies[i];
    e.update(dt, state.player);

    // enemy hits player?
    const dx = e.x - p.x, dy = e.y - p.y;
    if(Math.hypot(dx,dy) < e.radius + p.radius - 2){
      // damage player and remove minor enemies (boss won't be instantly removed)
      if(e.type !== 'boss'){
        p.health -= 12 + (e.type === 'tank' ? 10 : 0);
        state.enemies.splice(i,1);
      } else {
        p.health -= 25;
      }

      if(p.health <= 0){
        endGame();
        return;
      }
    }
  }

  // bullets hitting enemies
  for(let i=state.bullets.length-1;i>=0;i--){
    const b = state.bullets[i];
    for(let j=state.enemies.length-1;j>=0;j--){
      const e = state.enemies[j];
      if(Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius){
        e.hp -= b.damage;
        if(e.hp <= 0){
          // remove enemy
          if(e === state.boss) {
            // boss defeated -> victory
            state.enemies.splice(j,1);
            state.boss = null;
            bossSpawned = false;
            onBossDefeated();
          } else {
            state.enemies.splice(j,1);
            state.score += (e.type === 'tank' ? 5 : 1);
            state.meteorites += (e.type === 'tank' ? 3 : 1);
          }
          state.enemies.splice(j,1);
          state.score += (e.type === 'tank' ? 5 : 1);
          // collect meteorite pieces as reward
          state.meteorites += (e.type === 'tank' ? 3 : 1);
        }
        // remove bullet
        state.bullets.splice(i,1);
        break;
      }
    }
  }

  // update HUD
  scoreEl.textContent = `Score: ${state.score}`;
  const displayedHealth = Math.max(0, Math.round(p.health));
  healthEl.textContent = `Health: ${displayedHealth}`;
  meteoriteCountEl.textContent = state.meteorites;
  shopMeteoriteCount.textContent = state.meteorites;

  // Boss timer display
  if (!gameStartTime) bossTimerEl.textContent = '--';
  else {
    const elapsed = (performance.now() - gameStartTime)/1000;
    const remaining = Math.max(0, Math.ceil(BOSS_TIME - elapsed));
    bossTimerEl.textContent = remaining;
    if (remaining <= 0 && !bossSpawned){
      spawnBoss();
    }
  }
}

// ---------- Boss defeated / victory ----------
function onBossDefeated(){
  // simple victory: show dialogue box summarizing
  dialogueText.textContent = "Boss defeated! Mission success. You unlocked the next planet.";
  dialogueBox.classList.remove('hidden');
  inDialogue = true;
  // score reward
  state.score += 50;
  // allow restart -> start screen when player clicks Next
  dialogueIndex = dialogues.length; // treat as finished so Next will go to start-screen flow
  healthEl.textContent = `Health: ${Math.max(0, Math.round(p.health))}`;
  meteoriteCountEl.textContent = state.meteorites;
}

// ---------- Draw ----------
function draw(){
  ctx.clearRect(0,0,W,H);
  

  // subtle grid
  const grid = 40;
  ctx.save(); ctx.globalAlpha = 0.06; ctx.strokeStyle = '#ffffff';
  for(let x=0;x<W;x+=grid){ ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,H); ctx.stroke(); }
  for(let y=0;y<H;y+=grid){ ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(W,y+0.5); ctx.stroke(); }
  ctx.restore();

  // bullets
  for(const b of state.bullets) b.draw();

  // enemies
  for(const e of state.enemies) e.draw();

  // player
  state.player.draw();

  // crosshair
  ctx.beginPath();
  ctx.arc(input.mx, input.my, 6, 0, Math.PI*2);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();

  // if game over overlay (canvas side)
  if(state.gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,W,H);
  }
}

// ---------- Game over and reset ----------
function endGame(){
  state.gameOver = true;
  gameOverOverlay.classList.remove('hidden');
  finalScoreEl.textContent = `Score: ${state.score}`;
}

function resetGame(){
  // reset state
  // Reset state and show start screen again
  state.player = new Player(W/2, H/2);
  state.bullets = [];
  state.enemies = [];
  state.score = 0;
  state.spawnTimer = 0.6;
  state.shootingCooldown = 0;
  state.gameOver = false;
  state.meteorites = 0;
  state.upgrades = { damage:0, speed:0, health:0 };
  state.boss = null;
  bossSpawned = false;
  inDialogue = true;
  dialogueIndex = 0;
  selectedCards = []; cardSet.clear();
  // UI
  meteoriteCountEl.textContent = state.meteorites;
  scoreEl.textContent = `Score: ${state.score}`;
  healthEl.textContent = `Health: ${state.player.health}`;
  shopMeteoriteCount.textContent = state.meteorites;
  // show start screen
  startScreen.classList.remove('hidden');
  dialogueBox.classList.add('hidden');
  cardMenu.classList.add('hidden');
  shopPanel.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  bossTimerEl.textContent = '--';
}

restartBtn.addEventListener('click', ()=> resetGame());

// ---------- Start / Dialogue / Cards / Shop Handlers ----------
btnStart.addEventListener('click', ()=>{
  // open card menu first
  startScreen.classList.add('hidden');
  openCardMenu();
});
btnHelp.addEventListener('click', ()=> {
  alert('WASD to move, mouse aim + click/hold to shoot. Collect meteorites to buy upgrades in the shop.');
});
btnShopSS.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  shopPanel.classList.remove('hidden');
});

// Card menu open
document.getElementById('open-cards').addEventListener('click', openCardMenu);
function openCardMenu(){
  cardSet.clear();
  selectedCards = [];
  cardButtons.forEach(b => b.classList.remove('selected'));
  cardMenu.classList.remove('hidden');
}

// card selection toggling
cardButtons.forEach(btn=>{
  btn.addEventListener('click', ()=> {
    const id = btn.dataset.card;
    if(btn.classList.contains('selected')){
      btn.classList.remove('selected');
      cardSet.delete(id);
    } else {
      if(cardSet.size >= MAX_CARD_SELECTION){
        alert(`You can only select up to ${MAX_CARD_SELECTION} cards.`);
        return;
      }
      btn.classList.add('selected');
      cardSet.add(id);
    }
  });
});

// confirm or cancel
confirmCardsBtn.addEventListener('click', ()=>{
  selectedCards = Array.from(cardSet);
  cardMenu.classList.add('hidden');
  // start dialogue after card selection
  dialogueIndex = 0;
  showDialogueLine(dialogues[dialogueIndex]);
  dialogueBox.classList.remove('hidden');
  inDialogue = true;
});
cancelCardsBtn && cancelCardsBtn.addEventListener('click', ()=>{
  cardMenu.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

// Dialogue next
nextDialogueBtn.addEventListener('click', ()=> {
  dialogueIndex++;
  if(dialogueIndex < dialogues.length){
    showDialogueLine(dialogues[dialogueIndex]);
  } else {
    // end dialogue and start game
    dialogueBox.classList.add('hidden');
    inDialogue = false;
    gameStartTime = performance.now();
    last = performance.now();
  }
});
function showDialogueLine(text){
  dialogueText.textContent = text;
  dialogueBox.classList.remove('hidden');
}

// ---------- Shop handlers ----------
openShopBtn.addEventListener('click', ()=> { shopPanel.classList.remove('hidden'); shopMeteoriteCount.textContent = state.meteorites; });
document.getElementById('close-shop').addEventListener('click', ()=> shopPanel.classList.add('hidden'));

// Buy buttons
document.querySelectorAll('#shop-panel .buy').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.type;
    const cost = SHOP_COST_BASE + state.upgrades[type] * 10;
    if(state.meteorites >= cost){
      state.meteorites -= cost;
      state.upgrades[type] += 1;
      // apply immediate small effects
      if(type === 'health') state.player.health = Math.min(state.player.maxHealth, state.player.health + 15);
      shopMeteoriteCount.textContent = state.meteorites;
      meteoriteCountEl.textContent = state.meteorites;
      alert('Purchase successful!');
    } else alert('Not enough meteorite pieces.');
  });
});

// ---------- Initialize & Start Loop ----------
resetGame(); // show start-screen etc.
  scoreEl.textContent = `Score: ${state.score}`;
  healthEl.textContent = `Health: ${Math.max(0, Math.round(state.player.health))}`;
  meteoriteCountEl.textContent = state.meteorites;
  gameOverPanel.classList.add('hidden');

  // show start screen; user must press Start to begin dialogue -> game
  startScreen.classList.remove('hidden');
  inDialogue = true;
  dialogueIndex = 0;
}

restartBtn.addEventListener('click', ()=> resetGame());

/* Start the loop */
resetGame();
requestAnimationFrame(loop);
