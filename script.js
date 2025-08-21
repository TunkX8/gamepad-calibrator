window.addEventListener("gamepadconnected", (e) => {
  const gp = navigator.getGamepads()[e.gamepad.index];
  document.getElementById("connection-status").textContent =
    `Conectado: ${gp.id}`;
  updateLoop();
});

window.addEventListener("gamepaddisconnected", () => {
  document.getElementById("connection-status").textContent =
    "Aguardando controle...";
});

// ===== Atualização em loop =====
function updateLoop() {
  const gp = navigator.getGamepads()[0];
  if (gp) {
    updateButtons(gp);
    updateSticks(gp);
    updateBattery(gp);
  }
  requestAnimationFrame(updateLoop);
}

// ===== Atualizar botões =====
function updateButtons(gp) {
  const map = {
    // Top buttons
    l1: gp.buttons[4],
    r1: gp.buttons[5],
    l2: gp.buttons[6],
    r2: gp.buttons[7],

    // Centro
    share: gp.buttons[8],
    options: gp.buttons[9],
    touch: gp.buttons[17], // Touchpad separado
    ps: gp.buttons[16],

    // D-Pad (corrigido! não conflita mais com touch)
    dpadUp: gp.buttons[12],
    dpadDown: gp.buttons[13],
    dpadLeft: gp.buttons[14],
    dpadRight: gp.buttons[15],

    // Ação
    "btn-square": gp.buttons[3],
    "btn-cross": gp.buttons[0],
    "btn-circle": gp.buttons[1],
    "btn-triangle": gp.buttons[2],
  };

  for (const id in map) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (map[id].pressed) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  }
}

// ===== Atualizar sticks =====
function updateSticks(gp) {
  drawStick("left-stick", gp.axes[0], gp.axes[1]);
  drawStick("right-stick", gp.axes[2], gp.axes[3]);

  // D-Pad visual
  drawDpad("dpad", {
    up: gp.buttons[12].pressed,
    down: gp.buttons[13].pressed,
    left: gp.buttons[14].pressed,
    right: gp.buttons[15].pressed,
  });
}

// ===== Desenhar analógicos =====
function drawStick(canvasId, x, y) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;

  ctx.clearRect(0, 0, size, size);

  // Círculo de fundo
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Indicador
  ctx.beginPath();
  ctx.arc(
    size / 2 + x * (size / 2 - 10),
    size / 2 + y * (size / 2 - 10),
    10,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#3ae03a";
  ctx.fill();
}

// ===== Desenhar D-Pad =====
function drawDpad(canvasId, state) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = "#222";
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 2;

  // Base
  ctx.beginPath();
  ctx.rect(size / 4, 0, size / 2, size); // vertical
  ctx.rect(0, size / 4, size, size / 2); // horizontal
  ctx.fill();
  ctx.stroke();

  // Highlight pressionado
  ctx.fillStyle = "#3ae03a";

  if (state.up) ctx.fillRect(size / 4, 0, size / 2, size / 4);
  if (state.down) ctx.fillRect(size / 4, size * 0.75, size / 2, size / 4);
  if (state.left) ctx.fillRect(0, size / 4, size / 4, size / 2);
  if (state.right) ctx.fillRect(size * 0.75, size / 4, size / 4, size / 2);
}

// ===== Bateria =====
function updateBattery(gp) {
  if (gp && gp.battery && gp.battery.level) {
    document.getElementById("battery-level").textContent =
      Math.round(gp.battery.level * 100) + "%";
  } else {
    document.getElementById("battery-level").textContent = "--%";
  }
}

// ===== Perfis =====
const saveBtn = document.getElementById("save-profile");
const loadBtn = document.getElementById("load-profile");
const exportBtn = document.getElementById("export-profile");
const fileInput = document.getElementById("file-input");

saveBtn.addEventListener("click", () => {
  const profile = { deadzone: deadzone.value, drift: drift.value };
  localStorage.setItem("controllerProfile", JSON.stringify(profile));
  alert("Perfil salvo!");
});

loadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const profile = JSON.parse(ev.target.result);
    deadzone.value = profile.deadzone;
    drift.value = profile.drift;
  };
  reader.readAsText(file);
});

exportBtn.addEventListener("click", () => {
  const profile = { deadzone: deadzone.value, drift: drift.value };
  const blob = new Blob([JSON.stringify(profile)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "profile.json";
  a.click();
});
