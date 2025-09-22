

class Question {
  constructor(text, options, answer) {
    this.text = text;
    this.options = options;
    this.answer = answer;
  }
  isCorrect(choice) {
    return choice === this.answer;
  }
}

class Game {
  constructor(questions) {
    this.questions = [...questions]; // copia del array original
    this.score = 0;
  }

  getRandomQuestion() {
    if (this.questions.length === 0) return null;
    const index = Math.floor(Math.random() * this.questions.length);
    return this.questions[index];
  }

  removeQuestion(question) {
    this.questions = this.questions.filter(q => q !== question);
  }

  reset() {
    this.score = 0;
    this.questions = [...allQuestions]; // reinicia todas las preguntas
  }
}

// Lista de 15 preguntas
const allQuestions = [
  new Question("¿Cómo se escribe correctamente: A mi me gusta la ___ de granola?", ["Vara", "Bara", "Barra"], "Barra"),
  new Question("Conjuga: Yo ___ (correr) ayer.", ["corro", "corrí", "correré"], "corrí"),
  new Question("¿Dónde lleva tilde la siguiente palabra de forma interrogativa?", ["Como", "Cómo"], "Cómo"),
  new Question("Selecciona la puntuación correcta:", ["¿Que hora es?", "¿Qué hora es?"], "¿Qué hora es?"),
  new Question("¿Cuál es un sinónimo de 'feliz'?", ["Contento", "Triste", "Serio"], "Contento"),
  new Question("¿Cuál es un antónimo de 'alto'?", ["Bajo", "Grande", "Pequeño"], "Bajo"),
  new Question("El plural de 'luz' es:", ["Luces", "Luzes", "Luses"], "Luces"),
  new Question("¿Qué palabra está bien escrita?", ["Haver", "Haber", "Aver"], "Haber"),
  new Question("Selecciona la forma correcta: 'Ellos ___ a la escuela todos los días.'", ["ba", "van", "ban"], "van"),
  new Question("¿Dónde lleva tilde? (pregunta indirecta)", ["Quien sabe", "Quién sabe"], "Quién sabe"),
  new Question("Conjuga: Nosotros ___ (leer) un libro ayer.", ["leímos", "leemos", "leeremos"], "leímos"),
  new Question("¿Qué signo falta? ___Qué sorpresa!", ["¡", "¿", "!"], "¡"),
  new Question("¿Cuál es el aumentativo de 'casa'?", ["Casita", "Casona", "Casilla"], "Casona"),
  new Question("¿Cuál es un sustantivo propio?", ["Perro", "Juan", "niña"], "Juan"),
  new Question("Completa: La mariposa es más ___ que la abeja.", ["bonita", "bonito", "bonitos"], "bonita")
];

const game = new Game(allQuestions);

// DOM
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const carEl = document.getElementById("car");

let timerId;
let timeLeft = 5;
let currentQuestion;

// Mostrar coche según puntos
function updateCarPosition() {
  const trackWidth = document.querySelector(".track").offsetWidth - 80;
  const progress = game.score / 100;
  carEl.style.right = `${progress * trackWidth}px`;
}

// Temporizador
function startTimer() {
  timeLeft = 5;
  timerEl.textContent = timeLeft;

  timerId = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerId);
      handleAnswer(null); // tiempo agotado = error
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
}

// Mostrar pregunta
function showQuestion() {
  currentQuestion = game.getRandomQuestion();
  if (!currentQuestion) {
    questionEl.textContent = "🎉 ¡Terminaste todas las preguntas!";
    optionsEl.innerHTML = "";
    return;
  }

  questionEl.textContent = currentQuestion.text;
  optionsEl.innerHTML = "";

  currentQuestion.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => handleAnswer(option, btn);
    optionsEl.appendChild(btn);
  });

  stopTimer();
  startTimer();
}

// Manejar respuesta
function handleAnswer(option, btn = null) {
  stopTimer();

  if (option && currentQuestion.isCorrect(option)) {
    if (btn) btn.style.backgroundColor = "green";
    game.score += 10;
  } else {
    if (btn) btn.style.backgroundColor = "red";
    game.score -= 10;
  }

  if (game.score < 0) game.score = 0;
  scoreEl.textContent = game.score;
  updateCarPosition();

  Array.from(optionsEl.children).forEach(b => b.disabled = true);

  // Eliminar pregunta respondida
  game.removeQuestion(currentQuestion);

  if (game.score >= 100) {
    questionEl.textContent = "¡Ganaste la carrera!";
    optionsEl.innerHTML = "";
    showRestartButton();
  } else if (game.score <= 0) {
    questionEl.textContent = "¡Perdiste! Reiniciando...";
    optionsEl.innerHTML = "";
    setTimeout(() => {
      game.reset();
      scoreEl.textContent = game.score;
      updateCarPosition();
      showQuestion();
    }, 2000);
  } else {
    // Pasar automáticamente a la siguiente pregunta después de 1 segundo
    setTimeout(() => {
      showQuestion();
    }, 1000);
  }
}

// Botón reinicio
function showRestartButton() {
  const btn = document.createElement("button");
  btn.textContent = "Reiniciar Juego";
  btn.style.padding = "10px 20px";
  btn.style.fontSize = "16px";
  btn.style.marginTop = "20px";
  btn.style.backgroundColor = "#2ecc71";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.onclick = () => {
    game.reset();
    scoreEl.textContent = game.score;
    updateCarPosition();
    btn.remove();
    showQuestion();
  };
  document.querySelector(".game-container").appendChild(btn);
}

const pauseBtn = document.getElementById("pause-btn");
const homeBtn = document.getElementById("home-btn");

let isPaused = false;

pauseBtn.onclick = () => {
  if (!isPaused) {
    stopTimer();
    Array.from(optionsEl.children).forEach(b => b.disabled = true);
    pauseBtn.textContent = "Continuar";
    isPaused = true;
  } else {
    startTimer();
    Array.from(optionsEl.children).forEach(b => b.disabled = false);
    pauseBtn.textContent = "Pausar";
    isPaused = false;
  }
};

homeBtn.onclick = () => {
  stopTimer();
  game.reset();
  scoreEl.textContent = game.score;
  updateCarPosition();
  gameContainer.style.display = "none";
  startScreen.style.display = "flex";
};

// Pantalla de inicio
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const gameContainer = document.getElementById("game-container");

startBtn.onclick = () => {
  startScreen.style.display = "none";
  gameContainer.style.display = "block";
  showQuestion();
};
