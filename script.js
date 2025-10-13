:root{
  --panel-bg: rgba(10,10,30,0.85);
  --accent: #2c3ef0;
  --muted: rgba(255,255,255,0.08);
  --glass: rgba(255,255,255,0.04);
}

*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background: radial-gradient(circle at 30% 20%, #07102a 0%, #000 60%);
  color:#e6eef8;
  overflow:hidden;
}

/* Layout */
#game-ui{
  position:relative;
  display:flex;
  align-items:flex-start;
  height:100vh;
  width:100%;
}

/* Side panels */
#side-panel, #right-panel{
  width: 190px;
  padding: 12px;
  margin: 14px;
  background: var(--panel-bg);
  border-radius: 10px;
  border:1px solid rgba(255,255,255,0.04);
  box-shadow: 0 8px 30px rgba(2,6,23,0.6);
  z-index: 3;
}
#side-panel h2{ text-align:center; margin-bottom:8px; }
.panel-section{ margin-bottom:12px; }
.card-slot{
  background: rgba(255,255,255,0.03);
  padding:6px;
  margin-top:6px;
  border-radius:6px;
  text-align:center;
  font-size:13px;
}

/* Canvas centered and responsive */
#game{
  flex:1;
  display:block;
  margin: 12px 6px;
  border-radius: 10px;
  box-shadow: 0 8px 40px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
  background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00));
  /* We'll size the canvas in JS to fit area; set min size to keep aspect */
  min-width: 640px;
  min-height: 480px;
  z-index:1;
}

/* Dialogue box */
#dialogue-box{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  padding:16px 24px;
  background: rgba(5,8,20,0.92);
  border-top:1px solid rgba(255,255,255,0.04);
  z-index:4;
  display:flex;
  align-items:center;
  gap:12px;
}
#dialogue-text{
  flex:1;
  font-size:16px;
}
#next-dialogue{
  background: var(--accent);
  color: #00121a;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

/* Overlays (start-screen and game-over) */
.overlay{
  position: fixed;
  inset: 0;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.75));
  z-index: 6;
}
.start-panel{
  background: rgba(6,8,20,0.95);
  padding: 28px 30px;
  border-radius: 12px;
  text-align:center;
  width: 420px;
  border:1px solid rgba(255,255,255,0.03);
}
.start-panel h1{ margin-bottom:6px; font-size:36px; }
.subtitle{ color: #9fbff6; margin-bottom:12px; }
.desc{ color: #bfcbe6; margin-bottom:18px; }
.start-actions { display:flex; gap:10px; justify-content:center; }
.start-actions button{
  background: var(--accent);
  color: #00121a;
  border:none;
  padding:10px 18px;
  border-radius:8px;
  cursor:pointer;
}
.start-actions button:nth-child(2){ background: transparent; border:1px solid rgba(255,255,255,0.06); color:#dfe9ff; }

/* Game Over panel */
#game-over .overlay-panel{
  background: rgba(6,8,20,0.95);
  padding: 22px;
  border-radius:10px;
  text-align:center;
  border:1px solid rgba(255,255,255,0.03);
}

/* Hidden helper */
.hidden{ display:none; }

/* Small screen fallback */
@media (max-width: 980px){
  #side-panel, #right-panel { display:none; }
  #game { min-width: 100%; }
  #dialogue-box { font-size:14px; padding:10px; }
}
