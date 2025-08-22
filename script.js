let currentProfile = "ps";

window.addEventListener("gamepadconnected", (e) => {
  const gp = navigator.getGamepads()[e.gamepad.index];
  console.log("Conectado:", gp.id);
  currentProfile = detectProfile(gp.id);
  loop();
});

window.addEventListener("gamepaddisconnected", () => {
  console.log("Controle desconectado");
});

function detectProfile(id="") {
  const s = id.toLowerCase();
  if(s.includes("xbox")) return "xbox";
  if(s.includes("dualsense") || s.includes("dualshock")) return "ps";
  if(s.includes("nintendo") || s.includes("switch")) return "switch";
  return "generic";
}

function mappingFor(profile){
  const base = {
    l1:4, r1:5, l2:6, r2:7,
    l3:10, r3:11,
    share:8, options:9, ps:16, touch:17, mic:null,
    dpad:{up:12, down:13, left:14, right:15},
    actions:{ cross:0, circle:1, square:2, triangle:3 }
  };
  return base;
}

function pressed(btn){
  return btn && (btn.pressed || btn.value > 0.05);
}

function setActive(id, on){
  const el = document.getElementById(id);
  if(el) el.classList.toggle("active", !!on);
}

function updateButtons(gp, map){
  setActive("l1", pressed(gp.buttons[map.l1]));
  setActive("r1", pressed(gp.buttons[map.r1]));
  setActive("l2", pressed(gp.buttons[map.l2]));
  setActive("r2", pressed(gp.buttons[map.r2]));
  setActive("l3", pressed(gp.buttons[map.l3]));
  setActive("r3", pressed(gp.buttons[map.r3]));

  setActive("share", pressed(gp.buttons[map.share]));
  setActive("options", pressed(gp.buttons[map.options]));
  if(map.ps !== null) setActive("ps", pressed(gp.buttons[map.ps]));
  if(map.touch !== null) setActive("touch", pressed(gp.buttons[map.touch]));
  if(map.mic !== null) setActive("mic", pressed(gp.buttons[map.mic]));

  setActive("dpad-up", pressed(gp.buttons[map.dpad.up]));
  setActive("dpad-down", pressed(gp.buttons[map.dpad.down]));
  setActive("dpad-left", pressed(gp.buttons[map.dpad.left]));
  setActive("dpad-right", pressed(gp.buttons[map.dpad.right]));

  setActive("btn-cross", pressed(gp.buttons[map.actions.cross]));
  setActive("btn-circle", pressed(gp.buttons[map.actions.circle]));
  setActive("btn-square", pressed(gp.buttons[map.actions.square]));
  setActive("btn-triangle", pressed(gp.buttons[map.actions.triangle]));
}

function updateTriggers(gp, map){
  const l2Val = gp.buttons[map.l2]?.value || 0;
  const r2Val = gp.buttons[map.r2]?.value || 0;
  document.getElementById("l2-percent").textContent = Math.round(l2Val*100) + "%";
  document.getElementById("r2-percent").textContent = Math.round(r2Val*100) + "%";
  document.getElementById("l2-bar").style.width = `${l2Val*100}%`;
  document.getElementById("r2-bar").style.width = `${r2Val*100}%`;
}

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
  ctx.beginPath();
  ctx.arc(W/2 + x*(W/2-10), H/2 + y*(H/2-10), 10, 0, Math.PI*2);
  ctx.fillStyle = "#0ff";
  ctx.fill();
}

function loop(){
  const gp = navigator.getGamepads()[0];
  if(gp){
    const map = mappingFor(currentProfile);
    updateButtons(gp, map);
    updateTriggers(gp, map);
    updateSticks(gp);
  }
  requestAnimationFrame(loop);
}

// Configurações de deadzone e drift
const deadzone = document.getElementById("deadzone");
const drift = document.getElementById("drift");
deadzone.addEventListener("input", () => {
  document.getElementById("deadzoneValue").textContent = deadzone.value;
});
drift.addEventListener("input", () => {
  document.getElementById("driftValue").textContent = drift.value;
});
