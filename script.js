let currentProfile = "ps";
let layoutApplied = false;

function detectProfile(id = "") {
  const s = id.toLowerCase();
  if (s.includes("xbox")) return "xbox";
  if (s.includes("dualsense") || s.includes("dualshock") || s.includes("wireless controller")) return "ps";
  if (s.includes("nintendo") || s.includes("switch") || s.includes("pro controller")) return "switch";
  return "generic";
}

function applyLayout(profile) {
  document.body.classList.remove("layout-ps", "layout-xbox", "layout-switch");
  document.body.classList.add(`layout-${profile}`);
}

function applyLabels(profile) {
  const labels = {
    tri: "btn-triangle",
    cir: "btn-circle",
    cro: "btn-cross",
    sqr: "btn-square",
    share: "share",
    options: "options",
    touch: "touch",
    ps: "ps",
    mic: "mic"
  };
  const el = {};
  for (const key in labels) {
    el[key] = document.getElementById(labels[key]);
  }

  if (profile === "xbox") {
    el.tri.textContent = "Y"; el.cir.textContent = "B"; el.cro.textContent = "A"; el.sqr.textContent = "X";
    el.share.textContent = "View"; el.options.textContent = "Menu"; el.touch.textContent = "Xbox"; el.ps.textContent = "Guide";
    el.mic.style.display = "none";
  } else if (profile === "switch") {
    el.tri.textContent = "X"; el.cir.textContent = "A"; el.cro.textContent = "B"; el.sqr.textContent = "Y";
    el.share.textContent = "−"; el.options.textContent = "+"; el.touch.textContent = "Home"; el.ps.textContent = "Capture";
    el.mic.style.display = "none";
  } else {
    el.tri.textContent = "△"; el.cir.textContent = "◯"; el.cro.textContent = "✕"; el.sqr.textContent = "□";
    el.share.textContent = "Share"; el.options.textContent = "Options"; el.touch.textContent = "Touch"; el.ps.textContent = "PS";
    el.mic.style.display = "";
  }

  document.getElementById("profile-name").textContent = profile.toUpperCase();
}

function loop() {
  const gamepads = navigator.getGamepads?.() || [];
  const gp = gamepads[0];

  if (gp) {
    document.getElementById("connection-status").textContent = `Conectado: ${gp.id}`;
    if (!layoutApplied) {
      currentProfile = detectProfile(gp.id);
      applyLabels(currentProfile);
      applyLayout(currentProfile);
      layoutApplied = true;
    }

    const map = mappingFor(currentProfile);
    updateButtons(gp, map);
    updateSticks(gp);
    updateTriggersPercent(gp, map);
    updateBattery(gp);
  } else {
    document.getElementById("connection-status").textContent = "Aguardando controle...";
    layoutApplied = false;
  }

  requestAnimationFrame(loop);
}

window.addEventListener("load", () => {
  loop(); // inicia o loop assim que a página carrega
});

function mappingFor(profile) {
  return {
    l1: 4, r1: 5, l2: 6, r2: 7, l3: 10, r3: 11,
    share: 8, options: 9, ps: 16, touch: 17,
    dpad: { up: 12, down: 13, left: 14, right: 15 },
    actions: { cross: 0, circle: 1, square: 2, triangle: 3 },
    mic: null
  };
}

function setActive(id, on) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("active", !!on);
}

function pressed(btn) {
  return btn?.pressed || btn?.value > 0.05;
}

function updateButtons(gp, map) {
  ["l1","r1","l2","r2","l3","r3"].forEach(id => setActive(id, pressed(gp.buttons[map[id]])));
  ["share","options","ps","touch"].forEach(id => setActive(id, pressed(gp.buttons[map[id]])));
  setActive("mic", map.mic !== null && gp.buttons[map.mic] ? pressed(gp.buttons[map.mic]) : false);
  ["dpad-up","dpad-down","dpad-left","dpad-right"].forEach(id => {
    const dir = id.split('-')[1];
    setActive(id, pressed(gp.buttons[map.dpad[dir]]));
  });
  ["btn-square","btn-cross","btn-circle","btn-triangle"].forEach(id => {
    const act = id.split('-')[1];
    setActive(id, pressed(gp.buttons[map.actions[act]]));
  });
}

function applyTriggerCurveValue(value, curvePercent){
  const t = curvePercent / 100;
  return Math.pow(value, 1 / (1 - t + 0.01));
}

function updateTriggersPercent(gp, map) {
  const curve = parseFloat(document.getElementById("triggerCurveSlider").value || "50");
  const l2Val = applyTriggerCurveValue(gp.buttons[map.l2]?.value || 0, curve);
  const r2Val = applyTriggerCurveValue(gp.buttons[map.r2]?.value || 0, curve);

  document.getElementById("l2-percent").textContent = Math.round(l2Val * 100) + "%";
  document.getElementById("r2-percent").textContent = Math.round(r2Val * 100) + "%";
  document.getElementById("l2-bar").style.width = `${l2Val * 100}%`;
  document.getElementById("r2-bar").style.width = `${r2Val * 100}%`;
}

function updateSticks(gp){
  drawStick("left-stick",  gp.axes[0], gp.axes[1]);
  drawStick("right-stick", gp.axes[2], gp.axes[3]);
}

function drawStick(id, x, y){
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  const dz = parseFloat(document.getElementById("deadzone").value || "0.05");
  const drift = parseFloat(document.getElementById("drift").value || "0");
  const ax = Math.abs(x) < dz ? 0 : x;
  const ay = Math.abs(y) < dz ? 0 : y + drift;

  ctx.beginPath();
  ctx.arc(W/2, H/2, W/2 - 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(W/2 + ax * (W/2 - 12), H/2 + ay * (H/2 - 12), 10, 0, Math.PI * 2);
  ctx.fillStyle = "#3ae03a";
  ctx.fill();
}

function updateBattery(gp){
  const el = document.getElementById("battery-level");
  try {
    el.textContent = (gp && gp.battery && typeof gp.battery.level === "number")
      ? Math.round(gp.battery.level * 100) + "%"
      : "--%";
  } catch {
    el.textContent = "--%";
  }
}
// ===== Perfis e configurações =====
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
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const profile = JSON.parse(ev.target.result);
      if (profile.deadzone) deadzone.value = profile.deadzone;
      if (profile.drift) drift.value = profile.drift;
      if (profile.sensitivity) sensitivitySlider.value = profile.sensitivity;
      if (profile.triggerCurve) triggerCurveSlider.value = profile.triggerCurve;
      if (profile.preset) presetProfile.value = profile.preset;
    } catch {
      alert("Erro ao carregar perfil.");
    }
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
  const blob = new Blob([JSON.stringify(profile)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "profile.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

resetBtn.addEventListener("click", () => {
  deadzone.value = "0.05";
  drift.value = "0";
  sensitivitySlider.value = "5";
  triggerCurveSlider.value = "50";
  presetProfile.value = "default";
});

presetProfile.addEventListener("change", (e) => applyPresetProfile(e.target.value));

function applyPresetProfile(preset) {
  switch (preset) {
    case 'fps':
      deadzone.value = "0.05";
      drift.value = "0";
      sensitivitySlider.value = "8";
      triggerCurveSlider.value = "60";
      break;
    case 'racing':
      deadzone.value = "0.08";
      drift.value = "0";
      sensitivitySlider.value = "5";
      triggerCurveSlider.value = "30";
      break;
    case 'fight':
      deadzone.value = "0.05";
      drift.value = "0";
      sensitivitySlider.value = "7";
      triggerCurveSlider.value = "50";
      break;
    default:
      deadzone.value = "0.05";
      drift.value = "0";
      sensitivitySlider.value = "5";
      triggerCurveSlider.value = "50";
      break;
  }
}

// Atualização em tempo real do painel
function updateDashboard() {
  document.getElementById('driftValue').textContent = drift.value;
  document.getElementById('deadzoneValue').textContent = deadzone.value;
  document.getElementById('sensitivityValue').textContent = sensitivitySlider.value;
  document.getElementById('triggerCurveValue').textContent = triggerCurveSlider.value;
  requestAnimationFrame(updateDashboard);
}
updateDashboard();