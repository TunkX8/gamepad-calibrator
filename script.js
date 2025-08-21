// ==============================
// JS – Calibrador de Controle Universal
// ==============================

// Elementos DOM
const connectionStatus = document.getElementById('connection-status');
const batteryLevel = document.getElementById('battery-level');
const deadzoneInput = document.getElementById('deadzone');
const driftInput = document.getElementById('drift');

// Botões
const buttons = {
  triangle: document.getElementById('btn-triangle'),
  square: document.getElementById('btn-square'),
  cross: document.getElementById('btn-cross'),
  circle: document.getElementById('btn-circle'),
  l1: document.getElementById('l1'),
  l2: document.getElementById('l2'),
  r1: document.getElementById('r1'),
  r2: document.getElementById('r2'),
  share: document.getElementById('share'),
  touch: document.getElementById('touch'),
  options: document.getElementById('options'),
  ps: document.getElementById('ps'),
  'dpad-up': document.getElementById('dpad-up'),
  'dpad-down': document.getElementById('dpad-down'),
  'dpad-left': document.getElementById('dpad-left'),
  'dpad-right': document.getElementById('dpad-right')
};

// Canvas sticks
const leftStickCanvas = document.getElementById('left-stick');
const rightStickCanvas = document.getElementById('right-stick');
const leftStickCtx = leftStickCanvas.getContext('2d');
const rightStickCtx = rightStickCanvas.getContext('2d');

let deadzone = parseFloat(deadzoneInput.value);
let drift = parseFloat(driftInput.value);

deadzoneInput.addEventListener('input', () => deadzone = parseFloat(deadzoneInput.value));
driftInput.addEventListener('input', () => drift = parseFloat(driftInput.value));

// ==============================
// Funções auxiliares
// ==============================
function applyDeadzone(value, deadzone) {
  if (Math.abs(value) < deadzone) return 0;
  return value;
}

function drawStick(ctx, x, y) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  ctx.arc(ctx.canvas.width/2 + x*40, ctx.canvas.height/2 + y*40, 10, 0, Math.PI*2);
  ctx.fillStyle = '#5af2f2';
  ctx.fill();
}

// ==============================
// Reset de botões ativos
// ==============================
function resetButtons() {
  Object.values(buttons).forEach(b => b.classList.remove('active'));
}

// ==============================
// Loop principal do gamepad
// ==============================
function updateGamepad() {
  const gp = navigator.getGamepads()[0];
  if (!gp) {
    requestAnimationFrame(updateGamepad);
    return;
  }

  connectionStatus.textContent = `Conectado: ${gp.id}`;
  if (gp.buttons[0].value !== undefined) batteryLevel.textContent = `${Math.round(gp.buttons[0].value*100)}%`;

  // Atualiza botões
  Object.keys(buttons).forEach((key, index) => {
    const btnEl = buttons[key];
    // Mapeia D-Pad separadamente
    if (key.startsWith('dpad')) {
      btnEl.classList.toggle('active', gp.buttons[12 + ['up','down','left','right'].indexOf(key.split('-')[1])]?.pressed);
    } else if (key === 'touch') {
      btnEl.classList.toggle('active', gp.buttons[gp.mapping === 'standard' ? 16 : 13]?.pressed);
    } else {
      btnEl.classList.toggle('active', gp.buttons[index]?.pressed);
    }
  });

  // Atualiza sticks
  drawStick(leftStickCtx, applyDeadzone(gp.axes[0], deadzone) + drift, applyDeadzone(gp.axes[1], deadzone) + drift);
  drawStick(rightStickCtx, applyDeadzone(gp.axes[2], deadzone) + drift, applyDeadzone(gp.axes[3], deadzone) + drift);

  requestAnimationFrame(updateGamepad);
}

// ==============================
// Eventos de conexão
// ==============================
window.addEventListener('gamepadconnected', (e) => {
  console.log('Gamepad conectado:', e.gamepad.id);
  updateGamepad();
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log('Gamepad desconectado:', e.gamepad.id);
  connectionStatus.textContent = 'Aguardando controle...';
  resetButtons();
});

// Inicializa se já houver gamepad
if (navigator.getGamepads()[0]) updateGamepad();
