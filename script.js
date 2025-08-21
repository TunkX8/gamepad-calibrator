// ====== Conexão ======
let currentProfile = "ps"; // ps | xbox | switch | generic

window.addEventListener("gamepadconnected", (e) => {
  const gp = navigator.getGamepads()[e.gamepad.index];
  document.getElementById("connection-status").textContent = `Conectado: ${gp.id}`;
  currentProfile = detectProfile(gp.id);
  applyLabels(currentProfile);
  loop();
});

window.addEventListener("gamepaddisconnected", () => {
  document.getElementById("connection-status").textContent = "Aguardando controle...";
});

// ====== Detecta tipo (rótulos/mapeamento) ======
function detectProfile(id="") {
  const s = id.toLowerCase();
  if (s.includes("xbox")) return "xbox";
  if (s.includes("dualsense") || s.includes("dualshock") || s.includes("wireless controller")) return "ps";
  if (s.includes("nintendo") || s.includes("switch") || s.includes("pro controller")) return "switch";
  return "generic";
}

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
    tri.textContent = "Y";
    cir.textContent = "B";
    cro.textContent = "A";
    sqr.textContent = "X";
    share.textContent = "View";
    options.textContent = "Menu";
    touch.textContent = "Xbox"; // Centro
    ps.textContent = "Guide";
    mic.style.display = "none";
  } else if(profile === "switch"){
    tri.textContent = "X";
    cir.textContent = "A";
    cro.textContent = "B";
    sqr.textContent = "Y";
    share.textContent = "−";
    options.textContent = "+";
    touch.textContent = "Home";
    ps.textContent = "Capture";
    mic.style.display = "none";
  } else {
    // PlayStation (default)
    tri.textContent = "△";
    cir.textContent = "◯";
    cro.textContent = "✕";
    sqr.textContent = "□";
    share.textContent = "Share";
    options.textContent = "Options";
    touch.textContent = "Touch";
    ps.textContent = "PS";
    mic.style.display = ""; // visível
  }
}

// ====== Mapeamento por perfil (índices) ======
function mappingFor(profile){
  // Standard mapping dos navegadores:
  // 0 A/✕, 1 B/◯, 2 X/□, 3 Y/△, 4 LB/L1, 5 RB/R1, 6 LT/L2, 7 RT/R2,
  // 8 Back/Share, 9 Start/Options, 10 L3, 11 R3, 12 Up, 13 Down, 14 Left, 15 Right, 16 Guide/PS, 17 Touch (PS)
  const base = {
    l1:4, r1:5, l2:6, r2:7,
    share:8, options:9, ps:16, touch:17,
    dpad:{up:12, down:13, left:14, right:15},
    actions:{ cross:0, circle:1, square:2, triangle:3 },
    mic:null // nem sempre exposto via Gamepad API
  };

  // Para Xbox/Switch, índices são iguais no "standard" — só mudam rótulos (feito em applyLabels).
  if(profile === "ps" || profile === "xbox" || profile === "switch" || profile === "generic"){
    return base;
  }
  return base;
}

// ====== Loop ======
function loop(){
  const gp = navigator.getGamepads()[0];
  if(gp){
    const map = mappingFor(currentProfile);
    updateButtons(gp, map);
    updateSticks(gp);
    updateBattery(gp);
  }
  requestAnimationFrame(loop);
}

// ====== UI helpers ======
function setActive(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.toggle("active", !!on);
}

// ====== Atualiza botões ======
function updateButtons(gp, map){
  // Triggers (considera valor analógico)
  setActive("l1", pressed(gp.buttons[map.l1]));
  setActive("r1", pressed(gp.buttons[map.r1]));
  setActive("l2", pressed(gp.buttons[map.l2]));
  setActive("r2", pressed(gp.buttons[map.r2]));

  // Centro
  setActive("share",  pressed(gp.buttons[map.share]));
  setActive("options",pressed(gp.buttons[map.options]));
  if (gp.buttons[map.ps])    setActive("ps",    pressed(gp.buttons[map.ps]));
  if (gp.buttons[map.touch]) setActive("touch", pressed(gp.buttons[map.touch]));

  // Mic (se existir índice utilizável no device)
  if(map.mic !== null && gp.buttons[map.mic]){
    setActive("mic", pressed(gp.buttons[map.mic]));
  } else {
    // tenta achar um possível "mic" sem conflitar com touch/dpad
    // (fallback seguro: nunca aciona se não existir)
    setActive("mic", false);
  }

  // D-Pad (garantido: NÃO conflita com Touch)
  setActive("dpad-up",    pressed(gp.buttons[map.dpad.up]));
  setActive("dpad-down",  pressed(gp.buttons[map.dpad.down]));
  setActive("dpad-left",  pressed(gp.buttons[map.dpad.left]));
  setActive("dpad-right", pressed(gp.buttons[map.dpad.right]));

  // Ação (sem inversão: ☐ esquerda, ✕ baixo, ◯ direita, △ topo)
  setActive("btn-square",   pressed(gp.buttons[map.actions.square]));
  setActive("btn-cross",    pressed(gp.buttons[map.actions.cross]));
  setActive("btn-circle",   pressed(gp.buttons[map.actions.circle]));
  setActive("btn-triangle", pressed(gp.buttons[map.actions.triangle]));
}

function pressed(btn){
  if(!btn) return false;
  return btn.pressed || btn.value > 0.45;
}

// ====== Analógicos ======
function updateSticks(gp){
  drawStick("left-stick",  gp.axes[0], gp.axes[1]);
  drawStick("right-stick", gp.axes[2], gp.axes[3]);
}

function drawStick(id, x, y){
  const c = document.getElementById(id);
  if(!c) return;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  // Deadzone e drift (simples)
  const dz = parseFloat(document.getElementById("deadzone").value || "0.05");
  const drift = parseFloat(document.getElementById("drift").value || "0");
  const ax = Math.abs(x) < dz ? 0 : x;
  const ay = Math.abs(y) < dz ? 0 : y + drift;

  // Fundo
  ctx.beginPath();
  ctx.arc(W/2, H/2, W/2 - 6, 0, Math.PI*2);
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Indicador
  ctx.beginPath();
  ctx.arc(W/2 + ax*(W/2 - 12), H/2 + ay*(H/2 - 12), 10, 0, Math.PI*2);
  ctx.fillStyle = "#3ae03a";
  ctx.fill();
}

// ====== Bateria (se exposta) ======
function updateBattery(gp){
  const el = document.getElementById("battery-level");
  try{
    if (gp && gp.battery && typeof gp.battery.level === "number"){
      el.textContent = Math.round(gp.battery.level * 100) + "%";
    } else {
      el.textContent = "--%";
    }
  } catch {
    el.textContent = "--%";
  }
}

// ====== Perfis (Salvar/Importar/Exportar) ======
const deadzone = document.getElementById("deadzone");
const drift = document.getElementById("drift");
const saveBtn = document.getElementById("save-profile");
const loadBtn = document.getElementById("load-profile");
const exportBtn = document.getElementById("export-profile");
const fileInput = document.getElementById("file-input");

saveBtn.addEventListener("click", () => {
  const profile = { deadzone: deadzone.value, drift: drift.value };
  localStorage.setItem("controllerProfile", JSON.stringify(profile));
  alert("Perfil salvo!");
});

loadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try{
      const profile = JSON.parse(ev.target.result);
      if(profile.deadzone) deadzone.value = profile.deadzone;
      if(profile.drift) drift.value = profile.drift;
    }catch{}
  };
  reader.readAsText(file);
});

exportBtn.addEventListener("click", () => {
  const profile = { deadzone: deadzone.value, drift: drift.value };
  const blob = new Blob([JSON.stringify(profile)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "profile.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});
