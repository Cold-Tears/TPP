const input = document.getElementById("input-word");
const wordPanel = document.getElementById("word-panel");
const resetBtn = document.getElementById("reset-btn");

let wordList = [];
let currentWords = []; // palabras activas para esta ronda
let currentIndex = 0;
let startTime = null;
let correctCount = 0;
let errorCount = 0;
let interval = null;

// --- Variables personaje
let charXP = 0;
let charLevel = 1;

// Tabla de experiencia para niveles (1-10, extiende si quieres)
const xpTable = [0, 100, 200, 400, 800, 1500, 2600, 4200, 6400, 9300];

// --- Funciones personaje

function calculateLevel(xp) {
  for (let lvl = xpTable.length; lvl > 0; lvl--) {
    if (xp >= xpTable[lvl - 1]) return lvl;
  }
  return 1;
}

function calculateXPProgress(xp, level) {
  if (level >= xpTable.length) return 100;
  const xpCurrentLevel = xpTable[level - 1];
  const xpNextLevel = xpTable[level];
  return ((xp - xpCurrentLevel) / (xpNextLevel - xpCurrentLevel)) * 100;
}

function updateCharacterHUD() {
  const levelElem = document.getElementById("char-level");
  const xpBar = document.getElementById("char-xp-bar");

  levelElem.textContent = `Nivel: ${charLevel}`;
  const progress = calculateXPProgress(charXP, charLevel);
  xpBar.style.width = `${progress}%`;
}

function saveProgress() {
  localStorage.setItem('charXP', charXP);
  localStorage.setItem('charLevel', charLevel);
}

function loadProgress() {
  const savedXP = parseInt(localStorage.getItem('charXP'));
  const savedLevel = parseInt(localStorage.getItem('charLevel'));

  if (!isNaN(savedXP) && !isNaN(savedLevel)) {
    charXP = savedXP;
    charLevel = savedLevel;
  }
}

function resetProgress() {
  charXP = 0;
  charLevel = 1;
  saveProgress();
  updateCharacterHUD();
}

// --- Funciones de juego

// Cargar archivo JSON de palabras
async function loadWordsJSON() {
  const response = await fetch("words.json");
  wordList = await response.json();
}

// Seleccionar 20 palabras al azar, sin importar si ya salieron
function pickRandomWords() {
  const wordsCopy = [...wordList];
  let chosen = [];
  for (let i = 0; i < 20 && wordsCopy.length > 0; i++) {
    // Elegimos palabra aleatoria
    const idx = Math.floor(Math.random() * wordsCopy.length);
    chosen.push(wordsCopy.splice(idx, 1)[0]);
  }
  currentWords = chosen;
}

// Cargar las palabras en pantalla
function loadWords() {
  wordPanel.innerHTML = "";
  currentWords.forEach((word, index) => {
    const span = document.createElement("span");
    span.textContent = word;
    span.classList.add("word");
    if (index === 0) {
      span.classList.add("active");
    }
    wordPanel.appendChild(span);
  });
}

// Actualizar métricas visibles (Tiempo, WPM, etc)
function updateMetrics() {
  const now = Date.now();
  const elapsed = startTime ? (now - startTime) / 1000 : 0;

  // Tiempo
  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(elapsed % 60)
    .toString()
    .padStart(2, "0");

  document.getElementById("hud-time").textContent = `${minutes}:${seconds}`;
  document.getElementById("hud-words").textContent = correctCount;
  document.getElementById("hud-errors").textContent = errorCount;

  // WPM = palabras correctas / minutos
  const wpm = elapsed > 0 ? Math.floor(correctCount / (elapsed / 60)) : 0;
  document.getElementById("hud-wpm").textContent = wpm;
}

function resetGame() {
  currentIndex = 0;
  correctCount = 0;
  errorCount = 0;
  startTime = null;
  clearInterval(interval);

  pickRandomWords();
  loadWords();
  updateMetrics();

  input.disabled = false;
  input.value = "";
  input.focus();

  resetProgress(); // Resetea nivel y experiencia
}

function init() {
  loadProgress();
  updateCharacterHUD();

  loadWordsJSON().then(() => {
    pickRandomWords();
    loadWords();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      return;
    }

    if (startTime === null) {
      startTime = Date.now();
      interval = setInterval(updateMetrics, 1000);
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();

      const typedWord = input.value.trim();
      const currentWord = currentWords[currentIndex];

      const wordsOnScreen = wordPanel.querySelectorAll(".word");
      const currentSpan = wordsOnScreen[currentIndex];

      if (typedWord.length === 0) return;

      if (typedWord === currentWord) {
        currentSpan.classList.add("correct");
        correctCount++;

        // Suma XP por letras correctas
        charXP += typedWord.length;
        charLevel = calculateLevel(charXP);
        updateCharacterHUD();
        saveProgress();
      } else {
        currentSpan.classList.add("incorrect");
        errorCount++;
      }

      currentSpan.classList.remove("active");

      currentIndex++;

      if (currentIndex >= currentWords.length) {
        // Cuando termina la tanda de 20 palabras
        pickRandomWords();
        loadWords();
        currentIndex = 0;
      }

      const nextSpan = wordPanel.querySelectorAll(".word")[currentIndex];
      if (nextSpan) {
        nextSpan.classList.add("active");
      }

      input.value = "";
      updateMetrics();
    }
  });

  resetBtn.addEventListener("click", () => {
    resetGame();
  });
}

init();
