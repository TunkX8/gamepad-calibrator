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
function detectProfile(id = "") {
  const s = id.toLowerCase();
  if (s.includes("xbox")) return "xbox";
  if (s.includes("dualsense") || s.includes("dualshock") || s.includes("wireless controller")) return "ps";
  if (s.includes("nintendo") || s.includes("switch") || s.includes("pro controller")) return "switch";
  return "generic";
}

function applyLabels(profile) {
  const tri = document.getElementById("btn-triangle");
  const cir = document.getElementById("btn-circle");
  const cro = document.getElementById("btn-cross");
  const sqr = document.getElementById("btn-square");
  const share = document.getElementById("share");
  const options = document.getElementById("options");
  const touch = document.getElementById("touch");
  const ps = document.getElementById("ps");
  const mic = document.getElementById("mic");

  if (profile === "xbox") {
    tri.textContent = "Y"; cir.textContent = "B"; cro.textContent = "A"; sqr.textContent = "X";
    share.textContent = "View"; options.textContent = "Menu"; touch.textContent = "Xbox"; ps.textContent = "Guide";
    mic.style.display = "none";
  } else if (profile === "switch") {
    tri.textContent = "X"; cir.textContent = "A"; cro.textContent = "B"; sqr.textContent = "Y";
    share.textContent = "−"; options.textContent = "+"; touch.textContent = "Home"; ps.textContent = "Capture";
    mic.style.display = "none";
  } else {
    tri.textContent = "△"; cir.textContent = "◯"; cro.textContent = "✕"; sqr.textContent = "□";
    share.textContent = "Share"; options.textContent = "Options"; touch.textContent = "Touch"; ps.textContent = "PS";
    mic.style.display = ""; // visível
  }
}

// ====== Mapeamento por perfil (índices) ======
function mappingFor(profile) {
  return {
    l1: 4, r1: 5, l2: 6, r2: 7, l3: 10, r3: 11,
    share: 8, options: 9, ps: 16, touch: 17,
    dpad: { up: 12, down: 13, left: 14, right: 15 },
    actions: { cross: 0, circle: 1, square: 2, triangle: 3 },
    mic: 18 // nem todos os controles têm esse botão
  };
}

// ====== Loop principal ======
function loop() {
  const gp = navigator.getGamepads()[0];
  if (gp) {
    const map = mappingFor(currentProfile);
    updateButtons(gp, map);
    updateSticks(gp);
    updateTriggersPercent(gp, map);
    updateBattery(gp);
  }
  requestAnimationFrame(loop);
}

// ====== Helpers ======
function setActive(id, on) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("active", !!on);
}

function pressed(btn) {
  if (!btn) return false;
  return btn.pressed || btn.value > 0.05;
}

// ====== Atualiza botões ======
function updateButtons(gp, map) {
  ["l1","r1","l2","r2","l3","r3"].forEach(id => setActive(id, pressed(gp.buttons[map[id]])));
  ["share","options","ps","touch","mic"].forEach(id => setActive(id, pressed(gp.buttons[map[id]])));
  ["dpad-up","dpad-down","dpad-left","dpad-right"].forEach(id => setActive(id, pressed(gp.buttons[map.dpad[id.split('-')[1]]])));
  ["btn-square","btn-cross","btn-circle","btn-triangle"].forEach(id => setActive(id, pressed(gp.buttons[map.actions[id.split('-')[1]]])));
}

// ====== Atualiza triggers com porcentagem ======
function applyTriggerCurveValue(value, curvePercent){
  // curvePercent = 0-100 (linear -> mais responsivo)
  const t = curvePercent/100;
  return Math.pow(value, 1/(1-t+0.01)); // adiciona 0.01 para evitar divisão por zero
}

function updateTriggersPercent(gp, map) {
  const curve = parseFloat(document.getElementById("triggerCurveSlider").value || "50");
  const l2Val = applyTriggerCurveValue(gp.buttons[map.l2]?.value || 0, curve);
  const r2Val = applyTriggerCurveValue(gp.buttons[map.r2]?.value || 0, curve);

  document.getElementById("l2-percent").textContent = Math.round(l2Val*100) + "%";
  document.getElementById("r2-percent").textContent = Math.round(r2Val*100) + "%";
  document.getElementById("l2-bar").style.width = `${l2Val*100}%`;
  document.getElementById("r2-bar").style.width = `${r2Val*100}%`;
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

  const dz = parseFloat(document.getElementById("deadzone").value || "0.05");
  const drift = parseFloat(document.getElementById("drift").value || "0");
  const ax = Math.abs(x) < dz ? 0 : x;
  const ay = Math.abs(y) < dz ? 0 : y + drift;

  ctx.beginPath();
  ctx.arc(W/2, H/2, W/2 - 6, 0, Math.PI*2);
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(W/2 + ax*(W/2 - 12), H/2 + ay*(H/2 - 12), 10, 0, Math.PI*2);
  ctx.fillStyle = "#3ae03a";
  ctx.fill();
}

// ====== Bateria ======
function updateBattery(gp){
  const el = document.getElementById("battery-level");
  try{
    el.textContent = (gp && gp.battery && typeof gp.battery.level === "number") ? Math.round(gp.battery.level*100)+"%" : "--%";
  }catch{ el.textContent="--%"; }
}

// ====== Perfis (Salvar/Importar/Exportar) ======
const deadzone = document.getElementById("deadzone");
const drift = document.getElementById("drift");
const saveBtn = document.getElementById("save-profile");
const loadBtn = document.getElementById("load-profile");
const exportBtn = document.getElementById("export-profile");
const fileInput = document.getElementById("file-input");
const resetBtn = document.getElementById("resetSettings");
const sensitivitySlider = document.getElementById("sensitivitySlider");
const triggerCurveSlider = document.getElementById("triggerCurveSlider");
const presetProfile = document.getElementById("presetProfile");

saveBtn.addEventListener("click", () => {
  const profile = {
    deadzone: deadzone.value,
    drift: drift.value,
    sensitivity: sensitivitySlider.value,
    triggerCurve: triggerCurveSlider.value,
    preset: presetProfile.value
  };
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
      if(profile.sensitivity) sensitivitySlider.value = profile.sensitivity;
      if(profile.triggerCurve) triggerCurveSlider.value = profile.triggerCurve;
      if(profile.preset) presetProfile.value = profile.preset;
    }catch{}
  };
  reader.readAsText(file);
});

exportBtn.addEventListener("click", () => {
  const profile = {
    deadzone: deadzone.value,
    drift: drift.value,
    sensitivity: sensitivitySlider.value,
    triggerCurve: triggerCurveSlider.value,
    preset: presetProfile.value
  };
  const blob = new Blob([JSON.stringify(profile)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "profile.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

// ====== Reset ======
resetBtn.addEventListener("click", () => {
  deadzone.value = "0.05";
  drift.value = "0";
  sensitivitySlider.value = "5";
  triggerCurveSlider.value = "50";
  presetProfile.value = "default";
});

// ====== Menu Avançado ======
const toggleBtn = document.getElementById('toggleAdvanced');
const advancedPanel = document.getElementById('advancedPanel');
toggleBtn.addEventListener('click', () => {
  const isVisible = advancedPanel.style.display === 'block';
  advancedPanel.style.display = isVisible ? 'none' : 'block';
  toggleBtn.textContent = isVisible ? 'Avançado' : 'Básico';
});

// ====== Atualização em tempo real ======
function updateDashboard() {
  document.getElementById('driftValue').textContent = drift.value;
  document.getElementById('deadzoneValue').textContent = deadzone.value;
  document.getElementById('sensitivityValue').textContent = sensitivitySlider.value;
  document.getElementById('triggerCurveValue').textContent = triggerCurveSlider.value;
  requestAnimationFrame(updateDashboard);
}
updateDashboard();

// ====== Presets ======
presetProfile.addEventListener('change', (e) => applyPresetProfile(e.target.value));

function applyPresetProfile(preset){
  switch(preset){
    case 'fps': deadzone.value="0.05"; drift.value="0"; sensitivitySlider.value="8"; triggerCurveSlider.value="60"; break;
    case 'racing': deadzone.value="0.08"; drift.value="0"; sensitivitySlider.value="5"; triggerCurveSlider.value="30"; break;
    case 'fight': deadzone.value="0.05"; drift.value="0"; sensitivitySlider.value="7"; triggerCurveSlider.value="50"; break;
    default: deadzone.value="0.05"; drift.value="0"; sensitivitySlider.value="5"; triggerCurveSlider.value="50"; break;
  }
}
