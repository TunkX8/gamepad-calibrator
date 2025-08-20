let gamepad = null;
let deadzone = 0.05;
let drift = 0;

const buttonsGrid = document.getElementById("buttons-grid");
const sticksCanvas = document.getElementById("sticks-canvas");
const ctx = sticksCanvas.getContext("2d");

const connectionStatus = document.getElementById("connection-status");
const batteryLevel = document.getElementById("battery-level");

const buttonLabels = [
  "A / X", "B / O", "X / ☐", "Y / △",
  "LB / L1", "RB / R1", "LT / L2", "RT / R2",
  "Select / Share", "Start / Options",
  "LS", "RS", "D-Up", "D-Down", "D-Left", "D-Right",
  "PS / Xbox", "Touchpad"
];

// Cria grid de botões
buttonLabels.forEach(label => {
  const div = document.createElement("div");
  div.textContent = label;
  buttonsGrid.appendChild(div);
});

// Conexão do controle
window.addEventListener("gamepadconnected", e => {
  gamepad = e.gamepad;
  connectionStatus.textContent = "Conectado";
});

window.addEventListener("gamepaddisconnected", () => {
  gamepad = null;
  connectionStatus.textContent = "Aguardando controle...";
});

// Atualiza inputs
function update() {
  if (!gamepad) return;

  gamepad = navigator.getGamepads()[gamepad.index];

  // Atualiza botões
  gamepad.buttons.forEach((btn, i) => {
    const div = buttonsGrid.children[i];
    if (div) div.classList.toggle("active", btn.pressed);
  });

  // Atualiza analógicos + D-Pad
  ctx.clearRect(0, 0, sticksCanvas.width, sticksCanvas.height);
  ctx.fillStyle = "#5af2f2";
  ctx.beginPath();
  ctx.arc(
    150 + (gamepad.axes[0] + drift) * 100,
    150 + (gamepad.axes[1] + drift) * 100,
    10, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    150 + (gamepad.axes[2] + drift) * 100,
    150 + (gamepad.axes[3] + drift) * 100,
    10, 0, Math.PI * 2
  );
  ctx.fill();

  requestAnimationFrame(update);
}
requestAnimationFrame(update);

// Deadzone & Drift
document.getElementById("deadzone").addEventListener("input", e => {
  deadzone = parseFloat(e.target.value);
});
document.getElementById("drift").addEventListener("input", e => {
  drift = parseFloat(e.target.value);
});

// Perfis
document.getElementById("save-profile").addEventListener("click", () => {
  const profile = { deadzone, drift };
  localStorage.setItem("controllerProfile", JSON.stringify(profile));
  alert("Perfil salvo!");
});

document.getElementById("load-profile").addEventListener("click", () => {
  document.getElementById("file-input").click();
});
document.getElementById("file-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const profile = JSON.parse(reader.result);
    deadzone = profile.deadzone;
    drift = profile.drift;
    alert("Perfil importado!");
  };
  reader.readAsText(file);
});
document.getElementById("export-profile").addEventListener("click", () => {
  const profile = { deadzone, drift };
  const blob = new Blob([JSON.stringify(profile)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "profile.json";
  a.click();
});

// Bateria (se disponível)
setInterval(() => {
  if (gamepad && gamepad.battery) {
    batteryLevel.textContent = `${Math.round(gamepad.battery.level * 100)}%`;
  }
}, 2000);
