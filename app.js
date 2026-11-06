"use strict";
const $ = id => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

function showNotice(id, message, ok = false) {
  const box = $(id);
  box.textContent = message;
  box.className = "notice " + (ok ? "ok" : "err");
}

$("createForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("createBtn");
  button.disabled = true;
  try {
    const payload = {
      name: $("name").value.trim(),
      login: $("login").value.trim(),
      server: $("server").value.trim(),
      password: $("password").value,
      balance: Number($("balance").value),
      currency: $("currency").value,
      demo: $("demo").value === "1"
    };
    const result = await api("/api/admin/create-user", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    showNotice("createNotice", `Created account ${result.user.login} for ${result.user.name}. Starting balance: ${result.user.currency} ${Number(result.user.balance).toLocaleString()}.`, true);
    $("password").value = "";
    await loadUsers();
  } catch (error) {
    showNotice("createNotice", error.message);
  } finally {
    button.disabled = false;
  }
});

async function loadUsers() {
  const data = await api("/api/admin/users");
  const body = $("usersBody");
  body.replaceChildren();
  if (!Array.isArray(data.users) || !data.users.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = "No accounts found.";
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  for (const user of data.users) {
    const row = document.createElement("tr");
    const values = [
      user.id, user.login, user.name, user.server,
      `${user.currency} ${Number(user.balance).toLocaleString()}`,
      user.demo ? "Demo" : "Live-labelled",
      user.status
    ];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = String(value ?? "");
      row.appendChild(cell);
    }

    const actionCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.max = "1000000000000";
    input.value = Number(user.balance);
    input.setAttribute("aria-label", `New balance for account ${user.id}`);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Save";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await api("/api/admin/update-balance", {
          method: "PATCH",
          body: JSON.stringify({ id: user.id, balance: Number(input.value) })
        });
        showNotice("listNotice", `Updated balance for login ${user.login}.`, true);
        await loadUsers();
      } catch (error) {
        showNotice("listNotice", error.message);
      } finally {
        button.disabled = false;
      }
    });
    actionCell.append(input, document.createTextNode(" "), button);
    row.appendChild(actionCell);
    body.appendChild(row);
  }
}

$("loadBtn").addEventListener("click", async () => {
  const button = $("loadBtn");
  button.disabled = true;
  try {
    await loadUsers();
    showNotice("connectionNotice", "Connected. Account list loaded.", true);
  } catch (error) {
    showNotice("connectionNotice", error.message);
  } finally {
    button.disabled = false;
  }
});
