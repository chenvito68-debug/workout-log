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
const importFileInput = document.querySelector("#importFileInput");
const bulkInput = document.querySelector("#bulkInput");
const bulkImportBtn = document.querySelector("#bulkImportBtn");
const bulkFileInput = document.querySelector("#bulkFileInput");
const bulkClearBtn = document.querySelector("#bulkClearBtn");

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
  navigator.serviceWorker.register(swUrl).catch(() => {
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
      mergeImportedData(payload);
      alert(`导入完成：新增 ${payload.sessions.length} 条训练记录。`);
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
    const parsedSessions = parseBulkTextToSessions(text);
    if (!parsedSessions.length) {
      alert("文件已读取，但没有解析到可导入记录。请检查文本格式。");
      bulkFileInput.value = "";
      return;
    }

    mergeImportedData({ meta: null, sessions: parsedSessions });
    alert(`文件导入完成：新增 ${parsedSessions.length} 条训练记录。`);
    bulkFileInput.value = "";
  };
  reader.onerror = () => {
    alert("读取文件失败，请重试。");
    bulkFileInput.value = "";
  };
  reader.readAsText(file, "utf-8");
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
  if (!exercises.length) {
    return null;
  }

  const normalized = {
    id: crypto.randomUUID(),
    date: dateText,
    note: typeof rawSession.note === "string" ? rawSession.note.trim() : "",
    exercises
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
  if (payload.meta) {
    meta = {
      ...meta,
      ...payload.meta
    };
    persistMeta();
    hydrateOptionalState();
  }

  sessions = [...payload.sessions, ...sessions];
  persistSessions();
  render();
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

  mergeImportedData({ meta: null, sessions: parsedSessions });
  bulkInput.value = "";
  alert(`导入完成：新增 ${parsedSessions.length} 条训练记录。`);
}

function parseBulkTextToSessions(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sessionsByDate = new Map();
  let currentDate = "";
  let lastExerciseName = "";

  lines.forEach((line) => {
    const dateText = parseLooseDate(line);
    if (dateText) {
      currentDate = dateText;
      lastExerciseName = "";
      if (!sessionsByDate.has(currentDate)) {
        sessionsByDate.set(currentDate, {
          id: crypto.randomUUID(),
          date: currentDate,
          note: "",
          exercises: []
        });
      }
      return;
    }

    const cleaned = cleanExerciseLine(line);
    if (!cleaned) {
      return;
    }

    if (!currentDate) {
      currentDate = new Date().toISOString().slice(0, 10);
      sessionsByDate.set(currentDate, {
        id: crypto.randomUUID(),
        date: currentDate,
        note: "",
        exercises: []
      });
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

function parseLooseDate(line) {
  const match = line.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (!match) {
    return "";
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const explicitYear = match[3] ? Number(match[3]) : null;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return "";
  }

  let year = explicitYear;
  if (year !== null && year < 100) {
    year += 2000;
  }
  if (year === null) {
    const now = new Date();
    year = now.getFullYear();
    const candidate = new Date(year, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (candidate > today) {
      year -= 1;
    }
  }

  const date = new Date(year, month - 1, day);
  if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
