// script.js

const gpInfo = document.getElementById('gp-info');
const gpNone = document.getElementById('gp-none');
const controlsSection = document.getElementById('controls');
const gpNameSpan = document.getElementById('gp-name');
const buttonsGrid = document.getElementById('buttons-grid');
const stickLeftCanvas = document.getElementById('stick-left');
const stickRightCanvas = document.getElementById('stick-right');
const lsxSpan = document.getElementById('lsx');
const lsySpan = document.getElementById('lsy');
const rsxSpan = document.getElementById('rsx');
const rsySpan = document.getElementById('rsy');
const ltSpan = document.getElementById('lt');
const rtSpan = document.getElementById('rt');
const rumbleBtn = document.getElementById('rumbleBtn');
const batteryDiv = document.createElement('div');
batteryDiv.classList.add('battery');
controlsSection.appendChild(batteryDiv);

const deadLs = document.getElementById('dead-ls');
const deadRs = document.getElementById('dead-rs');
const deadLsVal = document.getElementById('dead-ls-val');
const deadRsVal = document.getElementById('dead-rs-val');
const curveInput = document.getElementById('curve');
const curveVal = document.getElementById('curve-val');
const antidzInput = document.getElementById('antidz');
const antidzVal = document.getElementById('antidz-val');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const saveLocalBtn = document.getElementById('saveLocal');
const importFileInput = document.getElementById('importFile');
const profileNameInput = document.getElementById('profile-name');

let gamepad = null;
let buttonsMap = [];
let sticksMap = { left: {x:0,y:0}, right: {x:0,y:0} };
let batteryLevel = null;

// Mapeamento de botões para PS5 e Xbox
const BUTTONS = {
  PS5: ['Cross','Circle','Square','Triangle','L1','R1','L2','R2','Share','Options','L3','R3','PS','Touchpad','Up','Down','Left','Right'],
  XBOX: ['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS','Xbox','Up','Down','Left','Right'],
  GENERIC: ['B1','B2','B3','B4','LB','RB','LT','RT','Back','Start','LS','RS','PS','Up','Down','Left','Right']
};

// Desenha o stick
function drawStick(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 60, 0, Math.PI*2);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width/2 + x*60, canvas.height/2 + y*60, 15, 0, Math.PI*2);
  ctx.fillStyle = '#00ff88';
  ctx.fill();
}

function updateBattery() {
  if(gamepad && gamepad.battery !== undefined){
    batteryLevel = Math.round(gamepad.battery*100);
    batteryDiv.textContent = `Bateria: ${batteryLevel}%`;
  } else {
    batteryDiv.textContent = '';
  }
}

function updateGamepad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  if(!gps) return;
  gamepad = gps[0];
  if(!gamepad) return;

  gpNone.style.display = 'none';
  controlsSection.classList.remove('hidden');
  gpNameSpan.textContent = gamepad.id;
  gpInfo.innerHTML = 'Status: <strong>Conectado</strong>';

  // Atualiza sticks (inverte eixo Y)
  sticksMap.left.x = gamepad.axes[0].toFixed(3);
  sticksMap.left.y = (-gamepad.axes[1]).toFixed(3);
  sticksMap.right.x = gamepad.axes[2].toFixed(3);
  sticksMap.right.y = (-gamepad.axes[3]).toFixed(3);

  lsxSpan.textContent = sticksMap.left.x;
  lsySpan.textContent = sticksMap.left.y;
  rsxSpan.textContent = sticksMap.right.x;
  rsySpan.textContent = sticksMap.right.y;

  drawStick(stickLeftCanvas, sticksMap.left.x, sticksMap.left.y);
  drawStick(stickRightCanvas, sticksMap.right.x, sticksMap.right.y);

  // Atualiza triggers
  ltSpan.textContent = gamepad.buttons[6]?.value.toFixed(2) || '0.00';
  rtSpan.textContent = gamepad.buttons[7]?.value.toFixed(2) || '0.00';

  // Atualiza botões
  buttonsMap.forEach((btn,index)=>{
    const active = gamepad.buttons[index]?.pressed;
    btn.classList.toggle('active', active);
  });

  updateBattery();
  requestAnimationFrame(updateGamepad);
}

// Cria botões
function createButtons() {
  buttonsGrid.innerHTML = '';
  let map = BUTTONS.PS5.includes(gamepad?.id) ? BUTTONS.PS5 : (BUTTONS.XBOX.includes(gamepad?.id) ? BUTTONS.XBOX : BUTTONS.GENERIC);
  buttonsMap = map.map(name=>{
    const div = document.createElement('div');
    div.textContent = name;
    buttonsGrid.appendChild(div);
    return div;
  });
}

window.addEventListener('gamepadconnected', e=>{
  createButtons();
  updateGamepad();
});

// Rumble teste
rumbleBtn.addEventListener('click', ()=>{
  if(gamepad && gamepad.vibrationActuator){
    gamepad.vibrationActuator.playEffect('dual-rumble',{
      startDelay: 0,
      duration: 500,
      weakMagnitude: 1.0,
      strongMagnitude: 1.0
    });
  } else alert('Vibração não suportada nesse controle');
});

// Deadzone/Curve/Antidez eventos
deadLs.addEventListener('input',()=>{ deadLsVal.textContent = deadLs.value; });
deadRs.addEventListener('input',()=>{ deadRsVal.textContent = deadRs.value; });
curveInput.addEventListener('input',()=>{ curveVal.textContent = curveInput.value; });
antidzInput.addEventListener('input',()=>{ antidzVal.textContent = antidzInput.value; });

// Export/Import/Salvar
exportBtn.addEventListener('click', ()=>{
  const profile = {
    name: profileNameInput.value || 'Profile',
    deadLs: deadLs.value,
    deadRs: deadRs.value,
    curve: curveInput.value,
    antidz: antidzInput.value
  };
  const blob = new Blob([JSON.stringify(profile, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${profile.name}.json`;
  a.click();
});

importBtn.addEventListener('click',()=>importFileInput.click());
importFileInput.addEventListener('change',e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = evt=>{
    const data = JSON.parse(evt.target.result);
    deadLs.value = data.deadLs || 0.08;
    deadRs.value = data.deadRs || 0.08;
    curveInput.value = data.curve || 1;
    antidzInput.value = data.antidz || 0;
    deadLsVal.textContent = deadLs.value;
    deadRsVal.textContent = deadRs.value;
    curveVal.textContent = curveInput.value;
    antidzVal.textContent = antidz.value;
  };
  reader.readAsText(file);
});

saveLocalBtn.addEventListener('click',()=>{
  const profile = {
    name: profileNameInput.value || 'Profile',
    deadLs: deadLs.value,
    deadRs: deadRs.value,
    curve: curveInput.value,
    antidz: antidzInput.value
  };
  localStorage.setItem('gamepadProfile', JSON.stringify(profile));
  alert('Perfil salvo localmente!');
});

// Carrega perfil local se existir
window.addEventListener('load',()=>{
  const local = localStorage.getItem('gamepadProfile');
  if(local){
    const data = JSON.parse(local);
    deadLs.value = data.deadLs;
    deadRs.value = data.deadRs;
    curveInput.value = data.curve;
    antidzInput.value = data.antidz;
    profileNameInput.value = data.name;
    deadLsVal.textContent = deadLs.value;
    deadRsVal.textContent = deadRs.value;
    curveVal.textContent = curveInput.value;
    antidzVal.textContent = antidz.value;
  }
});
