// ==============================
// Parte 1 – Inicialização e configuração
// ==============================

// Elementos de status
const connectionStatus = document.getElementById('connection-status');
const batteryLevel = document.getElementById('battery-level');

// Deadzone e drift
const deadzoneInput = document.getElementById('deadzone');
const driftInput = document.getElementById('drift');

let deadzone = parseFloat(deadzoneInput.value);
let drift = parseFloat(driftInput.value);

deadzoneInput.addEventListener('input', () => deadzone = parseFloat(deadzoneInput.value));
driftInput.addEventListener('input', () => drift = parseFloat(driftInput.value));

// ==============================
// Botões e D-Pad
// ==============================
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
  ps: document.getElementById('ps')
};

// Canvas para sticks e D-Pad
const dpadCanvas = document.getElementById('dpad');
const dpadCtx = dpadCanvas.getContext('2d');

const leftStickCanvas = document.getElementById('left-stick');
const leftStickCtx = leftStickCanvas.getContext('2d');

const rightStickCanvas = document.getElementById('right-stick');
const rightStickCtx = rightStickCanvas.getContext('2d');

// ==============================
// Helpers
// ==============================
function applyDeadzone(value, dz) {
  if (Math.abs(value) < dz) return 0;
  return value;
}

function drawStick(ctx, x, y) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width / 2 - 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#5af2f2';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(ctx.canvas.width / 2 + x * (ctx.canvas.width / 2 - 20),
          ctx.canvas.height / 2 + y * (ctx.canvas.height / 2 - 20),
          10, 0, Math.PI * 2);
  ctx.fillStyle = '#3ae03a';
  ctx.fill();
}

function drawDpad() {
  dpadCtx.clearRect(0, 0, dpadCanvas.width, dpadCanvas.height);
  const size = 20;
  const midX = dpadCanvas.width / 2;
  const midY = dpadCanvas.height / 2;

  dpadCtx.fillStyle = '#5af2f2';
  // Up
  dpadCtx.fillRect(midX - size/2, 0, size, size);
  // Down
  dpadCtx.fillRect(midX - size/2, dpadCanvas.height - size, size, size);
  // Left
  dpadCtx.fillRect(0, midY - size/2, size, size);
  // Right
  dpadCtx.fillRect(dpadCanvas.width - size, midY - size/2, size, size);
}

// ==============================
// Gamepad state
// ==============================
let prevButtons = [];
let gamepadType = 'unknown'; // PS5 / Xbox / Switch / Genérico
// ==============================
// Parte 2 – Loop e mapeamento de botões
// ==============================

function gamepadLoop() {
  const gamepads = navigator.getGamepads();
  if (!gamepads) return requestAnimationFrame(gamepadLoop);

  const gp = gamepads[0];
  if (!gp) {
    connectionStatus.textContent = 'Aguardando controle...';
    return requestAnimationFrame(gamepadLoop);
  }

  // Atualiza status
  connectionStatus.textContent = 'Controle conectado!';
  if (gp.battery) batteryLevel.textContent = `${Math.round(gp.battery.level * 100)}%`;

  // Detecta tipo de controle
  if (gamepadType === 'unknown') {
    const id = gp.id.toLowerCase();
    if (id.includes('playstation') || id.includes('ps5')) gamepadType = 'ps5';
    else if (id.includes('xbox')) gamepadType = 'xbox';
    else if (id.includes('switch')) gamepadType = 'switch';
    else gamepadType = 'generic';
  }

  // ==============================
  // Botões
  // ==============================
  gp.buttons.forEach((btn, index) => {
    const pressed = btn.pressed;
    if (pressed && !prevButtons[index]) handleButton(index, gamepadType);
    prevButtons[index] = pressed;
  });

  // ==============================
  // Sticks
  // ==============================
  const lsX = applyDeadzone(gp.axes[0], deadzone) + drift;
  const lsY = applyDeadzone(gp.axes[1], deadzone) + drift;
  drawStick(leftStickCtx, lsX, lsY);

  const rsX = applyDeadzone(gp.axes[2], deadzone) + drift;
  const rsY = applyDeadzone(gp.axes[3], deadzone) + drift;
  drawStick(rightStickCtx, rsX, rsY);

  // ==============================
  // D-Pad
  // ==============================
  drawDpad();

  requestAnimationFrame(gamepadLoop);
}

// ==============================
// Função de manipulação dos botões
// ==============================
function handleButton(index, type) {
  // Reset visual
  Object.values(buttons).forEach(b => b.classList.remove('active'));

  // Mapear botão por tipo de controle
  switch(type) {
    case 'ps5':
      mapPS5Buttons(index); break;
    case 'xbox':
      mapXboxButtons(index); break;
    case 'switch':
      mapSwitchButtons(index); break;
    default:
      mapGenericButtons(index); break;
  }
}

// ==============================
// Mapas de botões
// ==============================
function mapPS5Buttons(i) {
  switch(i) {
    case 0: buttons.cross.classList.add('active'); break;
    case 1: buttons.circle.classList.add('active'); break;
    case 2: buttons.square.classList.add('active'); break;
    case 3: buttons.triangle.classList.add('active'); break;
    case 4: buttons.l1.classList.add('active'); break;
    case 5: buttons.r1.classList.add('active'); break;
    case 6: buttons.l2.classList.add('active'); break;
    case 7: buttons.r2.classList.add('active'); break;
    case 8: buttons.share.classList.add('active'); break;
    case 9: buttons.options.classList.add('active'); break;
    case 10: buttons.touch.classList.add('active'); break;
    case 11: buttons.ps.classList.add('active'); break;
    case 12: /* D-Pad Up */ break;
    case 13: /* D-Pad Down */ break;
    case 14: /* D-Pad Left */ break;
    case 15: /* D-Pad Right */ break;
  }
}

function mapXboxButtons(i) {
  switch(i) {
    case 0: buttons.cross.classList.add('active'); break; // A
    case 1: buttons.circle.classList.add('active'); break; // B
    case 2: buttons.square.classList.add('active'); break; // X
    case 3: buttons.triangle.classList.add('active'); break; // Y
    case 4: buttons.l1.classList.add('active'); break;
    case 5: buttons.r1.classList.add('active'); break;
    case 6: buttons.l2.classList.add('active'); break;
    case 7: buttons.r2.classList.add('active'); break;
    case 8: buttons.share.classList.add('active'); break; // View
    case 9: buttons.options.classList.add('active'); break; // Menu
    case 10: buttons.ps.classList.add('active'); break; // Xbox
    case 11: buttons.touch.classList.add('active'); break; // Capture
    case 12: /* D-Pad Up */ break;
    case 13: /* D-Pad Down */ break;
    case 14: /* D-Pad Left */ break;
    case 15: /* D-Pad Right */ break;
  }
}

function mapSwitchButtons(i) {
  switch(i) {
    case 0: buttons.cross.classList.add('active'); break; // B
    case 1: buttons.circle.classList.add('active'); break; // A
    case 2: buttons.square.classList.add('active'); break; // Y
    case 3: buttons.triangle.classList.add('active'); break; // X
    case 4: buttons.l1.classList.add('active'); break;
    case 5: buttons.r1.classList.add('active'); break;
    case 6: buttons.l2.classList.add('active'); break;
    case 7: buttons.r2.classList.add('active'); break;
    case 8: buttons.share.classList.add('active'); break; // Capture
    case 9: buttons.options.classList.add('active'); break; // Plus
    case 10: buttons.ps.classList.add('active'); break; // Home
    case 11: buttons.touch.classList.add('active'); break; // Touch?
    case 12: /* D-Pad Up */ break;
    case 13: /* D-Pad Down */ break;
    case 14: /* D-Pad Left */ break;
    case 15: /* D-Pad Right */ break;
  }
}

function mapGenericButtons(i) {
  if (i < Object.keys(buttons).length) {
    Object.values(buttons)[i].classList.add('active');
  }
}
// ==============================
// Parte 3 – Finalização e compatibilidade
// ==============================

// Debounce simples para evitar múltiplas ativações
let debounceTimer = null;
function debounceButton(callback, delay = 50) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, delay);
}

// Reset visual de botões
function resetButtons() {
  Object.values(buttons).forEach(b => b.classList.remove('active'));
}

// ==============================
// Inicializa loop do gamepad
// ==============================
window.addEventListener('gamepadconnected', (e) => {
  console.log('Gamepad conectado:', e.gamepad.id);
  gamepadLoop();
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log('Gamepad desconectado:', e.gamepad.id);
  connectionStatus.textContent = 'Aguardando controle...';
  resetButtons();
});

// Compatibilidade total Edge/Chrome
if (!('getGamepads' in navigator)) {
  alert('Seu navegador não suporta Gamepad API!');
} else {
  // Inicia o loop caso já haja gamepad conectado
  if (navigator.getGamepads()[0]) gamepadLoop();
}

// ==============================
// D-Pad individual
// ==============================
function handleDpad(buttonsState) {
  // Up
  if (buttonsState[12]) buttons['dpad-up'].classList.add('active');
  else buttons['dpad-up'].classList.remove('active');
  // Down
  if (buttonsState[13]) buttons['dpad-down'].classList.add('active');
  else buttons['dpad-down'].classList.remove('active');
  // Left
  if (buttonsState[14]) buttons['dpad-left'].classList.add('active');
  else buttons['dpad-left'].classList.remove('active');
  // Right
  if (buttonsState[15]) buttons['dpad-right'].classList.add('active');
  else buttons['dpad-right'].classList.remove('active');
}

// ==============================
// Atualização final dos botões e sticks
// ==============================
function updateGamepad() {
  const gp = navigator.getGamepads()[0];
  if (!gp) return;

  handleDpad(gp.buttons);

  // Atualiza sticks
  drawStick(leftStickCtx, applyDeadzone(gp.axes[0], deadzone) + drift, applyDeadzone(gp.axes[1], deadzone) + drift);
  drawStick(rightStickCtx, applyDeadzone(gp.axes[2], deadzone) + drift, applyDeadzone(gp.axes[3], deadzone) + drift);

  requestAnimationFrame(updateGamepad);
}

// Inicializa loop contínuo
requestAnimationFrame(updateGamepad);
