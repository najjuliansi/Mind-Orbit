/* Simple Top-Down Shooter
   - Player moves with WASD
   - Aim with mouse, click to shoot
   - Enemies spawn and chase player
   - Score & health
*/

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const gameOverPanel = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart');

let W = 800, H = 600;
function resizeCanvas(){
  // fit to element CSS size while using devicePixelRatio for crispness
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  W = rect.width;
  H = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ----- Input ----- */
const input = {
  up:false, down:false, left:false, right:false,
  mx: W/2, my: H/2, mouseDown:false
};

window.addEventListener('keydown', e=>{
  if(e.key==='w' || e.key==='W' || e.key==='ArrowUp') input.up = true;
  if(e.key==='s' || e.key==='S' || e.key==='ArrowDown') input.down = true;
  if(e.key==='a' || e.key==='A' || e.key==='ArrowLeft') input.left = true;
  if(e.key==='d' || e.key==='D' || e.key==='ArrowRight') input.right = true;
});
window.addEventListener('keyup', e=>{
  if(e.key==='w' || e.key==='W' || e.key==='ArrowUp') input.up = false;
  if(e.key==='s' || e.key==='S' || e.key==='ArrowDown') input.down = false;
  if(e.key==='a' || e.key==='A' || e.key==='ArrowLeft') input.left = false;
  if(e.key==='d' || e.key==='D' || e.key==='ArrowRight') input.right = false;
});
canvas.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect();
  input.mx = e.clientX - rect.left;
  input.my = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e=>{ input.mouseDown=true; });
window.addEventListener('mouseup', e=>{ input.mouseDown=false; });

/* ----- Game Objects ----- */
class Player {
  constructor(x,y){
    this.x = x; this.y = y;
    this.radius = 14;
    this.speed = 180; // px/sec
    this.health = 100;
  }
  update(dt){
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
    // body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.fillStyle = '#8be8ff';
    ctx.arc(0,0,this.radius,0,Math.PI*2);
    ctx.fill();
    // aim direction indicator (nose)
    const angle = Math.atan2(input.my - this.y, input.mx - this.x);
    ctx.rotate(angle);
    ctx.fillStyle = '#04202b';
    ctx.fillRect(this.radius - 2, -4, 12, 8);
    ctx.restore();
  }
}

class Bullet {
  constructor(x,y,vx,vy){
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.radius = 4;
    this.life = 2.0; // seconds
  }
  update(dt){
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }
  draw(){
    ctx.beginPath();
    ctx.fillStyle = '#fff9c4';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fill();
  }
}

class Enemy {
  constructor(x,y,type='basic'){
    this.x = x; this.y = y;
    this.radius = 12;
    this.speed = 60 + Math.random()*40;
    this.type = type;
    this.hp = 1 + (type==='tank'?2:0);
    this.color = type==='tank' ? '#ff8a80' : '#ffb267';
  }
  update(dt, player){
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.x += Math.cos(angle) * this.speed * dt;
    this.y += Math.sin(angle) * this.speed * dt;
  }
  draw(){
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fill();
    // simple eye
    ctx.beginPath();
    ctx.fillStyle = '#201b1b22';
    ctx.arc(this.x + this.radius/3, this.y - this.radius/3, 3, 0, Math.PI*2);
    ctx.fill();
  }
}

/* ----- Game State ----- */
const state = {
  player: new Player(W/2,H/2),
  bullets: [],
  enemies: [],
  score: 0,
  spawnTimer: 0,
  spawnInterval: 1.1, // seconds
  shootingCooldown: 0,
  gameOver: false
};

/* ----- Utility ----- */
function randRange(a,b){ return a + Math.random()*(b-a); }
function distance(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

/* ----- Spawn enemies at edges ----- */
function spawnEnemy(){
  // choose random edge
  const edge = Math.floor(Math.random()*4);
  let x,y;
  if(edge===0){ x = randRange(0,W); y = -20; } // top
  if(edge===1){ x = randRange(0,W); y = H+20; } // bottom
  if(edge===2){ x = -20; y = randRange(0,H);}   // left
  if(edge===3){ x = W+20; y = randRange(0,H);}  // right

  // 10% chance of tank enemy
  const type = Math.random() < 0.10 ? 'tank' : 'basic';
  const e = new Enemy(x,y,type);
  if(type === 'tank'){ e.radius = 18; e.speed *= 0.7; e.hp = 3; }
  state.enemies.push(e);
}

/* ----- Shooting ----- */
function shootTowards(mx,my){
  const p = state.player;
  const angle = Math.atan2(my - p.y, mx - p.x);
  const speed = 420;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  // start bullet just in front of player
  const bx = p.x + Math.cos(angle) * (p.radius + 6);
  const by = p.y + Math.sin(angle) * (p.radius + 6);
  state.bullets.push(new Bullet(bx,by,vx,vy));
}

/* ----- Game Loop ----- */
let last = performance.now();
function loop(now){
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if(!state.gameOver) update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt){
  const p = state.player;
  p.update(dt);

  // Shooting control: allow holding mouse to fire with a cooldown
  state.shootingCooldown -= dt;
  const fireRate = 1/6; // 6 bullets per second
  if(input.mouseDown && state.shootingCooldown <= 0){
    shootTowards(input.mx, input.my);
    state.shootingCooldown = fireRate;
  }

  // bullets update and cull
  for(let i = state.bullets.length - 1; i >= 0; i--){
    const b = state.bullets[i];
    b.update(dt);
    if(b.life <= 0 || b.x < -50 || b.y < -50 || b.x > W+50 || b.y > H+50){
      state.bullets.splice(i,1);
    }
  }

  // spawn enemies gradually faster as score increases
  state.spawnTimer -= dt;
  if(state.spawnTimer <= 0){
    spawnEnemy();
    state.spawnTimer = Math.max(0.28, state.spawnInterval - Math.min(0.8, state.score*0.02));
  }

  // update enemies
  for(let i = state.enemies.length - 1; i >= 0; i--){
    const e = state.enemies[i];
    e.update(dt, p);

    // enemy hits player?
    const dx = e.x - p.x, dy = e.y - p.y;
    if(Math.hypot(dx,dy) < e.radius + p.radius - 2){
      // damage player and remove enemy
      p.health -= 12 + (e.type === 'tank' ? 10 : 0);
      state.enemies.splice(i,1);
      if(p.health <= 0){
        endGame();
        return;
      }
    }
  }

  // bullets hit enemies
  for(let i = state.bullets.length - 1; i >= 0; i--){
    const b = state.bullets[i];
    for(let j = state.enemies.length - 1; j >= 0; j--){
      const e = state.enemies[j];
      const d = Math.hypot(b.x - e.x, b.y - e.y);
      if(d < b.radius + e.radius){
        // hit
        e.hp -= 1;
        if(e.hp <= 0){
          state.enemies.splice(j,1);
          state.score += (e.type === 'tank' ? 5 : 1);
        }
        state.bullets.splice(i,1);
        break;
      }
    }
  }

  // update HUD
  scoreEl.textContent = `Score: ${state.score}`;
  healthEl.textContent = `Health: ${Math.max(0, Math.round(p.health))}`;
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // background grid / subtle
  const grid = 40;
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#ffffff';
  for(let x = 0; x < W; x += grid){
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for(let y = 0; y < H; y += grid){
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // draw bullets
  for(const b of state.bullets) b.draw();

  // draw enemies
  for(const e of state.enemies) e.draw();

  // draw player
  state.player.draw();

  // optionally draw crosshair
  ctx.beginPath();
  ctx.arc(input.mx, input.my, 6, 0, Math.PI*2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();

  // game over overlay
  if(state.gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,W,H);
  }
}

/* ----- Game Over and Restart ----- */
function endGame(){
  state.gameOver = true;
  gameOverPanel.classList.remove('hidden');
  finalScoreEl.textContent = `Score: ${state.score}`;
}

function resetGame(){
  state.player = new Player(W/2, H/2);
  state.bullets = [];
  state.enemies = [];
  state.score = 0;
  state.spawnTimer = 0.6;
  state.shootingCooldown = 0;
  state.gameOver = false;
  gameOverPanel.classList.add('hidden');
  last = performance.now();
}

restartBtn.addEventListener('click', ()=>resetGame());

/* Start */
resetGame();
requestAnimationFrame(loop);
