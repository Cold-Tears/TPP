const input = document.getElementById("input-word");
const wordPanel = document.getElementById("word-panel");

let wordList = [];
let currentIndex = 0;
let startTime = null;
let correctCount = 0;
let errorCount = 0;
let interval = null;

// Cargar palabras desde JSON externo
async function loadWordsFromJSON() {
  try {
    const response = await fetch('words.json');
    if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
    wordList = await response.json();
    initGame();
  } catch (error) {
    console.error("Error cargando palabras:", error);
    wordPanel.textContent = "Error cargando palabras.";
  }
}

// Inicializar el juego
function initGame() {
  currentIndex = 0;
  startTime = null;
  correctCount = 0;
  errorCount = 0;

  loadWords();
  updateMetrics();

  input.disabled = false;
  input.value = "";
  input.focus();
  if(interval) clearInterval(interval);
}

// Cargar palabras al panel
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

// Timer
function startTimer() {
  if (startTime) return;
  startTime = new Date();
  interval = setInterval(updateMetrics, 1000);
}

// Validar input
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
    } else {
      words[currentIndex].classList.add("incorrect");
      errorCount += calculateErrors(currentWord, typedWord);
    }

    words[currentIndex].classList.remove("active");

    currentIndex++;
    if (currentIndex < wordList.length) {
      words[currentIndex].classList.add("active");
    } else {
      input.disabled = true; // Fin del juego
      clearInterval(interval);
    }

    input.value = "";
    updateMetrics();
  }
});

// Métricas
function updateMetrics() {
  const now = new Date();
  const elapsedSeconds = startTime ? (now - startTime) / 1000 : 0;
  const wpm = elapsedSeconds > 0 ? Math.round((correctCount / elapsedSeconds) * 60) : 0;

  document.getElementById("hud-time").textContent = formatTime(elapsedSeconds);
  document.getElementById("hud-words").textContent = correctCount;
  document.getElementById("hud-wpm").textContent = wpm;
  document.getElementById("hud-errors").textContent = errorCount;
}

// Comparar palabras por letras
function calculateErrors(target, input) {
  const maxLen = Math.max(target.length, input.length);
  let errors = 0;
  for (let i = 0; i < maxLen; i++) {
    if (target[i] !== input[i]) errors++;
  }
  return errors;
}

// Formatear tiempo
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Cargar las palabras y arrancar
loadWordsFromJSON();
