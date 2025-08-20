// script.js — versão robusta (loop permanente + mapeamento dinâmico)

let gamepad = null;
let deadzone = 0.05;
let drift = 0;

const connectionStatus = document.getElementById("connection-status");
const batteryLevel = document.getElementById("battery-level");
const buttonsGrid = document.getElementById("buttons-grid");
const sticksCanvas = document.getElementById("sticks-canvas");
const ctx = sticksCanvas.getContext("2d");

const deadEl = document.getElementById("deadzone");
const driftEl = document.getElementById("drift");

// —— Heurística simples de perfis por ID do controle
function detectProfile(id = "") {
  const s = id.toLowerCase();
  if (s.includes("xbox")) return "xbox";
  if (s.includes("wireless controller") || s.includes("dualshock") || s.includes("dualsense") || s.includes("sony")) return "ps";
  if (s.includes("switch") || s.includes("nintendo")) return "switch";
  return "generic";
}

// Rótulos por perfil (ordem aproximada do padrão standard mapping)
const LABELS = {
  ps:    ["✕","○","□","△","L1","R1","L2","R2","Share","Options","L3","R3","D-Up","D-Down","D-Left","D-Right","PS","Touch"],
  xbox:  ["A","B","X","Y","LB","RB","LT","RT","View","Menu","LS","RS","D-Up","D-Down","D-Left","D-Right","Xbox"],
  switch:["B","A","Y","X","L","R","ZL","ZR","-","+", "LS","RS","D-Up","D-Down","D-Left","D-Right","Home","Capture"],
  generic: Array.from({length:24}, (_,i)=>`Btn ${i}`)
};

// Garante que a grade tenha exatamente N elementos
function buildButtonsGrid(profile, count) {
  buttonsGrid.innerHTML = "";
  const labels = LABELS[profile] || LABELS.generic;
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.textContent = labels[i] ?? `Btn ${i}`;
    buttonsGrid.appendChild(div);
  }
}

// Aplica deadzone + drift
function applyAdjust(v) {
  const d = Math.abs(v) < deadzone ? 0 : v;
  return d + drift;
}

// Desenha os dois sticks no mesmo canvas
function drawSticks(gp) {
  const w = sticksCanvas.width, h = sticksCanvas.height;
  const cxL = w * 0.33, cy = h * 0.5;
  const cxR = w * 0.67;
  const radius = Math.min(w, h) * 0.28;
  const knob = 10;
  ctx.clearRect(0,0,w,h);

  // Base (círculos)
  ctx.strokeStyle = "#5af2f2";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cxL, cy, radius, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cxR, cy, radius, 0, Math.PI*2); ctx.stroke();

  // Eixos
  let lx = applyAdjust(gp.axes[0] || 0);
  let ly = applyAdjust(gp.axes[1] || 0);
  let rx = applyAdjust(gp.axes[2] || 0);
  let ry = applyAdjust(gp.axes[3] || 0);

  // Corrigir Y (cima = valor negativo; queremos “ir para cima” no canvas)
  const pxL = cxL + lx * radius;
  const pyL = cy + (-ly) * radius;
  const pxR = cxR + rx * radius;
  const pyR = cy + (-ry) * radius;

  ctx.fillStyle = "#3ae03a";
  ctx.beginPath(); ctx.arc(pxL, pyL, knob, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(pxR, pyR, knob, 0, Math.PI*2); ctx.fill();
}

// Loop permanente — nunca para; só atualiza se houver controle
function tick() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const any = pads && Array.from(pads).find(Boolean);

  if (!any) {
    gamepad = null;
    connectionStatus.textContent = "Aguardando controle...";
    // não limpa a grid nem o canvas pra não “piscar” quando desconecta reconectando
  } else {
    // Se mudou de índice/objeto, reconfigura
    if (!gamepad || (any.index !== gamepad.index)) {
      gamepad = any;
      connectionStatus.textContent = "Conectado";
      const profile = detectProfile(gamepad.id);
      buildButtonsGrid(profile, gamepad.buttons.length);
    } else {
      // Atualiza referência viva (Chrome atualiza o objeto)
      gamepad = pads[gamepad.index];
    }

    // Atualiza botões ativos
    if (gamepad && gamepad.buttons) {
      for (let i = 0; i < gamepad.buttons.length; i++) {
        const btn = gamepad.buttons[i];
        const cell = buttonsGrid.children[i];
        if (cell) cell.classList.toggle("active", !!btn?.pressed);
      }
    }

    // Atualiza sticks
    if (gamepad && gamepad.axes && gamepad.axes.length >= 4) {
      drawSticks(gamepad);
    }

    // Bateria (pouquíssimos expõem algo utilizável na Gamepad API)
    try {
      // alguns navegadores expõem algo como gamepad.battery, outros nada
      if (gamepad && gamepad.battery && typeof gamepad.battery.level === "number") {
        batteryLevel.textContent = `${Math.round(gamepad.battery.level * 100)}%`;
      } else {
        batteryLevel.textContent = "—";
      }
    } catch {
      batteryLevel.textContent = "—";
    }
  }

  requestAnimationFrame(tick);
}

// Eventos (apenas informativos; o loop é quem faz o trabalho)
window.addEventListener("gamepadconnected", (e) => {
  connectionStatus.textContent = "Conectado";
});
window.addEventListener("gamepaddisconnected", (e) => {
  connectionStatus.textContent = "Aguardando controle...";
});

// Controles de UI
deadEl.addEventListener("input", (e)=> deadzone = parseFloat(e.target.value));
driftEl.addEventListener("input", (e)=> drift = parseFloat(e.target.value));

// Perfis (salvar/importar/exportar)
document.getElementById("save-profile").addEventListener("click", () => {
  const profile = { deadzone, drift };
  localStorage.setItem("controllerProfile", JSON.stringify(profile));
  alert("Perfil salvo!");
});
document.getElementById("load-profile").addEventListener("click", () => {
  const fileEl = document.getElementById("file-input");
  fileEl.value = "";
  fileEl.click();
});
document.getElementById("file-input").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const profile = JSON.parse(reader.result);
      if (typeof profile.deadzone === "number") {
        deadzone = profile.deadzone;
        deadEl.value = String(deadzone);
      }
      if (typeof profile.drift === "number") {
        drift = profile.drift;
        driftEl.value = String(drift);
      }
      alert("Perfil importado!");
    } catch {
      alert("Arquivo inválido.");
    }
  };
  reader.readAsText(file);
});
document.getElementById("export-profile").addEventListener("click", () => {
  const profile = { deadzone, drift };
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "profile.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Kickstart do loop (sempre rodando)
requestAnimationFrame(tick);

// Alguns navegadores só começam a entregar dados após uma interação
["click","keydown","touchstart"].forEach(evt => {
  window.addEventListener(evt, ()=> requestAnimationFrame(tick), { once:true });
});
