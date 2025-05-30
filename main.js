
const input = document.getElementById("input-word");
const wordPanel = document.getElementById("word-panel");

let wordList = [];
let currentIndex = 0;
let startTime = null;
let correctCount = 0;
let errorCount = 0;
let interval = null;
// Player stats
let nivel = 1;
let experiencia = 0;
let rangoData = [];

const experiencePerLetter = 10; // Puedes subir este valor
const xpBar = document.getElementById("xp-bar");
const nivelText = document.getElementById("player-level");
const tituloText = document.getElementById("player-title");
const avatarImg = document.getElementById("avatar-img");

// Cargar progreso guardado
function cargarProgreso() {
  const niv = parseInt(localStorage.getItem("nivel"));
  const xp = parseInt(localStorage.getItem("experiencia"));
  if (!isNaN(niv)) nivel = niv;
  if (!isNaN(xp)) experiencia = xp;
}

// Guardar progreso
function guardarProgreso() {
  localStorage.setItem("nivel", nivel);
  localStorage.setItem("experiencia", experiencia);
}

// Calcular XP requerida
function getXPRequerida(n) {
  const tabla = {
    1: 0,
    2: 100,
    3: 200,
    4: 400,
    5: 800,
    6: 1500,
    7: 2600,
    8: 4200,
    9: 6400,
    10: 9300
  };
  if (n <= 10) return tabla[n] ?? 0;
  return Math.floor(9300 * Math.pow(1.15, n - 10));
}

function chequearNivel() {
  while (experiencia >= getXPRequerida(nivel + 1) && nivel < 200) {
    nivel++;
  }
}

// Actualizar barra y título
function actualizarRango() {
  const rango = rangoData.find(r => nivel >= r.minNivel && nivel <= r.maxNivel);
  if (rango) {
    tituloText.textContent = rango.titulo;
    avatarImg.src = rango.imagen;
  }
  nivelText.textContent = `Nivel ${nivel}`;
  actualizarBarraXP();
}

function actualizarBarraXP() {
  const xpActual = experiencia;
  const xpMax = getXPRequerida(nivel + 1);
  const xpMin = getXPRequerida(nivel);
  const porcentaje = ((xpActual - xpMin) / (xpMax - xpMin)) * 100;
  xpBar.style.width = `${Math.min(porcentaje, 100)}%`;
}

// Cargar palabras desde JSON externo
async function loadWordsFromJSON() {
  try {
    const response = await fetch('words.json');
    if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
    const allWords = await response.json();
    wordList = [];
    for (let i = 0; i < 20; i++) {
      const randIndex = Math.floor(Math.random() * allWords.length);
      wordList.push(allWords[randIndex]);
    }
    loadWords();
    initGame();
  } catch (error) {
    console.error("Error cargando palabras:", error);
    wordPanel.textContent = "Error cargando palabras.";
  }
}

async function loadRangos() {
  try {
    const res = await fetch("rangos.json");
    if (!res.ok) throw new Error("No se pudo cargar rangos.json");
    rangoData = await res.json();
    actualizarRango();
  } catch (err) {
    console.error("Error al cargar rangos:", err);
  }
}

function initGame() {
  currentIndex = 0;
  startTime = null;
  correctCount = 0;
  errorCount = 0;

  updateMetrics();
  input.disabled = false;
  input.value = "";
  input.focus();
  if (interval) clearInterval(interval);
}

function loadWords() {
  wordPanel.innerHTML = "";
  wordList.forEach((word, i) => {
    const span = document.createElement("span");
    span.classList.add("word");
    if (i === 0) span.classList.add("active");
    span.textContent = word;
    wordPanel.appendChild(span);
  });
}

function startTimer() {
  if (startTime) return;
  startTime = new Date();
  interval = setInterval(updateMetrics, 1000);
}

input.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (currentIndex >= wordList.length) return;

    const typedWord = input.value.trim();
    const currentWord = wordList[currentIndex];
    const words = document.querySelectorAll(".word");

    if (!startTime) startTimer();

    if (typedWord === currentWord) {
      words[currentIndex].classList.add("correct");
      correctCount++;
      experiencia += currentWord.length * experiencePerLetter * nivel; // XP por letra 
      guardarProgreso();
      chequearNivel();
      actualizarRango();
    } else {
      words[currentIndex].classList.add("incorrect");
      errorCount += calculateErrors(currentWord, typedWord);
    }

    words[currentIndex].classList.remove("active");
    currentIndex++;
    if (currentIndex < wordList.length) {
      words[currentIndex].classList.add("active");
    } else {
      input.disabled = true;
      clearInterval(interval);
      setTimeout(loadWordsFromJSON, 1000);
    }

    input.value = "";
    updateMetrics();
  }
});

function updateMetrics() {
  const now = new Date();
  const elapsedSeconds = startTime ? (now - startTime) / 1000 : 0;
  const wpm = elapsedSeconds > 0 ? Math.round((correctCount / elapsedSeconds) * 60) : 0;

  document.getElementById("hud-time").textContent = formatTime(elapsedSeconds);
  document.getElementById("hud-words").textContent = correctCount;
  document.getElementById("hud-wpm").textContent = wpm;
  document.getElementById("hud-errors").textContent = errorCount;
}

function calculateErrors(target, input) {
  const maxLen = Math.max(target.length, input.length);
  let errors = 0;
  for (let i = 0; i < maxLen; i++) {
    if (target[i] !== input[i]) errors++;
  }
  return errors;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function restartGame() {
  currentIndex = 0;
  correctCount = 0;
  errorCount = 0;
  startTime = null;
  clearInterval(interval);
  localStorage.removeItem("nivel");
  localStorage.removeItem("experiencia");
  nivel = 1;
  experiencia = 0;
  actualizarRango();
  loadWordsFromJSON();
}

document.getElementById("reset-btn").addEventListener("click", restartGame);

// Deshabilitar ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
  }
});

// Botón música
const music = new Audio("audio/music.mp3");
music.volume = 0.5;
music.loop = true;
let isPlaying = false;

document.getElementById("music-btn").addEventListener("click", () => {
  if (isPlaying) {
    music.pause();
  } else {
    music.play();
  }
  isPlaying = !isPlaying;
});

// Inicializar todo
cargarProgreso();
loadRangos();
loadWordsFromJSON();
