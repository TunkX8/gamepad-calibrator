// ====== Conexão e detecção ======
let currentProfile = "ps"; // ps | xbox | switch | generic

window.addEventListener("gamepadconnected", (e) => {
  const gp = navigator.getGamepads()[e.gamepad.index];
  console.log("Gamepad conectado:", gp.id);
  document.getElementById("connection-status")?.textContent = `Conectado: ${gp.id}`;
  currentProfile = detectProfile(gp.id);
  applyLabels(currentProfile);
  loop();
});

window.addEventListener("gamepaddisconnected", () => {
  console.log("Gamepad desconectado");
  document.getElementById("connection-status")?.textContent = "Aguardando controle...";
});

// ====== Detecta perfil do controle ======
function detectProfile(id = "") {
  const s = id.toLowerCase();
  if (s.includes("xbox")) return "xbox";
  if (s.includes("dualsense") || s.includes("dualshock") || s.includes("wireless controller")) return "ps";
  if (s.includes("nintendo") || s.includes("switch") || s.includes("pro controller")) return "switch";
  return "generic";
}

// ====== Aplica labels visuais ======
function applyLabels(profile){
  const tri = document.getElementById("btn-triangle");
  const cir = document.getElementById("btn-circle");
  const cro = document.getElementById("btn-cross");
  const sqr = document.getElementById("btn-square");
  const share = document.getElementById("share");
  const options = document.getElementById("options");
  const touch = document.getElementById("touch");
  const ps = document.getElementById("ps");
  const mic = document.getElementById("mic");

  if(profile === "xbox"){
    tri.textContent = "Y"; cir.textContent = "B"; cro.textContent = "A"; sqr.textContent = "X";
    share.textContent = "View"; options.textContent = "Menu"; touch.textContent = "Xbox"; ps.textContent = "Guide";
    mic.style.display = "none";
  } else if(profile === "switch"){
    tri.textContent = "X"; cir.textContent = "A"; cro.textContent = "B"; sqr.textContent = "Y";
    share.textContent = "−"; options.textContent = "+"; touch.textContent = "Home"; ps.textContent = "Capture";
    mic.style.display = "none";
  } else { // PS ou genérico
    tri.textContent = "△"; cir.textContent = "◯"; cro.textContent = "✕"; sqr.textContent = "□";
    share.textContent = "Share"; options.textContent = "Options"; touch.textContent = "Touch"; ps.textContent = "PS";
    mic.style.display = ""; // visível
  }
}

// ====== Mapeamento dos botões ======
function mappingFor(profile){
  const base = {
    l1:4, r1:5, l2:6, r2:7, l3:10, r3:11,
    share:8, options:9, ps:16, touch:17,
    dpad:{up:12, down:13, left:14, right:15},
    actions:{ cross:0, circle:1, square:2, triangle:3 },
    mic:null
  };
  return base;
}

// ====== Loop principal ======
function loop(){
  const gp = navigator.getGamepads()[0];
  if(gp){
    const map = mappingFor(currentProfile);
    updateButtons(gp, map);
    updateSticks(gp);
    updateTriggersPercent(gp, map);
  }
  requestAnimationFrame(loop);
}

// ====== Helpers ======
function setActive(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.toggle("active", !!on);
}

function pressed(btn){
  if(!btn) return false;
  return btn.pressed || btn.value > 0.05;
}

// ====== Atualiza botões ======
function updateButtons(gp, map){
  // L1/R1
  setActive("l1", pressed(gp.buttons[map.l1]));
  setActive("r1", pressed(gp.buttons[map.r1]));
  // L2/R2
  setActive("l2", pressed(gp.buttons[map.l2]));
  setActive("r2", pressed(gp.buttons[map.r2]));
  // L3/R3
  setActive("l3", pressed(gp.buttons[map.l3]));
  setActive("r3", pressed(gp.buttons[map.r3]));
  // Centro
  setActive("share", pressed(gp.buttons[map.share]));
  setActive("options", pressed(gp.buttons[map.options]));
  if(gp.buttons[map.ps]) setActive("ps", pressed(gp.buttons[map.ps]));
  if(gp.buttons[map.touch]) setActive("touch", pressed(gp.buttons[map.touch]));
  // MIC
  if(map.mic !== null && gp.buttons[map.mic]) setActive("mic", pressed(gp.buttons[map.mic]));
  else setActive("mic", false);
  // D-Pad
  setActive("dpad-up", pressed(gp.buttons[map.dpad.up]));
  setActive("dpad-down", pressed(gp.buttons[map.dpad.down]));
  setActive("dpad-left", pressed(gp.buttons[map.dpad.left]));
  setActive("dpad-right", pressed(gp.buttons[map.dpad.right]));
  // Botões de ação
  setActive("btn-square", pressed(gp.buttons[map.actions.square]));
  setActive("btn-cross", pressed(gp.buttons[map.actions.cross]));
  setActive("btn-circle", pressed(gp.buttons[map.actions.circle]));
  setActive("btn-triangle", pressed(gp.buttons[map.actions.triangle]));
}

// ====== Atualiza triggers ======
function updateTriggersPercent(gp, map){
  const l2Val = gp.buttons[map.l2]?.value || 0;
  const r2Val = gp.buttons[map.r2]?.value || 0;
  document.getElementById("l2-percent").textContent = Math.round(l2Val*100)+"%";
  document.getElementById("r2-percent").textContent = Math.round(r2Val*100)+"%";
  document.getElementById("l2-bar").style.width = `${l2Val*100}%`;
  document.getElementById("r2-bar").style.width = `${r2Val*100}%`;
}

// ====== Analógicos ======
function updateSticks(gp){
  drawStick("left-stick", gp.axes[0], gp.axes[1]);
  drawStick("right-stick", gp.axes[2], gp.axes[3]);
}

function drawStick(id, x, y){
  const c = document.getElementById(id);
  if(!c) return;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  const dz = parseFloat(document.getElementById("deadzone")?.value || "0.05");
  const drift = parseFloat(document.getElementById("drift")?.value || "0");

  const ax = Math.abs(x) < dz ? 0 : x;
  const ay = Math.abs(y) < dz ? 0 : y + drift;

  ctx.beginPath();
  ctx.arc(W/2, H/2, W/2 - 6, 0, Math.PI*2);
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(W/2 + ax*(W/2-12), H/2 + ay*(H/2-12), 10, 0, Math.PI*2);
  ctx.fillStyle = "#3ae03a";
  ctx.fill();
}
