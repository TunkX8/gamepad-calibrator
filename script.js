const statusEl = document.getElementById("status");
const nameEl = document.getElementById("gp-name");
const batteryEl = document.getElementById("gp-battery");
const buttonsDiv = document.getElementById("buttons");

const dpadUp = document.getElementById("dpad-up");
const dpadDown = document.getElementById("dpad-down");
const dpadLeft = document.getElementById("dpad-left");
const dpadRight = document.getElementById("dpad-right");

const deadzoneInput = document.getElementById("deadzone");
const driftInput = document.getElementById("drift");

let gp = null;
let raf = null;

// ==== Loop principal ====
function loop(){
  const pads = navigator.getGamepads?.() || [];
  gp = pads.find(Boolean);
  if(!gp){ cancelAnimationFrame(raf); return; }

  // Atualiza botões
  buttonsDiv.innerHTML = "";
  gp.buttons.forEach((btn, i)=>{
    const el = document.createElement("div");
    el.textContent = `Botão ${i} ${btn.pressed ? "✅" : ""}`;
    buttonsDiv.appendChild(el);
  });

  // Atualiza D-Pad (mapeamento standard)
  dpadUp.classList.toggle("active", gp.buttons[12]?.pressed);
  dpadDown.classList.toggle("active", gp.buttons[13]?.pressed);
  dpadLeft.classList.toggle("active", gp.buttons[14]?.pressed);
  dpadRight.classList.toggle("active", gp.buttons[15]?.pressed);

  // Atualiza sticks
  drawStick("stick-left", gp.axes[0], gp.axes[1]);
  drawStick("stick-right", gp.axes[2], gp.axes[3]);

  raf = requestAnimationFrame(loop);
}

// ==== Função para desenhar stick ====
function drawStick(canvasId, x, y){
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const r = canvas.width/2;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.beginPath();
  ctx.arc(r, r, r-5, 0, Math.PI*2);
  ctx.strokeStyle="#555";
  ctx.lineWidth=2;
  ctx.stroke();

  // aplicar deadzone e drift
  const dead = parseFloat(deadzoneInput.value);
  const drift = parseFloat(driftInput.value);
  x = Math.abs(x)<dead ? 0 : x+drift;
  y = Math.abs(y)<dead ? 0 : y+drift;

  const px = r + x * (r-10);
  const py = r + y * (r-10);

  ctx.beginPath();
  ctx.arc(px, py, 8, 0, Math.PI*2);
  ctx.fillStyle="#00ff88";
  ctx.fill();
}

// ==== Eventos de conexão ====
window.addEventListener("gamepadconnected", (e)=>{
  gp = e.gamepad;
  statusEl.innerHTML = "Status: <span class='ok'>Conectado</span>";
  nameEl.textContent = gp.id;

  // Se suportar bateria
  if(gp.batteryLevel !== undefined){
    batteryEl.textContent = Math.round(gp.batteryLevel*100)+"%";
  } else {
    batteryEl.textContent = "Não disponível";
  }

  loop();
});

window.addEventListener("gamepaddisconnected", ()=>{
  statusEl.innerHTML = "Status: <span class='err'>Desconectado</span>";
  nameEl.textContent = "-";
  batteryEl.textContent = "-";
  cancelAnimationFrame(raf);
});

// ==== Perfis ====
document.getElementById("save").addEventListener("click", ()=>{
  const profile = {
    deadzone: deadzoneInput.value,
    drift: driftInput.value
  };
  localStorage.setItem("profile", JSON.stringify(profile));
  alert("Perfil salvo!");
});

document.getElementById("load").addEventListener("click", ()=>{
  const input = document.createElement("input");
  input.type="file";
  input.accept=".json";
  input.onchange = e=>{
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ()=>{
      const profile = JSON.parse(reader.result);
      deadzoneInput.value = profile.deadzone;
      driftInput.value = profile.drift;
    };
    reader.readAsText(file);
  };
  input.click();
});

document.getElementById("export").addEventListener("click", ()=>{
  const profile = {
    deadzone: deadzoneInput.value,
    drift: driftInput.value
  };
  const blob = new Blob([JSON.stringify(profile,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download="perfil.json";
  a.click();
  URL.revokeObjectURL(url);
});
