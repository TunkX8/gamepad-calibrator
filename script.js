// ====== Conexão / Perfil ======
let currentProfile = "ps"; // ps | xbox | switch | generic

function setText(id, text){
  const el = document.getElementById(id);
  if(el) el.textContent = text;
}

window.addEventListener("gamepadconnected", (e) => {
  const gp = navigator.getGamepads()[e.gamepad.index];
  setText("connection-status", `Conectado: ${gp.id}`);
  currentProfile = detectProfile(gp.id);
  setText("profile-name", profileLabel(currentProfile));
  applyLabels(currentProfile);
  loop();
});

window.addEventListener("gamepaddisconnected", () => {
  setText("connection-status", "Aguardando controle...");
});

// Ao carregar, tenta detectar um controle já conectado
window.addEventListener("load", () => {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && pads[0];
  if (gp && gp.id) {
    setText("connection-status", `Conectado: ${gp.id}`);
    currentProfile = detectProfile(gp.id);
    setText("profile-name", profileLabel(currentProfile));
    applyLabels(currentProfile);
    loop();
  }
});

function profileLabel(p){
  switch(p){
    case "xbox": return "Xbox";
    case "switch": return "Switch";
    case "ps": return "PlayStation";
    default: return "Genérico";
  }
}

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
    if(tri) tri.textContent = "Y";
    if(cir) cir.textContent = "B";
    if(cro) cro.textContent = "A";
    if(sqr) sqr.textContent = "X";
    if(share) share.textContent = "View";
    if(options) options.textContent = "Menu";
    if(touch) touch.textContent = "Xbox";
    if(ps) ps.textContent = "Guide";
    if(mic) mic.style.display = "none";
  } else if(profile === "switch"){
    if(tri) tri.textContent = "X";
    if(cir) cir.textContent = "A";
    if(cro) cro.textContent = "B";
    if(sqr) sqr.textContent = "Y";
    if(share) share.textContent = "−";
    if(options) options.textContent = "+";
    if(touch) touch.textContent = "Home";
    if(ps) ps.textContent = "Capture";
    if(mic) mic.style.display = "none";
  } else {
    if(tri) tri.textContent = "△";
    if(cir) cir.textContent = "◯";
    if(cro) cro.textContent = "✕";
    if(sqr) sqr.textContent = "□";
    if(share) share.textContent = "Share";
    if(options) options.textContent = "Options";
    if(touch) touch.textContent = "Touch";
    if(ps) ps.textContent = "PS";
    if(mic) mic.style.display = ""; // visível
  }
}

// ====== Mapeamento por perfil (índices) ======
function mappingFor(profile){
  // Mantive seu base. Se precisar diferenciar por perfil no futuro, ajustamos aqui.
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
    updateBattery(gp);
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
  return btn.pressed || btn.value > 0.05; // mais sensível
}

// ====== Atualiza botões ======
function updateButtons(gp, map){
  setActive("l1", pressed(gp.buttons[map.l1]));
  setActive("r1", pressed(gp.buttons[map.r1]));
  setActive("l2", pressed(gp.buttons[map.l2]));
  setActive("r2", pressed(gp.buttons[map.r2]));

  setActive("l3", pressed(gp.buttons[map.l3]));
  setActive("r3", pressed(gp.buttons[map.r3]));

  setActive("share", pressed(gp.buttons[map.share]));
  setActive("options", pressed(gp.buttons[map.options]));
  if(gp.buttons[map.ps])    setActive("ps", pressed(gp.buttons[map.ps]));
  if(gp.buttons[map.touch]) setActive("touch", pressed(gp.buttons[map.touch]));

  // MIC fallback
  if(map.mic !== null && gp.buttons[map.mic]){
    setActive("mic", pressed(gp.buttons[map.mic]));
  } else {
    setActive("mic", false);
  }

  // D-Pad
  setActive("dpad-up",    pressed(gp.buttons[map.dpad.up]));
  setActive("dpad-down",  pressed(gp.buttons[map.dpad.down]));
  setActive("dpad-left",  pressed(gp.buttons[map.dpad.left]));
  setActive("dpad-right", pressed(gp.buttons[map.dpad.right]));

  // Ação
  setActive("btn-square",   pressed(gp.buttons[map.actions.square]));
  setActive("btn-cross",    pressed(gp.buttons[map.actions.cross]));
  setActive("btn-circle",   pressed(gp.buttons[map.actions.circle]));
  setActive("btn-triangle", pressed(gp.buttons[map.actions.triangle]));
}

// ====== Triggers com porcentagem ======
function updateTriggersPercent(gp, map){
  const l2Val = gp.buttons[map.l2]?.value || 0;
  const r2Val = gp.buttons[map.r2]?.value || 0;
  setText("l2-percent", Math.round(l2Val*100) + "%");
  setText("r2-percent", Math.round(r2Val*100) + "%");
  const l2bar = document.getElementById("l2-bar");
  const r2bar = document.getElementById("r2-bar");
  if(l2bar) l2bar.style.width = `${l2Val*100}%`;
  if(r2bar) r2bar.style.width = `${r2Val*100}%`;
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

  // Deadzone e drift
  const dz = parseFloat(document.getElementById("deadzone")?.value || "0.05");
  const drift = parseFloat(document.getElementById("drift")?.value || "0");
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

// ====== Bateria ======
function updateBattery(gp){
  const el = document.getElementById("battery-level");
  try{
    if (gp && gp.battery && typeof gp.battery.level === "number"){
      el.textContent = Math.round(gp.battery.level * 100) + "%";
    } else {
      el.textContent = "--%";
    }
  } catch {
    if (el) el.textContent = "--%";
  }
}

// ====== Perfis (Salvar/Importar/Exportar) ======
const deadzone = document.getElementById("deadzone");
const drift = document.getElementById("drift");
const saveBtn = document.getElementById("save-profile");
const loadBtn = document.getElementById("load-profile");
const exportBtn = document.getElementById("export-profile");
const fileInput = document.getElementById("file-input");

saveBtn?.addEventListener("click", () => {
  const profile = {
    deadzone: deadzone?.value,
    drift: drift?.value,
    sensitivity: document.getElementById("sensitivitySlider")?.value,
    triggerCurve: document.getElementById("triggerCurveSlider")?.value
  };
  localStorage.setItem("controllerProfile", JSON.stringify(profile));
  alert("Perfil salvo!");
});

loadBtn?.addEventListener("click", () => fileInput?.click());

fileInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try{
      const profile = JSON.parse(ev.target.result);
      if(profile.deadzone && deadzone) deadzone.value = profile.deadzone;
      if(profile.drift && drift) drift.value = profile.drift;
      const sens = document.getElementById("sensitivitySlider");
      const curva = document.getElementById("triggerCurveSlider");
      if(profile.sensitivity && sens){ sens.value = profile.sensitivity; setText("sensitivityValue", sens.value); }
      if(profile.triggerCurve && curva){ curva.value = profile.triggerCurve; setText("triggerCurveValue", curva.value); }
    }catch{}
  };
  reader.readAsText(file);
});

exportBtn?.addEventListener("click", () => {
  const profile = {
    deadzone: deadzone?.value,
    drift: drift?.value,
    sensitivity: document.getElementById("sensitivitySlider")?.value,
    triggerCurve: document.getElementById("triggerCurveSlider")?.value
  };
  const blob = new Blob([JSON.stringify(profile)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "profile.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

// ====== Painel Avançado (guarda para não quebrar se remover) ======
const toggleBtn = document.getElementById('toggleAdvanced');
const advancedPanel = document.getElementById('advancedPanel');
if(toggleBtn && advancedPanel){
  toggleBtn.addEventListener('click', () => {
    const isVisible = advancedPanel.style.display === 'block';
    advancedPanel.style.display = isVisible ? 'none' : 'block';
    toggleBtn.textContent = isVisible ? 'Avançado' : 'Básico';
  });
}

// ====== UI: atualizar valores ao vivo + Reset ======
const sensitivitySlider = document.getElementById('sensitivitySlider');
const triggerCurveSlider = document.getElementById('triggerCurveSlider');
const presetProfile = document.getElementById('presetProfile');

function applySensitivity(val){ console.log("Sensibilidade aplicada:", val); }
function applyTriggerCurve(val){ console.log("Curva do gatilho aplicada:", val); }
function applyPresetProfile(preset){
  console.log("Perfil selecionado:", preset);
  switch(preset){
    case 'fps': applySensitivity(8); applyTriggerCurve(60); break;
    case 'racing': applySensitivity(5); applyTriggerCurve(30); break;
    case 'fight': applySensitivity(7); applyTriggerCurve(50); break;
  }
}

// labels em tempo real
sensitivitySlider?.addEventListener('input', (e) => {
  setText('sensitivityValue', e.target.value);
  applySensitivity(e.target.value);
});
triggerCurveSlider?.addEventListener('input', (e) => {
  setText('triggerCurveValue', e.target.value);
  applyTriggerCurve(e.target.value);
});
presetProfile?.addEventListener('change', (e) => applyPresetProfile(e.target.value));

// exibir drift/deadzone continuamente
function updateDashboard(){
  if (drift) setText('driftValue', drift.value);
  if (deadzone) setText('deadzoneValue', deadzone.value);
  requestAnimationFrame(updateDashboard);
}
updateDashboard();

// Reset para padrão
document.getElementById('resetSettings')?.addEventListener('click', () => {
  if(deadzone){ deadzone.value = "0.05"; setText('deadzoneValue', deadzone.value); }
  if(drift){ drift.value = "0"; setText('driftValue', drift.value); }
  if(sensitivitySlider){ sensitivitySlider.value = "5"; setText('sensitivityValue', "5"); applySensitivity(5); }
  if(triggerCurveSlider){ triggerCurveSlider.value = "50"; setText('triggerCurveValue', "50"); applyTriggerCurve(50); }
});
