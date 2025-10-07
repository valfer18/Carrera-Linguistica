
// --- Configuración de la API ---
const API_CONFIG = {
    BASE_URL: 'https://puramentebackend.onrender.com/api/gamedata/game/2/category/espanol'
};

// Variable global para almacenar todas las preguntas cargadas
let allQuestionsData = {};

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
    this.allQuestions = [...questions]; // guardamos una copia para reset
    this.score = 0;
    this.rawScore = 0; // Puntuación bruta antes de normalizar
    this.correctStreak = 0; // Racha de respuestas correctas
    this.totalQuestions = 0; // Total de preguntas respondidas
    this.maxPossibleScore = 0; // Puntaje máximo posible
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
    this.rawScore = 0;
    this.correctStreak = 0;
    this.totalQuestions = 0;
    this.maxPossibleScore = 0;
    this.questions = [...this.allQuestions]; // reinicia todas las preguntas
    // Reiniciar contadores globales
    correctAnswersCount = 0;
    gameStartTime = null;
  }

  updateQuestions(newQuestions) {
    this.questions = [...newQuestions];
    this.allQuestions = [...newQuestions];
    this.score = 0;
    this.rawScore = 0;
    this.correctStreak = 0;
    this.totalQuestions = 0;
    // Calcular puntaje máximo posible
    this.maxPossibleScore = this.calculateMaxPossibleScore();
  }

  calculateMaxPossibleScore() {
    const totalQuestions = this.allQuestions.length;
    let maxScore = 0;
    
    // Puntaje base: 10 puntos por pregunta
    maxScore += totalQuestions * 10;
    
    // Bonus por rapidez: 2 puntos por pregunta (asumiendo respuesta rápida)
    maxScore += totalQuestions * 2;
    
    // Bonus por racha: +5 puntos cada 3 respuestas correctas
    const maxStreaks = Math.floor(totalQuestions / 3);
    maxScore += maxStreaks * 5;
    
    // Bonus por finalización: +10 puntos
    maxScore += 10;
    
    return maxScore;
  }

  // Calcular puntaje máximo posible sin bonus (solo puntos base)
  calculateMaxBaseScore() {
    return this.allQuestions.length * 10; // Solo 10 puntos por pregunta
  }

  // Procesar respuesta con nuevo sistema de puntuación
  processAnswer(isCorrect, responseTime) {
    this.totalQuestions++;
    let pointsEarned = 0;
    
    if (isCorrect) {
      // Puntaje base por respuesta correcta
      pointsEarned += 10;
      this.correctStreak++;
      
      // Bonus por rapidez (si responde en menos de 3 segundos)
      if (responseTime < 3) {
        pointsEarned += 2;
      }
      
      // Bonus por racha (cada 3 respuestas correctas seguidas)
      if (this.correctStreak > 0 && this.correctStreak % 3 === 0) {
        pointsEarned += 5;
      }
    } else {
      // Respuesta incorrecta = 0 puntos base
      this.correctStreak = 0; // Reiniciar racha
    }
    
    this.rawScore += pointsEarned;
    this.updateNormalizedScore();
    
    return pointsEarned;
  }
  
  // Bonus por completar el juego
  addCompletionBonus() {
    this.rawScore += 10;
    this.updateNormalizedScore();
  }
  
  // Convertir a escala normalizada (0-100)
  updateNormalizedScore() {
    if (this.maxPossibleScore > 0) {
      this.score = Math.round((this.rawScore / this.maxPossibleScore) * 100);
      this.score = Math.min(100, Math.max(0, this.score)); // Mantener entre 0-100
    } else {
      this.score = 0;
    }
  }
}

// --- Funciones de la API ---
async function loadGameDataFromAPI() {
    try {
        const response = await fetch(API_CONFIG.BASE_URL);
        const apiResponse = await response.json();
        
        // Verificar que la respuesta sea exitosa
        if (!apiResponse.success) {
            throw new Error('La API retornó un error: ' + (apiResponse.message || 'Error desconocido'));
        }
        
        // Verificar que haya datos
        if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
            throw new Error('La API no retornó datos válidos');
        }
        
        // Transformar la estructura de la API al formato que usa el juego
        const gameTopics = {};
        
        apiResponse.data.forEach(item => {
            // Extraer los datos de cada subcategoría
            Object.keys(item.gamedata).forEach(subject => {
                gameTopics[subject] = item.gamedata[subject];
            });
        });
        
        return gameTopics;
    } catch (error) {
        console.error('Error al cargar datos de la API:', error);
        throw error;
    }
}

async function loadGameData() {
    showLoadingMessage('Cargando datos desde API...');
    
    try {
        const gameData = await loadGameDataFromAPI();
        hideLoadingMessage();
        return gameData;
    } catch (error) {
        hideLoadingMessage();
        throw new Error('Error al conectar con la API: ' + error.message);
    }
}

// --- Funciones auxiliares para mostrar mensajes ---
function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-message';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
    `;
    loadingDiv.textContent = message;
    document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 8000); // Mostrar por 8 segundos
}

// --- Función para convertir datos de API a objetos Question ---
function convertAPIDataToQuestions(apiData) {
    const questions = [];
    
    Object.keys(apiData).forEach(subject => {
        const subjectData = apiData[subject];
        if (subjectData && Array.isArray(subjectData)) {
            subjectData.forEach(questionData => {
                // Usar 'answer' en lugar de 'correct_answer' según la estructura de la API
                if (questionData.question && questionData.options && questionData.answer) {
                    const question = new Question(
                        questionData.question,
                        questionData.options,
                        questionData.answer
                    );
                    questions.push(question);
                }
            });
        }
    });
    
    return questions;
}

// --- Carga de Preguntas (función principal) ---
async function loadQuestions() {
    const apiData = await loadGameData();
    if (!apiData) {
        throw new Error('No se pudieron cargar los datos de la API');
    }
    
    allQuestionsData = apiData;
    const questionsFromAPI = convertAPIDataToQuestions(apiData);
    
    if (questionsFromAPI.length === 0) {
        throw new Error('No se encontraron preguntas válidas en los datos de la API');
    }
    
    console.log(`Cargadas ${questionsFromAPI.length} preguntas de ${Object.keys(apiData).length} categorías`);
    return questionsFromAPI;
}

// Las preguntas se cargan dinámicamente desde la API

// Inicializar el juego con array vacío (se llenará con datos de la API)
let game = new Game([]);

// DOM
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const carEl = document.getElementById("car");

// Variables globales del juego
let timerId;
let timeLeft = 10;
let currentQuestion;
let questionStartTime; // Tiempo cuando se mostró la pregunta
let gameStartTime; // Tiempo cuando inició el juego
let correctAnswersCount = 0; // Contador de respuestas correctas

// Mostrar coche según puntos
function updateCarPosition() {
  const trackWidth = document.querySelector(".track").offsetWidth - 80;
  // Usar puntuación normalizada para el progreso visual del coche
  const progress = game.score / 100;
  carEl.style.right = `${progress * trackWidth}px`;
}

// Mostrar puntos ganados con detalles
function showPointsEarned(points, wasQuick, hadStreak) {
  let message = `+${points} puntos`;
  if (wasQuick) message += " (¡Rápido! +2)";
  if (hadStreak) message += " (¡Racha! +5)";
  
  showFloatingMessage(message, "green");
}

// Mostrar mensaje de puntos perdidos
function showPointsLost(reason) {
  showFloatingMessage(reason + " (0 puntos)", "red");
}

// Mostrar mensaje flotante
function showFloatingMessage(message, color) {
  const floatingDiv = document.createElement('div');
  floatingDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color};
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 1000;
    font-weight: bold;
    animation: fadeInOut 2s ease-in-out forwards;
  `;
  floatingDiv.textContent = message;
  
  // Agregar CSS para la animación si no existe
  if (!document.getElementById('floating-message-styles')) {
    const style = document.createElement('style');
    style.id = 'floating-message-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20%, 80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(floatingDiv);
  setTimeout(() => floatingDiv.remove(), 2000);
}

// Actualizar display del score con información adicional
function updateScoreDisplay() {
  const scoreContainer = scoreEl.parentElement;
  let detailsEl = document.getElementById('score-details');
  
  if (!detailsEl) {
    detailsEl = document.createElement('div');
    detailsEl.id = 'score-details';
    detailsEl.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    `;
    scoreContainer.appendChild(detailsEl);
  }
  
  const streakText = game.correctStreak > 0 ? `Racha: ${game.correctStreak}` : '';
  const questionsLeft = `Preguntas: ${game.questions.length}`;
  const normalizedText = `(${game.score}/100)`;
  detailsEl.textContent = `${questionsLeft} • ${streakText} • ${normalizedText}`;
}

// Mostrar estadísticas del juego
function showGameStats() {
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = `
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    font-size: 14px;
    line-height: 1.5;
  `;
  
  const totalTime = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const maxPossiblePoints = game.calculateMaxPossibleScore(); // Con todos los bonus
  const maxBasePoints = game.calculateMaxBaseScore(); // Solo base
  
  statsDiv.innerHTML = `
    <strong>📊 Estadísticas del Juego</strong><br>
    <span>Preguntas respondidas: ${game.totalQuestions}</span><br>
    <span>Respuestas correctas: ${correctAnswersCount}</span><br>
    <span>Tiempo total: ${timeFormatted}</span><br>
    <span>Puntos obtenidos: ${game.rawScore}</span><br>
    <span>Puntos máximos (con bonus): ${maxPossiblePoints}</span><br>
    <span>Puntos base máximos: ${maxBasePoints}</span><br>
    <span>Puntuación normalizada: ${game.score}/100</span><br>
    <span>Mejor racha: ${Math.max(game.correctStreak, 0)}</span>
  `;
  
  document.querySelector(".game-container").appendChild(statsDiv);
}

// Temporizador
function startTimer() {
  timeLeft = 10;
  questionStartTime = Date.now(); // Registrar tiempo de inicio
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
    // Enviar datos si terminaron todas las preguntas
    sendFinalGameData();
    return;
  }

  // Inicializar tiempo de juego en la primera pregunta
  if (!gameStartTime) {
    gameStartTime = Date.now();
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
  
  // Calcular tiempo de respuesta en segundos
  const responseTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 5;
  const isCorrect = option && currentQuestion.isCorrect(option);
  
  // Contar respuestas correctas para el API
  if (isCorrect) {
    correctAnswersCount++;
  }
  
  // Procesar respuesta con nuevo sistema de puntuación
  const pointsEarned = game.processAnswer(isCorrect, responseTime);
  
  // Feedback visual
  if (isCorrect) {
    if (btn) btn.style.backgroundColor = "green";
    showPointsEarned(pointsEarned, responseTime < 3, game.correctStreak % 3 === 0 && game.correctStreak > 0);
  } else {
    if (btn) btn.style.backgroundColor = "red";
    if (pointsEarned === 0) {
      showPointsLost("Respuesta incorrecta");
    }
  }

  scoreEl.textContent = game.rawScore; // Mostrar puntos brutos reales
  updateCarPosition();
  updateScoreDisplay();

  Array.from(optionsEl.children).forEach(b => b.disabled = true);

  // Eliminar pregunta respondida
  game.removeQuestion(currentQuestion);

  // Verificar condiciones de fin de juego
  if (game.questions.length === 0) {
    // Juego completado
    game.addCompletionBonus();
    scoreEl.textContent = game.rawScore; // Mostrar puntos brutos
    updateCarPosition();
    questionEl.textContent = `🎉 ¡Juego completado! Puntuación final: ${game.rawScore} puntos (${game.score}/100)`;
    optionsEl.innerHTML = "";
    showGameStats();
    showRestartButton();
    // Enviar datos finales al API
    sendFinalGameData();
  } else if (game.score >= 85) {
    // Victoria temprana (85% del puntaje máximo)
    questionEl.textContent = `🏆 ¡Excelente! Puntuación: ${game.rawScore} puntos (${game.score}/100)`;
    optionsEl.innerHTML = "";
    showGameStats();
    showRestartButton();
    // Enviar datos finales al API también en victoria temprana
    sendFinalGameData();
  } else {
    // Continuar con la siguiente pregunta
    setTimeout(() => {
      showQuestion();
    }, 1500);
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
    scoreEl.textContent = game.rawScore; // Mostrar puntos brutos
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
  scoreEl.textContent = game.rawScore; // Mostrar puntos brutos
  updateCarPosition();
  gameContainer.style.display = "none";
  startScreen.style.display = "flex";
};

// Función para recargar preguntas desde la API (útil para debugging)
async function reloadQuestionsFromAPI() {
  try {
    const questions = await loadQuestions();
    game.updateQuestions(questions);
    console.log('Preguntas recargadas desde la API');
    return true;
  } catch (error) {
    console.error('Error al recargar preguntas:', error);
    return false;
  }
}

// Función de debugging para ver los datos de la API
async function debugAPIData() {
  try {
    const response = await fetch(API_CONFIG.BASE_URL);
    const data = await response.json();
    console.log('Respuesta completa de la API:');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error al obtener datos de debug:', error);
    return null;
  }
}

// --- Función para extraer user_id de la URL ---
function getUserIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    return userId ? parseInt(userId) : null;
}

// --- Función para guardar datos del juego ---
function saveGameData(data) {
    // Verificar que exista user_id antes de proceder
    if (!data.user_id) {
        console.log('No hay user_id disponible. No se enviarán datos al servidor.');
        return;
    }
    
    console.log("Datos del juego guardados:", JSON.stringify(data, null, 2));
    
    // Guardar en localStorage como respaldo
    localStorage.setItem('lastGameData', JSON.stringify(data));
    
    showDataSendingIndicator();
    
    // Enviar datos a la API
    fetch('https://puramentebackend.onrender.com/api/game-attempts/from-game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Datos enviados exitosamente:', data);
        // Mostrar mensaje de éxito temporalmente
        updateLoadingText('¡Datos enviados correctamente!');
        setTimeout(() => {
            hideDataSendingIndicator();
        }, 2000); // Ocultar después de 2 segundos
    })
    .catch(error => {
        console.error('Error enviando datos:', error);
        // Mostrar mensaje de error temporalmente
        updateLoadingText('Error al enviar datos');
        setTimeout(() => {
            hideDataSendingIndicator();
        }, 3000); // Ocultar después de 3 segundos
    });
    
    return data; // Retorna los datos para que puedas usarlos si necesitas
}

// --- Funciones auxiliares para el indicador de envío ---
function showDataSendingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'data-sending-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
        text-align: center;
    `;
    indicator.textContent = 'Enviando datos...';
    document.body.appendChild(indicator);
}

function hideDataSendingIndicator() {
    const indicator = document.getElementById('data-sending-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function updateLoadingText(text) {
    const indicator = document.getElementById('data-sending-indicator');
    if (indicator) {
        indicator.textContent = text;
    }
}

// --- Función para enviar datos finales del juego ---
function sendFinalGameData() {
    // Extraer user_id de la URL
    const userId = getUserIdFromURL();
    
    if (userId) {
        const totalTime = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
        const maxPossiblePoints = game.calculateMaxPossibleScore(); // Puntos máximos CON todos los bonus
        const userPoints = game.rawScore; // Puntos reales obtenidos (incluye bonus)
        
        const gameData = {
            user_id: userId,
            game_id: 2,
            correct_challenges: userPoints, // Puntos obtenidos por el usuario
            total_challenges: maxPossiblePoints, // Total de puntos posibles CON bonus
            time_spent: totalTime
        };

        console.log('Enviando datos al API:', {
            'Puntos obtenidos': userPoints,
            'Puntos máximos (con bonus)': maxPossiblePoints,
            'Tiempo': totalTime + ' segundos'
        });

        saveGameData(gameData);
    } else {
        console.log('No se encontró user_id en la URL. No se enviarán datos al servidor.');
    }
}

// Pantalla de inicio
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const gameContainer = document.getElementById("game-container");

startBtn.onclick = async () => {
  try {
    // Deshabilitar el botón mientras carga
    startBtn.disabled = true;
    startBtn.textContent = "Cargando...";
    
    // Reiniciar contadores del juego
    correctAnswersCount = 0;
    gameStartTime = null;
    
    // Cargar preguntas de la API
    const questions = await loadQuestions();
    
    // Actualizar el juego con las nuevas preguntas
    game.updateQuestions(questions);
    
    // Iniciar el juego
    startScreen.style.display = "none";
    gameContainer.style.display = "block";
    showQuestion();
    
  } catch (error) {
    console.error('Error al iniciar el juego:', error);
    showErrorMessage('Error al cargar el juego. Inténtalo de nuevo.');
  } finally {
    // Rehabilitar el botón
    startBtn.disabled = false;
    startBtn.textContent = "¡Empezar Juego!";
  }
};

// --- Inicialización automática ---
// Cargar preguntas en segundo plano cuando se carga la página
window.addEventListener('load', async () => {
  try {
    console.log('Precargando preguntas de la API...');
    const questions = await loadQuestions();
    game.updateQuestions(questions);
    console.log(`Cargadas ${questions.length} preguntas desde la API`);
  } catch (error) {
    console.error('Error al precargar preguntas de la API:', error);
    showErrorMessage('Error al cargar preguntas. Revisa tu conexión a internet.');
  }
});
