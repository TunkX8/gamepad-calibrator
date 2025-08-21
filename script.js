// ===== VARIÁVEIS =====
let gamepadIndex = null;

// STICKS
let leftStick = {x:0, y:0};
let rightStick = {x:0, y:0};
let animLeft = {x:0, y:0};
let animRight = {x:0, y:0};

// DPAD
let dpadState = {up:false, down:false, left:false, right:false};

// DEADZONE / DRIFT
const deadzoneInput = document.getElementById("deadzone");
const driftInput = document.getElementById("drift");
let deadzone = parseFloat(deadzoneInput.value);
let drift = parseFloat(driftInput.value);
deadzoneInput.addEventListener("input", e=>deadzone=parseFloat(e.target.value));
driftInput.addEventListener("input", e=>drift=parseFloat(e.target.value));

// CANVAS
const leftCtx = document.getElementById("left-stick").getContext("2d");
const rightCtx = document.getElementById("right-stick").getContext("2d");
const dpadCtx = document.getElementById("dpad").getContext("2d");

// BOTÕES
const buttons = {
  triangle: document.getElementById("btn-triangle"),
  circle: document.getElementById("btn-circle"),
  cross: document.getElementById("btn-cross"),
  square: document.getElementById("btn-square"),
  l1: document.getElementById("l1"),
  l2: document.getElementById("l2"),
  r1: document.getElementById("r1"),
  r2: document.getElementById("r2"),
  share: document.getElementById("share"),
  touch: document.getElementById("touch"),
  options: document.getElementById("options"),
  ps: document.getElementById("ps")
};

// PERFIS
const saveBtn = document.getElementById("save-profile");
const loadBtn = document.getElementById("load-profile");
const exportBtn = document.getElementById("export-profile");
const fileInput = document.getElementById("file-input");

// ===== FUNÇÕES AUX =====
function applyDeadzone(value){
  return Math.abs(value)<deadzone ? 0 : value;
}
function lerp(a,b,t){ return a+(b-a)*t; }

// ===== GAMEPAD CONNECT/DISCONNECT =====
window.addEventListener("gamepadconnected", (e)=>{
  gamepadIndex = e.gamepad.index;
  document.getElementById("connection-status").textContent = "Conectado!";
});

window.addEventListener("gamepaddisconnected", (e)=>{
  gamepadIndex = null;
  document.getElementById("connection-status").textContent = "Aguardando controle...";
});

// ===== DESENHO STICKS E DPAD =====
const stickRadius = 30;
const dpadSize = 20;

function drawStick(ctx, stick){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const centerX = ctx.canvas.width/2;
  const centerY = ctx.canvas.height/2;
  ctx.beginPath();
  ctx.arc(centerX + stick.x*stickRadius*2, centerY + stick.y*stickRadius*2, stickRadius, 0, Math.PI*2);
  ctx.fillStyle = "#3ae03a";
  ctx.fill();
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawDPad(ctx, state){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const w=ctx.canvas.width, h=ctx.canvas.height;
  const active="#3ae03a", base="#5af2f2";
  
  if(state.up) ctx.fillStyle=active; else ctx.fillStyle=base;
  ctx.fillRect(w/2-dpadSize/2, h/2-dpadSize*1.5, dpadSize, dpadSize);
  if(state.down) ctx.fillStyle=state.down ? active : base;
  ctx.fillRect(w/2-dpadSize/2, h/2+dpadSize/2, dpadSize, dpadSize);
  if(state.left) ctx.fillStyle=state.left ? active : base;
  ctx.fillRect(w/2-dpadSize*1.5, h/2-dpadSize/2, dpadSize, dpadSize);
  if(state.right) ctx.fillStyle=state.right ? active : base;
  ctx.fillRect(w/2+dpadSize/2, h/2-dpadSize/2, dpadSize, dpadSize);
}

// ===== ATUALIZA BOTÕES =====
function updateButtons(buttonStates){
  buttons.triangle.classList.toggle("active", buttonStates[3]?.pressed);
  buttons.circle.classList.toggle("active", buttonStates[1]?.pressed);
  buttons.cross.classList.toggle("active", buttonStates[0]?.pressed);
  buttons.square.classList.toggle("active", buttonStates[2]?.pressed);

  buttons.l1.classList.toggle("active", buttonStates[4]?.pressed);
  buttons.r1.classList.toggle("active", buttonStates[5]?.pressed);
  buttons.l2.classList.toggle("active", buttonStates[6]?.pressed);
  buttons.r2.classList.toggle("active", buttonStates[7]?.pressed);
  buttons.share.classList.toggle("active", buttonStates[8]?.pressed);
  buttons.touch.classList.toggle("active", buttonStates[13]?.pressed); // Touch separado
  buttons.options.classList.toggle("active", buttonStates[9]?.pressed);
  buttons.ps.classList.toggle("active", buttonStates[16]?.pressed || buttonStates[10]?.pressed);
}

// ===== ATUALIZA GAMEPAD =====
function updateGamepad(){
  if(gamepadIndex !== null){
    const gp = navigator.getGamepads()[gamepadIndex];
    if(!gp) return;

    // STICKS
    leftStick.x = applyDeadzone(gp.axes[0]+drift);
    leftStick.y = applyDeadzone(gp.axes[1]+drift);
    rightStick.x = applyDeadzone(gp.axes[2]+drift);
    rightStick.y = applyDeadzone(gp.axes[3]+drift);

    // D-PAD
    dpadState.up = gp.buttons[12]?.pressed;
    dpadState.down = gp.buttons[13]?.pressed;
    dpadState.left = gp.buttons[14]?.pressed;
    dpadState.right = gp.buttons[15]?.pressed;

    // BOTÕES
    updateButtons(gp.buttons);
  }
}

// ===== LOOP DE ANIMAÇÃO =====
function gameLoop(){
  updateGamepad();

  animLeft.x = lerp(animLeft.x, leftStick.x, 0.2);
  animLeft.y = lerp(animLeft.y, leftStick.y, 0.2);
  animRight.x = lerp(animRight.x, rightStick.x, 0.2);
  animRight.y = lerp(animRight.y, rightStick.y, 0.2);

  drawStick(leftCtx, animLeft);
  drawStick(rightCtx, animRight);
  drawDPad(dpadCtx, dpadState);

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ===== FUNÇÕES PERFIS =====
function saveProfile(){
  const profile = {
    deadzone, drift
  };
  localStorage.setItem("controllerProfile", JSON.stringify(profile));
  alert("Perfil salvo localmente!");
}

function loadProfile(){
  const profileStr = localStorage.getItem("controllerProfile");
  if(profileStr){
    const profile = JSON.parse(profileStr);
    deadzone = profile.deadzone;
    drift = profile.drift;
    deadzoneInput.value = deadzone;
    driftInput.value = drift;
    alert("Perfil carregado!");
  } else alert("Nenhum perfil salvo encontrado!");
}

function exportProfile(){
  const profile = {
    deadzone, drift
  };
  const blob = new Blob([JSON.stringify(profile, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "perfil_controle.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importProfile(file){
  const reader = new FileReader();
  reader.onload = e=>{
    const profile = JSON.parse(e.target.result);
    deadzone = profile.deadzone;
    drift = profile.drift;
    deadzoneInput.value = deadzone;
    driftInput.value = drift;
    alert("Perfil importado!");
  };
  reader.readAsText(file);
}

// ===== EVENTOS BOTÕES PERFIS =====
saveBtn.addEventListener("click", saveProfile);
loadBtn.addEventListener("click", ()=>fileInput.click());
exportBtn.addEventListener("click", exportProfile);
fileInput.addEventListener("change", e=>importProfile(e.target.files[0]));
