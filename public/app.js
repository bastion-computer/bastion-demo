const state = {
  issues: [],
  filter: "all",
};

const issueList = document.querySelector("#issue-list");
const form = document.querySelector("#issue-form");
const formError = document.querySelector("#form-error");
const statusFilter = document.querySelector("#status-filter");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  const response = await fetch("/api/issues", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json();
    formError.textContent = body.error ?? "Unable to create issue";
    return;
  }

  form.reset();
  await loadIssues();
});

statusFilter.addEventListener("change", () => {
  state.filter = statusFilter.value;
  renderIssues();
});

issueList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  const issue = state.issues.find((candidate) => candidate.id === id);

  if (!issue) {
    return;
  }

  if (action === "delete") {
    await fetch(`/api/issues/${id}`, { method: "DELETE" });
    await loadIssues();
    return;
  }

  const status = nextStatus(issue.status);
  await fetch(`/api/issues/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await loadIssues();
});

await loadIssues();

async function loadIssues() {
  const [issuesResponse, statsResponse] = await Promise.all([fetch("/api/issues"), fetch("/api/stats")]);
  const issueBody = await issuesResponse.json();
  const stats = await statsResponse.json();

  state.issues = issueBody.issues;
  document.querySelector("#total-count").textContent = stats.total;
  document.querySelector("#open-count").textContent = stats.open;
  document.querySelector("#done-count").textContent = stats.done;
  renderIssues();
}

function renderIssues() {
  const visibleIssues = state.filter === "all" ? state.issues : state.issues.filter((issue) => issue.status === state.filter);

  if (visibleIssues.length === 0) {
    issueList.innerHTML = '<p class="empty">No issues match this filter.</p>';
    return;
  }

  issueList.innerHTML = visibleIssues.map(renderIssue).join("");
}

function renderIssue(issue) {
  return `
    <article class="issue-card priority-${issue.priority}">
      <div>
        <p class="issue-meta">${issue.id} · ${label(issue.status)} · ${label(issue.priority)}</p>
        <h3>${escapeHtml(issue.title)}</h3>
        <p>${escapeHtml(issue.description || "No description yet.")}</p>
        ${issue.assignee ? `<span class="assignee">${escapeHtml(issue.assignee)}</span>` : ""}
      </div>
      <div class="card-actions">
        <button type="button" data-action="advance" data-id="${issue.id}">${advanceLabel(issue.status)}</button>
        <button type="button" class="ghost" data-action="delete" data-id="${issue.id}">Delete</button>
      </div>
    </article>
  `;
}

function nextStatus(status) {
  if (status === "todo") {
    return "in-progress";
  }

  if (status === "in-progress") {
    return "done";
  }

  return "todo";
}

function advanceLabel(status) {
  if (status === "done") {
    return "Reopen";
  }

  return "Advance";
}

function label(value) {
  return value.replace("-", " ");
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}
