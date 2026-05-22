const storageKey = "simpleWorkoutLog.v1";
const metaStorageKey = "simpleWorkoutMeta.v1";

const defaultMeta = {
  trackWeight: false,
  trackQuit: false,
  quitStartDate: ""
};

const starterSessions = [
  {
    id: crypto.randomUUID(),
    date: "2025-09-13",
    note: "",
    exercises: [
      { name: "哑铃卧推", weight: "25kg", reps: "12" },
      { name: "哑铃卧推", weight: "30kg", reps: "12/12/12/12" },
      { name: "史密斯深蹲", weight: "50kg", reps: "12/12/12/12" },
      { name: "杠铃弯举", weight: "20kg", reps: "12/12/12/12" },
      { name: "划船机", weight: "42kg", reps: "12/12/12/12" }
    ]
  },
  {
    id: crypto.randomUUID(),
    date: "2025-09-06",
    note: "",
    exercises: [
      { name: "哑铃卧推", weight: "20kg", reps: "12" },
      { name: "哑铃卧推", weight: "30kg", reps: "12/12/12/12" },
      { name: "史密斯深蹲", weight: "40kg", reps: "12/12/12/12" },
      { name: "倒蹬机", weight: "100kg", reps: "12/12/12/12" },
      { name: "哑铃回环", weight: "5kg", reps: "8/8/8/8" },
      { name: "龙门架下压", weight: "40kg", reps: "12/12/11/9" }
    ]
  },
  {
    id: crypto.randomUUID(),
    date: "2025-08-31",
    note: "",
    exercises: [
      { name: "哑铃卧推", weight: "25kg", reps: "" },
      { name: "上斜哑铃卧推", weight: "", reps: "12/12/12/12" },
      { name: "杠铃划船", weight: "50kg", reps: "12/12/12/12" },
      { name: "史密斯推举", weight: "10kg", reps: "12/12/12/12" }
    ]
  },
  {
    id: crypto.randomUUID(),
    date: "2025-08-20",
    note: "",
    exercises: [
      { name: "哑铃卧推", weight: "25kg", reps: "12" },
      { name: "上斜哑铃卧推", weight: "", reps: "12/12/11/10" },
      { name: "杠铃划船", weight: "50kg", reps: "12/12/12/12" },
      { name: "器械夹腿", weight: "100kg", reps: "12/12/12" },
      { name: "器械夹腿", weight: "110kg", reps: "12/12" },
      { name: "器械夹胸", weight: "60kg", reps: "12/12/8/6" }
    ]
  }
];

let sessions = loadSessions();
let meta = loadMeta();
let editingId = null;

const form = document.querySelector("#sessionForm");
const dateInput = document.querySelector("#sessionDate");
const noteInput = document.querySelector("#sessionNote");
const exerciseList = document.querySelector("#exerciseList");
const template = document.querySelector("#exerciseTemplate");
const historyList = document.querySelector("#historyList");
const searchInput = document.querySelector("#searchInput");
const sessionWeightInput = document.querySelector("#sessionWeight");
const trackWeightToggle = document.querySelector("#trackWeightToggle");
const trackQuitToggle = document.querySelector("#trackQuitToggle");
const quitStartDateInput = document.querySelector("#quitStartDate");
const weightField = document.querySelector("#weightField");
const quitDateField = document.querySelector("#quitDateField");
const weightTrendCanvas = document.querySelector("#weightTrendCanvas");
const weightTrendHint = document.querySelector("#weightTrendHint");
const appVersionText = document.querySelector("#appVersion");
const appUpdatedAtText = document.querySelector("#appUpdatedAt");
const appEnvironmentText = document.querySelector("#appEnvironment");
const importFileInput = document.querySelector("#importFileInput");
const bulkInput = document.querySelector("#bulkInput");
const bulkImportBtn = document.querySelector("#bulkImportBtn");
const bulkFileInput = document.querySelector("#bulkFileInput");
const bulkClearBtn = document.querySelector("#bulkClearBtn");
const syncVersionBtn = document.querySelector("#syncVersionBtn");

document.querySelector("#addExerciseBtn").addEventListener("click", () => addExerciseRow());
document.querySelector("#clearFormBtn").addEventListener("click", resetForm);
document.querySelector("#exportBtn").addEventListener("click", exportData);
searchInput.addEventListener("input", render);
form.addEventListener("submit", saveSession);
trackWeightToggle.addEventListener("change", handleWeightToggleChange);
trackQuitToggle.addEventListener("change", handleQuitToggleChange);
quitStartDateInput.addEventListener("change", handleQuitDateChange);
window.addEventListener("resize", renderWeightTrend);
importFileInput.addEventListener("change", handleImportFileChange);
bulkImportBtn.addEventListener("click", handleBulkImport);
bulkFileInput.addEventListener("change", handleBulkFileChange);
syncVersionBtn.addEventListener("click", handleVersionSync);
bulkClearBtn.addEventListener("click", () => {
  bulkInput.value = "";
});

setToday();
hydrateOptionalState();
addExerciseRow();
renderBuildInfo();
render();
registerServiceWorker();

function loadSessions() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(storageKey, JSON.stringify(starterSessions));
    return starterSessions;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadMeta() {
  const saved = localStorage.getItem(metaStorageKey);
  if (!saved) {
    localStorage.setItem(metaStorageKey, JSON.stringify(defaultMeta));
    return { ...defaultMeta };
  }

  try {
    const parsed = JSON.parse(saved);
    return { ...defaultMeta, ...parsed };
  } catch {
    return { ...defaultMeta };
  }
}

function persistSessions() {
  localStorage.setItem(storageKey, JSON.stringify(sessions));
}

function persistMeta() {
  localStorage.setItem(metaStorageKey, JSON.stringify(meta));
}

function setToday() {
  dateInput.value = new Date().toISOString().slice(0, 10);
}

function hydrateOptionalState() {
  trackWeightToggle.checked = Boolean(meta.trackWeight);
  trackQuitToggle.checked = Boolean(meta.trackQuit || meta.quitStartDate);
  if (trackQuitToggle.checked && !meta.trackQuit) {
    meta.trackQuit = true;
    persistMeta();
  }
  quitStartDateInput.value = meta.quitStartDate || "";
  syncOptionalFields();
}

function syncOptionalFields() {
  weightField.classList.toggle("is-hidden", !trackWeightToggle.checked);
  quitDateField.classList.toggle("is-hidden", !trackQuitToggle.checked);
}

function handleWeightToggleChange() {
  meta.trackWeight = trackWeightToggle.checked;
  if (!trackWeightToggle.checked) {
    sessionWeightInput.value = "";
  }
  persistMeta();
  syncOptionalFields();
  renderStats();
}

function handleQuitToggleChange() {
  meta.trackQuit = trackQuitToggle.checked;
  persistMeta();
  syncOptionalFields();
  renderStats();
}

function handleQuitDateChange() {
  meta.quitStartDate = quitStartDateInput.value;
  if (quitStartDateInput.value && !trackQuitToggle.checked) {
    trackQuitToggle.checked = true;
    meta.trackQuit = true;
  }
  persistMeta();
  syncOptionalFields();
  renderStats();
}

function addExerciseRow(exercise = { name: "", weight: "", reps: "" }) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector(".exercise-name").value = exercise.name;
  node.querySelector(".exercise-weight").value = exercise.weight;
  node.querySelector(".exercise-reps").value = exercise.reps;
  node.querySelector(".remove-exercise").addEventListener("click", () => {
    if (exerciseList.children.length > 1) {
      node.remove();
    }
  });
  exerciseList.appendChild(node);
}

function saveSession(event) {
  event.preventDefault();
  const exercises = [...exerciseList.querySelectorAll(".exercise-row")]
    .map((row) => ({
      name: row.querySelector(".exercise-name").value.trim(),
      weight: row.querySelector(".exercise-weight").value.trim(),
      reps: normalizeReps(row.querySelector(".exercise-reps").value)
    }))
    .filter((exercise) => exercise.name || exercise.weight || exercise.reps);

  if (!exercises.length) {
    return;
  }

  const weightValue = trackWeightToggle.checked ? normalizeWeight(sessionWeightInput.value) : "";
  const session = {
    id: editingId || crypto.randomUUID(),
    date: dateInput.value,
    note: noteInput.value.trim(),
    exercises
  };

  if (weightValue) {
    session.weight = weightValue;
  }

  if (editingId) {
    sessions = sessions.map((item) => (item.id === editingId ? session : item));
  } else {
    sessions = [session, ...sessions];
  }

  persistSessions();
  resetForm();
  render();
}

function normalizeReps(value) {
  return value.trim().replaceAll("+", "/").replace(/\s+/g, "");
}

function normalizeWeight(value) {
  const parsed = parseWeight(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return String(Number(parsed.toFixed(1)));
}

function resetForm() {
  editingId = null;
  setToday();
  noteInput.value = "";
  sessionWeightInput.value = "";
  exerciseList.innerHTML = "";
  addExerciseRow();
  form.querySelector(".primary").textContent = "保存训练";

  trackWeightToggle.checked = Boolean(meta.trackWeight);
  trackQuitToggle.checked = Boolean(meta.trackQuit || meta.quitStartDate);
  quitStartDateInput.value = meta.quitStartDate || "";
  syncOptionalFields();
}

function editSession(id) {
  const session = sessions.find((item) => item.id === id);
  if (!session) {
    return;
  }

  editingId = id;
  dateInput.value = session.date;
  noteInput.value = session.note || "";
  exerciseList.innerHTML = "";
  session.exercises.forEach((exercise) => addExerciseRow(exercise));

  const hasWeight = Boolean(session.weight);
  if (hasWeight && !trackWeightToggle.checked) {
    trackWeightToggle.checked = true;
    meta.trackWeight = true;
    persistMeta();
  }
  sessionWeightInput.value = session.weight || "";
  syncOptionalFields();

  form.querySelector(".primary").textContent = "更新训练";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSession(id) {
  if (!confirm("确定删除这次训练吗？")) {
    return;
  }
  sessions = sessions.filter((item) => item.id !== id);
  persistSessions();
  render();
}

function render() {
  const filtered = getFilteredSessions();
  renderStats();
  renderWeightTrend();
  renderHistory(filtered);
}

function getFilteredSessions() {
  const term = searchInput.value.trim().toLowerCase();
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  if (!term) {
    return sorted;
  }
  return sorted.filter((session) =>
    session.exercises.some((exercise) => exercise.name.toLowerCase().includes(term))
  );
}

function renderStats() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const uniqueDays = new Set(sessions.map((item) => item.date)).size;
  const recent30WorkoutDays = calculateRecentWorkoutDays(30);
  const smokeFreeDays = calculateSmokeFreeDays(meta.quitStartDate);
  const weightChange = calculateWeightChange();

  document.querySelector("#totalSessions").textContent = sessions.length;
  document.querySelector("#totalWorkoutDays").textContent = uniqueDays;
  document.querySelector("#recent30WorkoutDays").textContent = recent30WorkoutDays;
  document.querySelector("#monthSessions").textContent = sessions.filter((item) =>
    item.date.startsWith(currentMonth)
  ).length;
  document.querySelector("#totalExercises").textContent = sessions.reduce(
    (total, item) => total + item.exercises.length,
    0
  );
  document.querySelector("#smokeFreeDays").textContent =
    smokeFreeDays === null ? "-" : String(smokeFreeDays);
  document.querySelector("#weightChange").textContent = weightChange ?? "-";
}

function calculateSmokeFreeDays(dateValue) {
  if (!dateValue) {
    return null;
  }
  const start = parseDateOnly(dateValue);
  if (!start) {
    return null;
  }
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.floor((todayDateOnly.getTime() - start.getTime()) / 86400000);
  return diffDays >= 0 ? diffDays : null;
}

function calculateRecentWorkoutDays(windowDays) {
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(todayDateOnly);
  startDate.setDate(startDate.getDate() - (windowDays - 1));

  const days = new Set();
  sessions.forEach((session) => {
    const sessionDate = parseDateOnly(session.date);
    if (!sessionDate) {
      return;
    }
    if (sessionDate >= startDate && sessionDate <= todayDateOnly) {
      days.add(session.date);
    }
  });

  return days.size;
}

function calculateWeightChange() {
  const entries = getWeightEntries();

  if (entries.length < 2) {
    return null;
  }

  const firstWeight = entries[0].weight;
  const latestWeight = entries[entries.length - 1].weight;
  const delta = Number((latestWeight - firstWeight).toFixed(1));
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta}kg`;
}

function getWeightEntries() {
  const perDay = new Map();

  [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((session) => {
      const parsedDate = parseDateOnly(session.date);
      const parsedWeight = parseWeight(session.weight);
      if (!parsedDate || !Number.isFinite(parsedWeight)) {
        return;
      }
      perDay.set(session.date, {
        date: session.date,
        dateObj: parsedDate,
        weight: parsedWeight
      });
    });

  return [...perDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function parseWeight(value) {
  if (value === undefined || value === null) {
    return Number.NaN;
  }
  const direct = Number(String(value).trim());
  if (Number.isFinite(direct)) {
    return direct;
  }
  const matched = String(value).match(/\d+(\.\d+)?/);
  return matched ? Number(matched[0]) : Number.NaN;
}

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return new Date(year, month - 1, day);
}

function renderWeightTrend() {
  if (!weightTrendCanvas || !weightTrendHint) {
    return;
  }

  const entries = getWeightEntries();
  const canvas = weightTrendCanvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  resizeCanvasForDisplay(canvas, ctx);
  const width = canvas.width;
  const height = canvas.height;

  if (entries.length < 2) {
    weightTrendHint.textContent = `已记录 ${entries.length} 次体重，至少 2 次后显示趋势`;
    drawEmptyTrend(ctx, width, height, "暂无趋势");
    return;
  }

  const latest = entries[entries.length - 1];
  weightTrendHint.textContent = `共 ${entries.length} 次记录，最新 ${latest.weight.toFixed(1)}kg`;

  const padding = { top: 22, right: 26, bottom: 32, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minWeight = Math.min(...entries.map((item) => item.weight));
  const maxWeight = Math.max(...entries.map((item) => item.weight));
  const extra = Math.max(0.5, (maxWeight - minWeight) * 0.2);
  const yMin = minWeight - extra;
  const yMax = maxWeight + extra;
  const yRange = yMax - yMin || 1;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfdfa";
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, padding, chartWidth, chartHeight);

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#26625a";
  ctx.beginPath();

  entries.forEach((entry, index) => {
    const x =
      padding.left + (index / (entries.length - 1)) * Math.max(1, chartWidth);
    const y = padding.top + ((yMax - entry.weight) / yRange) * chartHeight;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#194a44";
  entries.forEach((entry, index) => {
    const x =
      padding.left + (index / (entries.length - 1)) * Math.max(1, chartWidth);
    const y = padding.top + ((yMax - entry.weight) / yRange) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#6b7280";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${entries[0].weight.toFixed(1)}kg`, 6, padding.top + 4);
  ctx.fillText(`${entries[entries.length - 1].weight.toFixed(1)}kg`, 6, height - padding.bottom + 4);
  ctx.fillText(formatMonthDay(entries[0].date), padding.left, height - 10);
  ctx.textAlign = "right";
  ctx.fillText(formatMonthDay(entries[entries.length - 1].date), width - padding.right, height - 10);
}

function drawGrid(ctx, padding, chartWidth, chartHeight) {
  ctx.strokeStyle = "#e6ece5";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (i / 4) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
  }
}

function drawEmptyTrend(ctx, width, height, text) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfdfa";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e5dfd4";
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.fillStyle = "#8a8f98";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2 + 4);
}

function resizeCanvasForDisplay(canvas, ctx) {
  const ratio = window.devicePixelRatio || 1;
  const displayWidth = Math.floor(canvas.clientWidth * ratio);
  const displayHeight = Math.floor(canvas.clientHeight * ratio);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function formatMonthDay(dateText) {
  const dateObj = parseDateOnly(dateText);
  if (!dateObj) {
    return dateText;
  }
  return `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  if (!location.protocol.startsWith("http")) {
    return;
  }
  const pageVersion = getPageVersion();
  const swUrl = `./sw.js?v=${encodeURIComponent(pageVersion)}`;
  let hasRefreshed = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasRefreshed) {
      return;
    }
    hasRefreshed = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) {
          return;
        }
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    })
    .catch(() => {
      // Silent fail: app can still run without offline caching.
    });
}

function getPageVersion() {
  const timestamp = getPageTimestamp();
  if (!timestamp) {
    return "base";
  }
  return `v${formatVersionLabel(timestamp)}`;
}

function renderBuildInfo() {
  if (!appVersionText || !appUpdatedAtText) {
    return;
  }
  const timestamp = getPageTimestamp();
  if (!timestamp) {
    appVersionText.textContent = "版本：vbase";
    appUpdatedAtText.textContent = "更新时间：未知";
    return;
  }

  appVersionText.textContent = `版本：v${formatVersionLabel(timestamp)}`;
  appUpdatedAtText.textContent = `更新时间：${formatUpdatedAt(timestamp)}`;
  if (appEnvironmentText) {
    appEnvironmentText.textContent = `环境：${getEnvironmentLabel()}`;
  }
}

function getPageTimestamp() {
  const modified = document.lastModified;
  if (!modified || modified === "01/01/1970 00:00:00") {
    return null;
  }

  const timestamp = Date.parse(modified);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return null;
  }
  return timestamp;
}

function formatVersionLabel(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

function formatUpdatedAt(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getEnvironmentLabel() {
  if (location.protocol.startsWith("http")) {
    return `线上 ${location.host}`;
  }
  return "本地文件 file://";
}

function renderHistory(items) {
  historyList.innerHTML = "";
  if (!items.length) {
    historyList.innerHTML = '<div class="empty">没有找到记录。</div>';
    return;
  }

  items.forEach((session) => {
    const card = document.createElement("article");
    const weightText = session.weight ? ` · 体重 ${formatWeight(session.weight)}` : "";
    card.className = "session-card";
    card.innerHTML = `
      <div class="session-header">
        <div>
          <strong>${formatDate(session.date)}</strong>
          <div>${session.exercises.length} 个动作${escapeHtml(weightText)}</div>
        </div>
        <div class="session-actions">
          <button type="button" data-action="edit">编辑</button>
          <button class="delete-btn" type="button" data-action="delete">删除</button>
        </div>
      </div>
      <table class="exercise-table">
        <thead>
          <tr>
            <th>动作</th>
            <th>重量</th>
            <th>次数</th>
          </tr>
        </thead>
        <tbody>
          ${session.exercises
            .map(
              (exercise) => `
                <tr>
                  <td>${escapeHtml(exercise.name)}</td>
                  <td>${escapeHtml(exercise.weight || "-")}</td>
                  <td>${escapeHtml(exercise.reps || "-")}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      ${session.note ? `<div class="note">${escapeHtml(session.note)}</div>` : ""}
    `;

    card.querySelector('[data-action="edit"]').addEventListener("click", () => editSession(session.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSession(session.id));
    historyList.appendChild(card);
  });
}

function formatDate(value) {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return value;
  }
  return `${parsed.getMonth() + 1}.${parsed.getDate()} ${parsed.getFullYear()}`;
}

function formatWeight(value) {
  return `${normalizeWeight(value)}kg`;
}

function exportData() {
  const text = buildPlainTextExport();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workout-log-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPlainTextExport() {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lines = [];

  sorted.forEach((session, sessionIndex) => {
    lines.push(formatDateShort(session.date));

    session.exercises.forEach((exercise) => {
      lines.push(`• ${formatExerciseLine(exercise)}`);
    });

    if (session.weight) {
      lines.push(`• 体重${formatWeight(session.weight)}`);
    }

    if (session.note) {
      lines.push(`• 备注：${session.note}`);
    }

    if (sessionIndex !== sorted.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

function formatExerciseLine(exercise) {
  const name = (exercise.name || "").trim();
  const weight = (exercise.weight || "").trim();
  const reps = normalizeExportReps(exercise.reps || "");

  if (name && weight && reps) {
    return `${name}${weight}${reps}`;
  }
  if (name && weight) {
    return `${name}${weight}`;
  }
  if (name && reps) {
    return `${name}${reps}`;
  }
  if (weight && reps) {
    return `${weight}${reps}`;
  }
  return name || weight || reps || "-";
}

function normalizeExportReps(reps) {
  return String(reps).replaceAll("/", "+").trim();
}

function formatDateShort(value) {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return value;
  }
  return `${parsed.getMonth() + 1}.${parsed.getDate()}`;
}

function handleImportFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const payload = normalizeImportPayload(parsed);
      if (!payload.sessions.length) {
        alert("导入文件里没有可用训练记录。");
        return;
      }
      const result = mergeImportedData(payload);
      alert(buildImportSummaryMessage(result, "JSON 导入完成"));
    } catch {
      alert("导入失败：文件格式不是有效 JSON。");
    } finally {
      importFileInput.value = "";
    }
  };
  reader.onerror = () => {
    alert("导入失败：读取文件时出错。");
    importFileInput.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function handleBulkFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || "").trim();
    if (!text) {
      alert("上传文件为空，无法导入。");
      bulkFileInput.value = "";
      return;
    }

    bulkInput.value = text;
    const parsedSessions = parseBulkTextToSessions(text, { fileName: file.name });
    if (!parsedSessions.length) {
      alert("文件已读取，但没有解析到可导入记录。请检查文本格式。");
      bulkFileInput.value = "";
      return;
    }

    const result = mergeImportedData({ meta: null, sessions: parsedSessions });
    alert(buildImportSummaryMessage(result, "文件导入完成"));
    bulkFileInput.value = "";
  };
  reader.onerror = () => {
    alert("读取文件失败，请重试。");
    bulkFileInput.value = "";
  };
  reader.readAsText(file, "utf-8");
}

async function handleVersionSync() {
  if (!location.protocol.startsWith("http")) {
    alert("当前是本地文件模式。请通过线上链接打开后再检查更新。");
    return;
  }
  if (!("serviceWorker" in navigator)) {
    window.location.reload();
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }
  } finally {
    window.location.reload();
  }
}

function normalizeImportPayload(parsed) {
  const sourceMeta = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed.meta : null;
  const sourceSessions = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray(parsed.sessions)
      ? parsed.sessions
      : [];

  const normalizedSessions = sourceSessions
    .map((session) => normalizeSession(session))
    .filter((session) => session !== null);

  return {
    meta: normalizeMeta(sourceMeta),
    sessions: normalizedSessions
  };
}

function normalizeMeta(rawMeta) {
  if (!rawMeta || typeof rawMeta !== "object") {
    return null;
  }
  return {
    trackWeight: Boolean(rawMeta.trackWeight),
    trackQuit: Boolean(rawMeta.trackQuit),
    quitStartDate: typeof rawMeta.quitStartDate === "string" ? rawMeta.quitStartDate : ""
  };
}

function normalizeSession(rawSession) {
  if (!rawSession || typeof rawSession !== "object") {
    return null;
  }

  const dateText = typeof rawSession.date === "string" ? rawSession.date.trim() : "";
  if (!parseDateOnly(dateText)) {
    return null;
  }

  const rawExercises = Array.isArray(rawSession.exercises) ? rawSession.exercises : [];
  const exercises = rawExercises
    .map((exercise) => normalizeExercise(exercise))
    .filter((exercise) => exercise !== null);
  const dedupedExercises = dedupeExercises(exercises);
  if (!dedupedExercises.length) {
    return null;
  }

  const normalized = {
    id: crypto.randomUUID(),
    date: dateText,
    note: typeof rawSession.note === "string" ? rawSession.note.trim() : "",
    exercises: dedupedExercises
  };

  const weightValue = normalizeWeight(rawSession.weight ?? "");
  if (weightValue) {
    normalized.weight = weightValue;
  }

  return normalized;
}

function normalizeExercise(rawExercise) {
  if (!rawExercise || typeof rawExercise !== "object") {
    return null;
  }
  const name = typeof rawExercise.name === "string" ? rawExercise.name.trim() : "";
  const weight = typeof rawExercise.weight === "string" ? rawExercise.weight.trim() : "";
  const reps = normalizeReps(typeof rawExercise.reps === "string" ? rawExercise.reps : "");
  if (!name && !weight && !reps) {
    return null;
  }
  return { name, weight, reps };
}

function mergeImportedData(payload) {
  const result = {
    importedSessions: payload.sessions.length,
    addedDays: 0,
    addedExercises: 0,
    updatedWeights: 0,
    updatedNotes: 0,
    skippedSessions: 0,
    skippedExercises: 0
  };

  if (payload.meta) {
    meta = {
      ...meta,
      ...payload.meta
    };
    persistMeta();
    hydrateOptionalState();
  }

  payload.sessions.forEach((importedSession) => {
    let sessionChanged = false;
    const existing = sessions.find((session) => session.date === importedSession.date);
    if (!existing) {
      sessions.push(importedSession);
      result.addedDays += 1;
      result.addedExercises += importedSession.exercises.length;
      return;
    }

    const existingSignatures = new Set(
      existing.exercises.map((exercise) => buildExerciseSignature(exercise))
    );
    importedSession.exercises.forEach((exercise) => {
      const signature = buildExerciseSignature(exercise);
      if (!existingSignatures.has(signature)) {
        existing.exercises.push(exercise);
        existingSignatures.add(signature);
        sessionChanged = true;
        result.addedExercises += 1;
      } else {
        result.skippedExercises += 1;
      }
    });

    if (!existing.weight && importedSession.weight) {
      existing.weight = importedSession.weight;
      sessionChanged = true;
      result.updatedWeights += 1;
    }
    if (importedSession.note) {
      const mergedNote = mergeNotes(existing.note, importedSession.note);
      if (mergedNote !== existing.note) {
        existing.note = mergedNote;
        sessionChanged = true;
        result.updatedNotes += 1;
      }
    }

    if (!sessionChanged) {
      result.skippedSessions += 1;
    }
  });

  persistSessions();
  render();
  return result;
}

function handleBulkImport() {
  const text = bulkInput.value.trim();
  if (!text) {
    alert("请先粘贴要导入的训练文本。");
    return;
  }

  const parsedSessions = parseBulkTextToSessions(text);
  if (!parsedSessions.length) {
    alert("没有解析到可导入的训练数据，请检查文本格式。");
    return;
  }

  const result = mergeImportedData({ meta: null, sessions: parsedSessions });
  bulkInput.value = "";
  alert(buildImportSummaryMessage(result, "批量导入完成"));
}

function parseBulkTextToSessions(text, options = {}) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dateRange =
    parseDateRangeFromName(options.fileName || "") ||
    parseDateRangeFromName(lines[0] || "");
  const trend = inferBulkDateTrend(lines);
  const sessionsByDate = new Map();
  let currentDate = "";
  let lastExerciseName = "";
  const dateCtx = {
    trend,
    currentYear: null,
    previousDate: "",
    range: dateRange
  };

  lines.forEach((line) => {
    if (shouldSkipBulkLine(line)) {
      return;
    }

    const parsedDate = parseBulkDateLine(line, dateCtx);
    if (parsedDate) {
      currentDate = parsedDate.date;
      lastExerciseName = "";
      if (!sessionsByDate.has(currentDate)) {
        sessionsByDate.set(currentDate, {
          id: crypto.randomUUID(),
          date: currentDate,
          note: "",
          exercises: []
        });
      }
      if (parsedDate.rest) {
        const firstEntry = cleanExerciseLine(parsedDate.rest);
        if (firstEntry) {
          const parsed = parseExerciseFromLine(firstEntry, lastExerciseName);
          if (parsed) {
            lastExerciseName = parsed.name || lastExerciseName;
            sessionsByDate.get(currentDate).exercises.push({
              name: parsed.name,
              weight: parsed.weight,
              reps: parsed.reps
            });
          }
        }
      }
      return;
    }

    const cleaned = cleanExerciseLine(line);
    if (!cleaned) {
      return;
    }

    if (!currentDate) {
      return;
    }

    const parsed = parseExerciseFromLine(cleaned, lastExerciseName);
    if (!parsed) {
      return;
    }
    lastExerciseName = parsed.name || lastExerciseName;
    sessionsByDate.get(currentDate).exercises.push({
      name: parsed.name,
      weight: parsed.weight,
      reps: parsed.reps
    });
  });

  return [...sessionsByDate.values()]
    .map((session) => normalizeSession(session))
    .filter((session) => session !== null);
}

function cleanExerciseLine(line) {
  return line.replace(/^[•*·\-]+\s*/, "").trim();
}

function shouldSkipBulkLine(line) {
  if (!line) {
    return true;
  }
  if (/^#+\s*/.test(line)) {
    return true;
  }
  if (/^日记$/i.test(line)) {
    return true;
  }
  if (/^\d{4}[./]\d{1,2}[./]\d{1,2}\s*-\s*\d{4}[./]\d{1,2}(?:[./]\d{1,2})?$/.test(line)) {
    return true;
  }
  return false;
}

function inferBulkDateTrend(lines) {
  const series = [];
  lines.forEach((line) => {
    const token = parseBulkDateToken(line);
    if (!token) {
      return;
    }
    series.push(token.month * 100 + token.day);
  });

  let inc = 0;
  let dec = 0;
  for (let i = 1; i < series.length; i += 1) {
    if (series[i] > series[i - 1]) {
      inc += 1;
    } else if (series[i] < series[i - 1]) {
      dec += 1;
    }
  }
  return inc > dec ? "asc" : "desc";
}

function parseBulkDateToken(line) {
  const match = line.match(
    /^(?:(\d{4})[./-])?(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?(?:\s+(\d{4}))?[。.\s]*(.*)$/
  );
  if (!match) {
    return null;
  }

  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  let year = null;
  if (match[1]) {
    year = Number(match[1]);
  } else if (match[4]) {
    year = Number(match[4]);
  } else if (match[5]) {
    year = Number(match[5]);
  }
  if (year !== null && year < 100) {
    year += 2000;
  }

  return {
    year,
    month,
    day,
    rest: (match[6] || "").trim()
  };
}

function parseBulkDateLine(line, ctx) {
  const token = parseBulkDateToken(line);
  if (!token) {
    return null;
  }

  let year = token.year;
  if (!year) {
    year = inferYearForBulkDate(token.month, token.day, ctx);
  }

  const isoDate = `${year}-${String(token.month).padStart(2, "0")}-${String(token.day).padStart(2, "0")}`;
  if (!parseDateOnly(isoDate)) {
    return null;
  }
  if (ctx.range && !isDateInRange(isoDate, ctx.range)) {
    return null;
  }

  ctx.currentYear = year;
  ctx.previousDate = isoDate;
  return { date: isoDate, rest: token.rest };
}

function inferYearForBulkDate(month, day, ctx) {
  const now = new Date();
  const defaultYear = ctx.currentYear ?? now.getFullYear();
  const candidateYears = getCandidateYearsForBulk(ctx.range, defaultYear);
  const candidates = candidateYears
    .map((year) => ({
      year,
      iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }))
    .filter((item) => parseDateOnly(item.iso))
    .filter((item) => !ctx.range || isDateInRange(item.iso, ctx.range));

  if (!candidates.length) {
    return defaultYear;
  }

  if (!ctx.previousDate) {
    if (ctx.range) {
      return ctx.trend === "asc" ? candidates[0].year : candidates[candidates.length - 1].year;
    }
    return candidates[0].year;
  }

  const previousMs = Date.parse(ctx.previousDate);
  const ranked = candidates
    .map((item) => ({
      ...item,
      diff: Date.parse(item.iso) - previousMs
    }))
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

  if (ctx.trend === "desc") {
    const preferred = ranked.filter((item) => item.diff <= 0);
    return (preferred[0] || ranked[0]).year;
  }
  const preferred = ranked.filter((item) => item.diff >= 0);
  return (preferred[0] || ranked[0]).year;
}

function getCandidateYearsForBulk(range, fallbackYear) {
  if (!range) {
    return [fallbackYear - 1, fallbackYear, fallbackYear + 1];
  }
  const years = [];
  for (let year = range.startYear; year <= range.endYear; year += 1) {
    years.push(year);
  }
  return years;
}

function parseDateRangeFromName(text) {
  const normalized = String(text || "").replace(/\s+/g, "");
  const match = normalized.match(
    /(\d{4})[.\-\/](\d{1,2})(?:[.\-\/](\d{1,2}))?\s*-\s*(\d{4})[.\-\/](\d{1,2})(?:[.\-\/](\d{1,2}))?/
  );
  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const startMonth = Number(match[2]);
  const startDay = Number(match[3] || 1);
  const endYear = Number(match[4]);
  const endMonth = Number(match[5]);
  const endDay = Number(match[6] || daysInMonth(endYear, endMonth));

  const startDate = `${startYear}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  if (!parseDateOnly(startDate) || !parseDateOnly(endDate)) {
    return null;
  }
  if (Date.parse(startDate) > Date.parse(endDate)) {
    return null;
  }

  return {
    startYear,
    endYear,
    startDate,
    endDate
  };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function isDateInRange(isoDate, range) {
  const time = Date.parse(isoDate);
  return time >= Date.parse(range.startDate) && time <= Date.parse(range.endDate);
}

function parseExerciseFromLine(line, fallbackName) {
  const weightMatch = line.match(/(\d+(?:\.\d+)?)\s*kg/i);
  let name = "";
  let weight = "";
  let reps = "";

  if (weightMatch && weightMatch.index !== undefined) {
    const before = line.slice(0, weightMatch.index).trim();
    const after = line.slice(weightMatch.index + weightMatch[0].length).trim();
    name = before || fallbackName;
    weight = `${weightMatch[1]}kg`;
    reps = normalizeReps((after.match(/[\d+\s/]+/) || [""])[0]);
  } else {
    const repsTail = line.match(/(\d+(?:\s*[+/]\s*\d+)*)\s*$/);
    if (repsTail && repsTail.index !== undefined) {
      name = line.slice(0, repsTail.index).trim() || fallbackName;
      reps = normalizeReps(repsTail[1]);
    } else {
      name = line.trim() || fallbackName;
    }
  }

  if (!name) {
    return null;
  }

  return { name, weight, reps };
}

function buildExerciseSignature(exercise) {
  return [
    (exercise.name || "").trim(),
    (exercise.weight || "").trim(),
    normalizeReps(exercise.reps || "")
  ].join("|");
}

function dedupeExercises(exercises) {
  const signatures = new Set();
  const result = [];
  exercises.forEach((exercise) => {
    const signature = buildExerciseSignature(exercise);
    if (!signatures.has(signature)) {
      signatures.add(signature);
      result.push(exercise);
    }
  });
  return result;
}

function buildImportSummaryMessage(stats, title) {
  if (stats.addedDays === 0 && stats.addedExercises === 0 && stats.updatedWeights === 0 && stats.updatedNotes === 0) {
    return `${title}：没有新增，已跳过重复记录（跳过日期 ${stats.skippedSessions}，跳过动作 ${stats.skippedExercises}）。`;
  }

  return `${title}：新增日期 ${stats.addedDays} 天，新增动作 ${stats.addedExercises} 条，更新体重 ${stats.updatedWeights} 条，补充备注 ${stats.updatedNotes} 条，跳过重复动作 ${stats.skippedExercises} 条。`;
}

function mergeNotes(base, extra) {
  const a = (base || "").trim();
  const b = (extra || "").trim();
  if (!a) {
    return b;
  }
  if (!b || a.includes(b)) {
    return a;
  }
  return `${a} | ${b}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
