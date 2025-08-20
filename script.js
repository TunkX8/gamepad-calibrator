// ====== SELEÇÃO DE ELEMENTOS ======
const leftStickCanvas = document.getElementById("left-stick");
const rightStickCanvas = document.getElementById("right-stick");
const dpadCanvas = document.getElementById("dpad");

const leftCtx = leftStickCanvas.getContext("2d");
const rightCtx = rightStickCanvas.getContext("2d");
const dpadCtx = dpadCanvas.getContext("2d");

// Botões de ação
const buttons = {
  triangle: document.getElementById("btn-triangle"),
  circle: document.getElementById("btn-circle"),
  cross: document.getElementById("btn-cross"),
  square: document.getElementById("btn-square")
};

// Inputs de calibração
const deadzoneInput = document.getElementById("deadzone");
const driftInput = document.getElementById("drift");

// ====== CONFIGURAÇÕES ======
const stickRadius = 40;
const stickCenter = { x: leftStickCanvas.width/2, y: leftStickCanvas.height/2 };
const dpadSize = 20;

// Valores iniciais dos sticks
let leftStick = { x: 0, y: 0 };
let rightStick = { x: 0, y: 0 };

// D-Pad
let dpadState = { up:false, down:false, left:false, right:false };

// Gamepad
let gamepadIndex = null;

// ====== FUNÇÃO PARA DESENHAR ANALÓGICO ======
function drawStick(ctx, stick) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Base do stick
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(stickCenter.x, stickCenter.y, stickRadius+10, 0, Math.PI*2);
  ctx.fill();

  // Stick móvel
  ctx.fillStyle = "#00ffe7";
  ctx.beginPath();
  ctx.arc(stickCenter.x + stick.x*stickRadius, stickCenter.y + stick.y*stickRadius, stickRadius, 0, Math.PI*2);
  ctx.fill();

  // Contorno neon
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ====== FUNÇÃO PARA DESENHAR D-PAD ======
function drawDPad(ctx, state) {
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const activeColor = "#3ae03a";
  const baseColor = "#5af2f2";

  // Vertical
  ctx.fillStyle = state.up || state.down ? activeColor : baseColor;
  ctx.fillRect(w/2 - dpadSize/2, h/2 - dpadSize*1.5, dpadSize, dpadSize*3);

  // Horizontal
  ctx.fillStyle = state.left || state.right ? activeColor : baseColor;
  ctx.fillRect(w/2 - dpadSize*1.5, h/2 - dpadSize/2, dpadSize*3, dpadSize);
}

// ====== FUNÇÃO PARA ATUALIZAR BOTÕES ======
function updateButtons(buttonStates) {
  buttons.triangle.style.backgroundColor = buttonStates[3].pressed ? "#3ae03a" : "#222";
  buttons.circle.style.backgroundColor = buttonStates[1].pressed ? "#3ae03a" : "#222";
  buttons.cross.style.backgroundColor = buttonStates[0].pressed ? "#3ae03a" : "#222";
  buttons.square.style.backgroundColor = buttonStates[2].pressed ? "#3ae03a" : "#222";
}

// ====== GAMEPAD API ======
window.addEventListener("gamepadconnected", (e) => {
  gamepadIndex = e.gamepad.index;
  console.log("Controle conectado:", e.gamepad.id);
  document.getElementById("connection-status").textContent = "Conectado!";
});

window.addEventListener("gamepaddisconnected", (e) => {
  gamepadIndex = null;
  console.log("Controle desconectado");
  document.getElementById("connection-status").textContent = "Aguardando controle...";
});

// ====== LOOP PRINCIPAL ======
function update() {
  if(gamepadIndex !== null){
    const gp = navigator.getGamepads()[gamepadIndex];

    // Atualiza sticks
    leftStick.x = gp.axes[0];
    leftStick.y = gp.axes[1];
    rightStick.x = gp.axes[2];
    rightStick.y = gp.axes[3];

    drawStick(leftCtx, leftStick);
    drawStick(rightCtx, rightStick);

    // Atualiza D-Pad
    dpadState.up = gp.buttons[12].pressed;
    dpadState.down = gp.buttons[13].pressed;
    dpadState.left = gp.buttons[14].pressed;
    dpadState.right = gp.buttons[15].pressed;
    drawDPad(dpadCtx, dpadState);

    // Atualiza botões
    updateButtons(gp.buttons);

    // Atualiza bateria se disponível
    if(gp.vibrationActuator){
      // Pode usar para feedback futuramente
    }
  }
  requestAnimationFrame(update);
}

// Inicia loop
update();
// ====== CONFIGURAÇÕES AVANÇADAS ======
let deadzone = parseFloat(deadzoneInput.value);
let drift = parseFloat(driftInput.value);

// Atualiza deadzone e drift dinamicamente
deadzoneInput.addEventListener("input", e => deadzone = parseFloat(e.target.value));
driftInput.addEventListener("input", e => drift = parseFloat(e.target.value));

// Função para aplicar deadzone
function applyDeadzone(value) {
  if(Math.abs(value) < deadzone) return 0;
  return value;
}

// Interpolação suave dos sticks
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Valores animados dos sticks
let animLeft = { x:0, y:0 };
let animRight = { x:0, y:0 };

// Atualiza sticks com deadzone e interpolação
function updateSticksSmooth() {
  animLeft.x = lerp(animLeft.x, applyDeadzone(leftStick.x + drift), 0.2);
  animLeft.y = lerp(animLeft.y, applyDeadzone(leftStick.y + drift), 0.2);
  animRight.x = lerp(animRight.x, applyDeadzone(rightStick.x + drift), 0.2);
  animRight.y = lerp(animRight.y, applyDeadzone(rightStick.y + drift), 0.2);

  drawStick(leftCtx, animLeft);
  drawStick(rightCtx, animRight);
}

// Atualiza D-Pad e botões já com visual avançado
function updateControlsVisual() {
  drawDPad(dpadCtx, dpadState);
  updateButtons(Object.values(buttons).map(b => ({ pressed: b.classList.contains("active") })));
}

// Loop principal Pro-Level
function updateProLevel() {
  if(gamepadIndex !== null){
    const gp = navigator.getGamepads()[gamepadIndex];

    // Atualiza sticks brutos
    leftStick.x = gp.axes[0];
    leftStick.y = gp.axes[1];
    rightStick.x = gp.axes[2];
    rightStick.y = gp.axes[3];

    // D-Pad
    dpadState.up = gp.buttons[12].pressed;
    dpadState.down = gp.buttons[13].pressed;
    dpadState.left = gp.buttons[14].pressed;
    dpadState.right = gp.buttons[15].pressed;

    // Botões
    buttons.triangle.classList.toggle("active", gp.buttons[3].pressed);
    buttons.circle.classList.toggle("active", gp.buttons[1].pressed);
    buttons.cross.classList.toggle("active", gp.buttons[0].pressed);
    buttons.square.classList.toggle("active", gp.buttons[2].pressed);
  }

  updateSticksSmooth();
  updateControlsVisual();
  requestAnimationFrame(updateProLevel);
}

// Inicia loop Pro-Level
updateProLevel();
