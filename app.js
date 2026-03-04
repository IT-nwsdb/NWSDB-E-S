// Dead Simple Project Entry
// - No search, no filters, no expand/collapse
// - Click a blue project row to select it
// - + Row adds an activity under selected project
// - Auto-saves on typing + Save button (manual)

const STORAGE_KEY = "dead_simple_project_entry_v1";
const body = document.getElementById("body");

const $ = (id) => document.getElementById(id);

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
}

function toast(text, type="secondary") {
  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${type} border-0 show`;
  el.role = "alert";
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(text)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>
    </div>
  `;
  $("msg").appendChild(el);
  el.querySelector("button").onclick = () => el.remove();
  setTimeout(() => el.remove(), 1600);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// autosize textareas (activity name)
function autosizeTextarea(el){
  if(!el || el.tagName !== "TEXTAREA") return;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight) + "px";
}

function numOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function defaultState() {
  return {
    selectedProjectId: null,
    projects: [
      {
        id: uid(),
        name: "Addl.GM/C/NWS/Sab/WSP/E&S/LAB/2025",
        activities: [
          {
            id: uid(),
            name: "Purchasing of Lab Equipment for Regional Labs and Water Reclamation Division - Addl.GM/C/NW/SAB/LAB/2025",
            contract: null, alloc2026: null,
            start: "", end: "",
            cumLastMonth: null,
            cumCurrentMonth: null}
        ]
      }
    ]
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.projects)) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function save(silent=true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!silent) toast("Saved", "success");
}

function render() {
  body.innerHTML = "";

  if (state.projects.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" class="text-center text-muted py-4">No projects yet. Click <b>+ Project</b> to start.</td>`;
    body.appendChild(tr);
    return;
  }

  for (const p of state.projects) {
    // project row
    const pr = document.createElement("tr");
    pr.className = "project-row" + (state.selectedProjectId === p.id ? " selected" : "");
    pr.dataset.projectId = p.id;

    pr.innerHTML = `
      <td colspan="8">
        <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <span class="badge text-bg-light">PROJECT</span>
            <input class="form-control form-control-sm" style="max-width: 820px;" value="${escapeHtml(p.name)}" data-project-name="${p.id}" />
          </div>
          <div class="d-flex align-items-center gap-2"><div class="small opacity-75">${p.activities.length} row(s)</div><button class="btn btn-sm btn-light" data-action="deleteProject">Delete Project</button></div>
        </div>
      </td>
    `;
    body.appendChild(pr);

    // activities
    for (const a of p.activities) {
      // Backward-compat: ensure new fields exist on older saved data
      if (a.cumLastMonth === undefined) a.cumLastMonth = null;
      if (a.cumCurrentMonth === undefined) a.cumCurrentMonth = null;
      const ar = document.createElement("tr");
      ar.dataset.projectId = p.id;
      ar.dataset.activityId = a.id;

      ar.innerHTML = `
        <td class="wrap activity-name"><textarea data-field="name" rows="2" placeholder="Sub project / activity" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</textarea></td>
        <td class="text-end"><input data-field="contract" type="number" step="0.01" value="${a.contract ?? ""}" class="text-end"></td>
        <td class="text-end"><input data-field="alloc2026" type="number" step="0.01" value="${a.alloc2026 ?? ""}" class="text-end"></td>
        <td><input data-field="start" type="date" value="${a.start ?? ""}"></td>
        <td><input data-field="end" type="date" value="${a.end ?? ""}"></td>
        <td class="text-end"><input data-field="cumLastMonth" type="number" step="0.01" value="${a.cumLastMonth ?? ""}" class="text-end" placeholder=""></td>
        <td class="text-end"><input data-field="cumCurrentMonth" type="number" step="0.01" value="${a.cumCurrentMonth ?? ""}" class="text-end" placeholder=""></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" data-action="deleteRow">X</button>
        </td>
      `;
      body.appendChild(ar);
    }
  }

  // autosize all textareas so long text is visible
  body.querySelectorAll('textarea').forEach(autosizeTextarea);
}

// ----- Actions -----
function addProject() {
  const p = { id: uid(), name: "New Project", activities: [] };
  state.projects.push(p);
  state.selectedProjectId = p.id;
  save(true);
  render();
  toast("Project added", "primary");
}

function addRowUnderSelected() {
  const pid = state.selectedProjectId || state.projects[state.projects.length - 1]?.id;
  const p = state.projects.find(x => x.id === pid);
  if (!p) return toast("Add a project first", "danger");

  p.activities.push({
    id: uid(),
    name: "",
    contract: null, alloc2026: null,
    start: "", end: "",
            cumLastMonth: null,
            cumCurrentMonth: null});

  state.selectedProjectId = p.id;
  save(true);
  render();
}

function deleteRow(projectId, activityId) {
  const p = state.projects.find(x => x.id === projectId);
  if (!p) return;
  p.activities = p.activities.filter(a => a.id !== activityId);
  save(true);
  render();
}

function deleteProject(projectId) {
  const idx = state.projects.findIndex(p => p.id === projectId);
  if (idx === -1) return;

  // Remove the project
  state.projects.splice(idx, 1);

  // Keep selection sensible
  if (state.selectedProjectId === projectId) {
    const next = state.projects[idx] || state.projects[idx - 1] || null;
    state.selectedProjectId = next ? next.id : null;
  }

  save(true);
  render();
  toast("Project deleted", "warning");
}

function resetAll() {
  if (!confirm("Reset everything?")) return;
  state = defaultState();
  save(true);
  render();
  toast("Reset done", "warning");
}

// ----- Event handlers -----
document.getElementById("btnAddProject").addEventListener("click", addProject);
document.getElementById("btnAddRow").addEventListener("click", addRowUnderSelected);
document.getElementById("btnSave").addEventListener("click", () => save(false));
document.getElementById("btnReset").addEventListener("click", resetAll);

// select project when clicking blue row (but ignore click on input)
body.addEventListener("click", (e) => {
  const tr = e.target.closest("tr.project-row");
  if (!tr) return;
  if (e.target.matches("input")) return;
  state.selectedProjectId = tr.dataset.projectId;
  save(true);
  render();
});

// delete row button
body.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='deleteRow']");
  if (!btn) return;
  const tr = btn.closest("tr");
  const pid = tr.dataset.projectId;
  const aid = tr.dataset.activityId;
  if (confirm("Delete this row?")) deleteRow(pid, aid);
});

// delete project button
body.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='deleteProject']");
  if (!btn) return;
  const tr = btn.closest("tr.project-row");
  const pid = tr?.dataset?.projectId;
  if (!pid) return;
  if (confirm("Delete this project and all its rows?")) deleteProject(pid);
});

// typing updates state (auto-save)
body.addEventListener("input", (e) => {
  autosizeTextarea(e.target);

  // project name edit
  const pn = e.target.getAttribute("data-project-name");
  if (pn) {
    const p = state.projects.find(x => x.id === pn);
    if (p) {
      p.name = e.target.value;
      state.selectedProjectId = p.id;
      save(true);
    }
    return;
  }

  // activity fields
  const tr = e.target.closest("tr");
  if (!tr || !tr.dataset.activityId) return;

  const pid = tr.dataset.projectId;
  const aid = tr.dataset.activityId;
  const p = state.projects.find(x => x.id === pid);
  if (!p) return;
  const a = p.activities.find(x => x.id === aid);
  if (!a) return;

  const field = e.target.getAttribute("data-field");

  if (field) {
    if (["contract","alloc2026","cumLastMonth","cumCurrentMonth"].includes(field)) a[field] = numOrNull(e.target.value);
    else a[field] = e.target.value;
    // keep tooltip updated for long text fields
    if (field === "name") e.target.title = e.target.value;
    save(true);
    return;
  }
});

// init: select first project
(function init() {
  if (!state.selectedProjectId && state.projects[0]) state.selectedProjectId = state.projects[0].id;
  save(true);
  render();
})();
