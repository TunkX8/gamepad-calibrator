// ===== SELEÇÃO DE ELEMENTOS =====
const leftStickCanvas = document.getElementById("left-stick");
const rightStickCanvas = document.getElementById("right-stick");
const dpadCanvas = document.getElementById("dpad");
const leftCtx = leftStickCanvas.getContext("2d");
const rightCtx = rightStickCanvas.getContext("2d");
const dpadCtx = dpadCanvas.getContext("2d");

const buttons = {
  triangle: document.getElementById("btn-triangle"),
  circle: document.getElementById("btn-circle"),
  cross: document.getElementById("btn-cross"),
  square: document.getElementById("btn-square")
};

const deadzoneInput = document.getElementById("deadzone");
const driftInput = document.getElementById("drift");

// ===== CONFIGURAÇÕES =====
const stickRadius = 40;
const stickCenter = { x: leftStickCanvas.width/2, y: leftStickCanvas.height/2 };
const dpadSize = 20;
let leftStick = { x:0, y:0 };
let rightStick = { x:0, y:0 };
let dpadState = { up:false, down:false, left:false, right:false };
let gamepadIndex = null;

// ===== FUNÇÕES DE DESENHO =====
function drawStick(ctx, stick){
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(stickCenter.x, stickCenter.y, stickRadius+10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#00ffe7";
  ctx.beginPath();
  ctx.arc(stickCenter.x+stick.x*stickRadius, stickCenter.y+stick.y*stickRadius, stickRadius,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#5af2f2"; ctx.lineWidth=3; ctx.stroke();
}

function drawDPad(ctx,state){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const w=ctx.canvas.width; const h=ctx.canvas.height;
  const activeColor="#3ae03a"; const baseColor="#5af2f2";
  ctx.fillStyle = state.up || state.down ? activeColor : baseColor;
  ctx.fillRect(w/2-dpadSize/2, h/2-dpadSize*1.5, dpadSize, dpadSize*3);
  ctx.fillStyle = state.left || state.right ? activeColor : baseColor;
  ctx.fillRect(w/2-dpadSize*1.5,h/2-dpadSize/2,dpadSize*3,dpadSize);
}

function updateButtons(buttonStates){
  buttons.triangle.classList.toggle("active", buttonStates[3].pressed);
  buttons.circle.classList.toggle("active", buttonStates[1].pressed);
  buttons.cross.classList.toggle("active", buttonStates[0].pressed);
  buttons.square.classList.toggle("active", buttonStates[2].pressed);
}

// ===== GAMEPAD =====
window.addEventListener("gamepadconnected", (e)=>{
  gamepadIndex = e.gamepad.index;
  document.getElementById("connection-status").textContent = "Conectado!";
});
window.addEventListener("gamepaddisconnected",(e)=>{
  gamepadIndex=null;
  document.getElementById("connection-status").textContent = "Aguardando controle...";
});

// ===== DEADZONE E DRIFT =====
let deadzone = parseFloat(deadzoneInput.value);
let drift = parseFloat(driftInput.value);
deadzoneInput.addEventListener("input", e=>deadzone=parseFloat(e.target.value));
driftInput.addEventListener("input", e=>drift=parseFloat(e.target.value));

function applyDeadzone(value){ return Math.abs(value)<deadzone ? 0 : value; }
function lerp(a,b,t){ return a+(b-a)*t; }

let animLeft={x:0,y:0}, animRight={x:0,y:0};

// ===== LOOP PRO-LEVEL =====
function updateProLevel(){
  if(gamepadIndex!==null){
    const gp = navigator.getGamepads()[gamepadIndex];
    leftStick.x=gp.axes[0]; leftStick.y=gp.axes[1];
    rightStick.x=gp.axes[2]; rightStick.y=gp.axes[3];
    dpadState.up = gp.buttons[12].pressed;
    dpadState.down = gp.buttons[13].pressed;
    dpadState.left = gp.buttons[14].pressed;
    dpadState.right = gp.buttons[15].pressed;
    updateButtons(gp.buttons);
  }

  animLeft.x=lerp(animLeft.x,applyDeadzone(leftStick.x+drift),0.2);
  animLeft.y=lerp(animLeft.y,applyDeadzone(leftStick.y+drift),0.2);
  animRight.x=lerp(animRight.x,applyDeadzone(rightStick.x+drift),0.2);
  animRight.y=lerp(animRight.y,applyDeadzone(rightStick.y+drift),0.2);

  drawStick(leftCtx,animLeft);
  drawStick(rightCtx,animRight);
  drawDPad(dpadCtx,dpadState);

  requestAnimationFrame(updateProLevel);
}
updateProLevel();
