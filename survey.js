/* ══════════════════════════════════════════════
    survey.js — Lógica Completa del Frontend
   ══════════════════════════════════════════════ */

const API = '/api';

// ── 1. DEFINICIÓN DE PREGUNTAS ──────────────────────
const QUESTIONS = [
  {
    id: 'frecuencia',
    text: '¿Con qué frecuencia usas herramientas de inteligencia artificial?',
    type: 'single',
    options: ['Todos los días', 'Varias veces a la semana', 'Ocasionalmente', 'Casi nunca o nunca']
  },
  {
    id: 'uso',
    text: '¿Para qué usas principalmente la IA?',
    type: 'multi',
    options: ['Trabajo o estudios', 'Entretenimiento', 'Información y búsquedas', 'Creatividad']
  },
  {
    id: 'confianza',
    text: '¿Qué tan confiable consideras la información que genera la IA?',
    type: 'single',
    options: ['Muy confiable', 'Confiable con verificación', 'Poco confiable', 'No confío en ella']
  },
  {
    id: 'preocupacion',
    text: '¿Cuál es tu mayor preocupación respecto al uso de la IA?',
    type: 'single',
    options: ['Privacidad', 'Desempleo', 'Desinformación', 'Pérdida de habilidades']
  },
  {
    id: 'impacto',
    text: '¿Crees que la IA tendrá un impacto positivo o negativo en la sociedad?',
    type: 'single',
    options: ['Muy positivo', 'Más positivo que negativo', 'Más negativo que positivo', 'Muy negativo']
  },
  {
    id: 'sectores',
    text: '¿En qué sectores crees que la IA será más útil?',
    type: 'multi',
    options: ['Salud', 'Educación', 'Seguridad', 'Industria']
  }
];

// ── 2. ESTADO DE LA APLICACIÓN ──────────────────────
let current = 0;
let answers = QUESTIONS.map(() => []);
let chartInstances = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderQuestion();
});

// ── 3. RENDERIZADO DE PREGUNTAS ─────────────────────
function renderQuestion() {
  const q = QUESTIONS[current];
  const total = QUESTIONS.length;

  // Actualizar barra de progreso
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  if(progressFill) progressFill.style.width = ((current + 1) / total * 100) + '%';
  if(progressText) progressText.textContent = `${current + 1} / ${total}`;

  // Títulos
  document.getElementById('q-number').textContent = `Pregunta ${current + 1}`;
  document.getElementById('q-text').textContent = q.text;

  const hint = document.getElementById('q-hint');
  hint.classList.toggle('hidden', q.type !== 'multi');

  // Lista de opciones
  const container = document.getElementById('options-list');
  container.innerHTML = '';

  q.options.forEach((opt, i) => {
    const selected = answers[current].includes(i);
    const isMulti = q.type === 'multi';

    const div = document.createElement('div');
    div.className = 'option' + (selected ? ' selected' : '');
    div.onclick = () => selectOption(i);

    const indicator = document.createElement('div');
    indicator.className = 'opt-indicator' + (isMulti ? ' square' : '');
    indicator.innerHTML = isMulti ? '✓' : '●';

    const label = document.createElement('span');
    label.className = 'opt-text';
    label.textContent = opt;

    div.appendChild(indicator);
    div.appendChild(label);
    container.appendChild(div);
  });

  // Botones
  document.getElementById('btn-prev').disabled = current === 0;
  const btnNext = document.getElementById('btn-next');
  btnNext.textContent = current === total - 1 ? 'Enviar respuestas ✓' : 'Siguiente →';
  btnNext.disabled = answers[current].length === 0;
}

function selectOption(index) {
  const q = QUESTIONS[current];
  if (q.type === 'single') {
    answers[current] = [index];
  } else {
    const pos = answers[current].indexOf(index);
    if (pos === -1) answers[current].push(index);
    else answers[current].splice(pos, 1);
  }
  renderQuestion();
}

function nextQ() {
  if (current < QUESTIONS.length - 1) {
    current++;
    renderQuestion();
  } else {
    submitSurvey();
  }
}

function prevQ() {
  if (current > 0) {
    current--;
    renderQuestion();
  }
}

// ── 4. ENVÍO Y CARGA DE DATOS ───────────────────────
async function submitSurvey() {
  const payload = {};
  QUESTIONS.forEach((q, i) => {
    payload[q.id] = answers[i].map(idx => q.options[idx]);
  });

  try {
    const res = await fetch(`${API}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error al guardar');
    showScreen('thanks');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function loadResults() {
  try {
    const res = await fetch(`${API}/results`);
    const data = await res.json();
    renderResults(data);
    showScreen('results');
  } catch (err) {
    alert('Error al cargar resultados: ' + err.message);
  }
}

// ── 5. RENDERIZADO DE GRÁFICAS (MEJORADO) ───────────
function renderResults(data) {
  const { summary, rows } = data;

  chartInstances.forEach(c => c.destroy());
  chartInstances = [];

  const grid = document.getElementById('charts-grid');
  grid.innerHTML = '';

  const PALETTE = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

  QUESTIONS.forEach(q => {
    const qData = summary[q.id];
    if (!qData) return;

    const card = document.createElement('div');
    card.className = 'chart-card';
    card.innerHTML = `<h4>${q.text}</h4>`;
    
    const canvas = document.createElement('canvas');
    canvas.height = 250;
    card.appendChild(canvas);
    grid.appendChild(card);

    const labels = Object.keys(qData);
    const values = Object.values(qData);

    // Lógica Pro: Círculos para opinión, Barras para datos múltiples
    let tipo = (['frecuencia', 'confianza', 'impacto'].includes(q.id)) ? 'doughnut' : 'bar';

    const chart = new Chart(canvas, {
      type: tipo,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: PALETTE.slice(0, labels.length),
          borderRadius: tipo === 'bar' ? 8 : 0,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: tipo === 'doughnut', position: 'bottom' }
        },
        scales: tipo === 'bar' ? { y: { beginAtZero: true, ticks: { stepSize: 1 } } } : {}
      }
    });
    chartInstances.push(chart);
  });

  renderTable(rows);
}

function renderTable(rows) {
  const tbody = document.querySelector('#results-table tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const fecha = new Date(row.created_at).toLocaleDateString('es-CO');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${row.frecuencia || '—'}</td>
      <td>${row.uso || '—'}</td>
      <td>${row.confianza || '—'}</td>
      <td>${row.preocupacion || '—'}</td>
      <td>${row.impacto || '—'}</td>
      <td>${row.sectores || '—'}</td>
      <td>${fecha}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Navegación de pantallas
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if(target) target.classList.add('active');
}

function resetSurvey() {
  current = 0;
  answers = QUESTIONS.map(() => []);
  renderQuestion();
  showScreen('survey');
}