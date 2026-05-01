const state = {
  token: localStorage.getItem("nextt_token"),
  user: null,
  account: null,
  transactions: [],
  card: JSON.parse(localStorage.getItem("nextt_card") || "{\"limit\":8000,\"invoice\":1820,\"blocked\":false}"),
  investments: JSON.parse(localStorage.getItem("nextt_investments") || "[]"),
  loans: JSON.parse(localStorage.getItem("nextt_loans") || "[]"),
  favorites: JSON.parse(localStorage.getItem("nextt_favorites") || "[]"),
  notifications: JSON.parse(localStorage.getItem("nextt_notifications") || "[]"),
  hideBalance: localStorage.getItem("nextt_hide_balance") === "true",
  demoMode: false,
};

const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const loginForm = document.querySelector("#loginForm");
const loginResult = document.querySelector("#loginResult");
const transactionList = document.querySelector("#transactionList");
const navItems = document.querySelectorAll(".nav-item");
const mobileTabs = document.querySelectorAll(".mobile-tab");
const views = document.querySelectorAll(".view");
const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector(".menu-button");
const simulateButton = document.querySelector("#simulateOperation");
const operationResult = document.querySelector("#operationResult");
const logoutButton = document.querySelector("#logoutButton");
const themeButton = document.querySelector("#themeButton");
const hideBalanceButton = document.querySelector("#hideBalanceButton");
const transactionSearch = document.querySelector("#transactionSearch");
const transactionFilter = document.querySelector("#transactionFilter");
const receiptButton = document.querySelector("#receiptButton");
const pdfReceiptButton = document.querySelector("#pdfReceiptButton");
const registerButton = document.querySelector("#registerButton");
const resetPasswordButton = document.querySelector("#resetPasswordButton");
const openAccountButton = document.querySelector("#openAccountButton");
const twoFactorButton = document.querySelector("#twoFactorButton");
const fraudButton = document.querySelector("#fraudButton");
const exportCsvButton = document.querySelector("#exportCsvButton");
const serverCsvButton = document.querySelector("#serverCsvButton");
const printReportButton = document.querySelector("#printReportButton");
const cardPurchaseButton = document.querySelector("#cardPurchaseButton");
const invoicePaymentButton = document.querySelector("#invoicePaymentButton");
const loanSimulateButton = document.querySelector("#loanSimulateButton");
const loanRequestButton = document.querySelector("#loanRequestButton");
const investmentApplyButton = document.querySelector("#investmentApplyButton");
const investmentRedeemButton = document.querySelector("#investmentRedeemButton");
const loadingOverlay = document.querySelector("#loadingOverlay");
const toastStack = document.querySelector("#toastStack");

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Servidor offline. Use o modo demo local ou rode npm start.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Erro inesperado.");
  return data;
}

function saveLocal() {
  localStorage.setItem("nextt_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("nextt_notifications", JSON.stringify(state.notifications.slice(0, 12)));
  localStorage.setItem("nextt_hide_balance", String(state.hideBalance));
  localStorage.setItem("nextt_card", JSON.stringify(state.card));
  localStorage.setItem("nextt_investments", JSON.stringify(state.investments));
  localStorage.setItem("nextt_loans", JSON.stringify(state.loans));
}

function pushNotification(text) {
  state.notifications.unshift({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() });
  state.notifications = state.notifications.slice(0, 12);
  saveLocal();
  renderNotifications();
}

function loadDemoData(role = "cliente", name = null, email = null) {
  const isAdmin = role === "admin";
  state.demoMode = true;
  state.token = "demo-token";
  state.user = {
    id: isAdmin ? "usr_admin_demo" : "usr_client_demo",
    name: name || (isAdmin ? "Admin Nexttt" : "Cliente Demo"),
    email: email || (isAdmin ? "admin@nextt.local" : "cliente@nextt.local"),
    role: isAdmin ? "admin" : "cliente",
  };
  state.account = {
    id: "acc_demo",
    userId: state.user.id,
    number: "0001-8840",
    type: "corrente",
    status: "Ativa",
    dailyLimit: 10000,
    usedToday: 0,
    balance: 18420.75,
  };
  state.transactions = [
    demoTransaction("deposit", 2000, "Deposito validado", 0),
    demoTransaction("transfer", -320, "Transferencia enviada", 28),
    demoTransaction("card", -89.9, "Compra no cartao", 420),
  ];
  renderShell();
  renderDashboard();
  renderProfile();
  renderNotifications();
  renderInvestments();
  renderCard();
}

function demoTransaction(type, amount, description, minutesAgo) {
  return {
    id: crypto.randomUUID(),
    accountId: "acc_demo",
    type,
    amount,
    description,
    createdAt: new Date(Date.now() - 1000 * 60 * minutesAgo).toISOString(),
  };
}

function setResult(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
  showToast(message, isError);
}

function setLoading(isLoading) {
  loadingOverlay.classList.toggle("hidden", !isLoading);
}

function showToast(message, isError = false) {
  if (!toastStack || !message) return;
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

async function withLoading(task) {
  setLoading(true);
  try {
    return await task();
  } finally {
    setLoading(false);
  }
}

function confirmAction(message) {
  return window.confirm(message);
}

function setView(viewId) {
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  mobileTabs.forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  sidebar.classList.remove("open");
  if (viewId === "admin") loadAdmin();
  if (viewId === "profile") renderProfile();
  if (viewId === "notifications") renderNotifications();
  if (viewId === "reports") renderReports();
  if (viewId === "investments") renderInvestments();
  if (viewId === "cards") renderCard();
}

function renderShell() {
  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  document.querySelector("#userName").textContent = state.user.name;
  document.querySelector("#userRole").textContent = `${state.user.role} | ${state.demoMode ? "demo local" : "API"}`;
  document.querySelector("#sessionLabel").textContent = state.demoMode ? "Modo demo local" : "Sessao protegida por token";
  document.querySelector("#userInitials").textContent = state.user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function filteredTransactions() {
  const search = transactionSearch.value.trim().toLowerCase();
  const filter = transactionFilter.value;
  return state.transactions.filter((item) => {
    const matchesSearch = !search || item.description.toLowerCase().includes(search) || item.type.includes(search);
    const matchesFilter = filter === "all" || (filter === "in" && item.amount > 0) || (filter === "out" && item.amount < 0);
    return matchesSearch && matchesFilter;
  });
}

function renderDashboard() {
  const income = state.transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expense = Math.abs(state.transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));
  const visibleBalance = state.hideBalance ? "R$ *****" : money.format(state.account.balance);

  document.querySelector("#balanceValue").textContent = visibleBalance;
  document.querySelector("#incomeValue").textContent = state.hideBalance ? "R$ *****" : money.format(income);
  document.querySelector("#expenseValue").textContent = state.hideBalance ? "R$ *****" : money.format(expense);
  document.querySelector("#accountStatus").textContent = state.account.status || "Ativa";
  document.querySelector("#dailyLimit").textContent = money.format((state.account.dailyLimit || 10000) - (state.account.usedToday || 0));
  document.querySelector("#favoriteCount").textContent = String(state.favorites.length);
  document.querySelector("#goalStatus").textContent = income >= 5000 ? "Meta batida" : "Faltam " + money.format(5000 - income);
  hideBalanceButton.textContent = state.hideBalance ? "Mostrar saldo" : "Ocultar saldo";
  document.querySelector("#insightText").textContent = buildInsight(income, expense);
  document.querySelector("#smartRadar").textContent = expense > income ? "Atencao nas saidas" : "Fluxo saudavel";
  renderFlowChart(income, expense);

  transactionList.innerHTML = filteredTransactions()
    .slice(0, 8)
    .map((transaction) => {
      const positive = transaction.amount >= 0;
      return `
        <article class="transaction">
          <i>${transaction.type.slice(0, 1).toUpperCase()}</i>
          <div>
            <b>${transaction.description}</b>
            <span>${new Date(transaction.createdAt).toLocaleString("pt-BR")}</span>
          </div>
          <strong class="${positive ? "positive" : "negative"}">${state.hideBalance ? "R$ *****" : money.format(transaction.amount)}</strong>
        </article>
      `;
    })
    .join("");
}

function buildInsight(income, expense) {
  if (expense > income) return "O radar encontrou mais saidas que entradas neste periodo.";
  if ((state.account.usedToday || 0) > (state.account.dailyLimit || 10000) * 0.7) return "Voce esta perto do limite diario de movimentacao.";
  return "Fluxo equilibrado, limite saudavel e conta sem alertas criticos.";
}

function renderFlowChart(income, expense) {
  const invested = state.investments.reduce((sum, item) => sum + item.amount, 0);
  const max = Math.max(income, expense, invested, state.card.invoice, 1);
  const bars = [
    { label: "Entradas", value: income, className: "positive" },
    { label: "Saidas", value: expense, className: "negative" },
    { label: "Investido", value: invested, className: "neutral" },
    { label: "Fatura", value: state.card.invoice, className: "invoice" },
  ];
  const chart = document.querySelector("#flowChart");
  if (!chart) return;
  chart.innerHTML = bars
    .map((bar) => `<div class="chart-row"><span>${bar.label}</span><b>${money.format(bar.value)}</b><i class="${bar.className}" style="width:${Math.max(8, (bar.value / max) * 100)}%"></i></div>`)
    .join("");
}

function renderProfile() {
  if (!state.user) return;
  document.querySelector("#profileName").value = state.user.name;
  document.querySelector("#profileEmail").value = state.user.email;
  document.querySelector("#favoriteList").innerHTML = state.favorites.length
    ? state.favorites.map((item) => `<div class="mini-row"><span>${item}</span><strong>favorito</strong></div>`).join("")
    : "<p>Nenhum favorito ainda.</p>";
}

function renderNotifications() {
  const list = document.querySelector("#notificationList");
  if (!list) return;
  const defaults = [
    "Login protegido ativo.",
    "Limite diario configurado.",
    "Ambiente preparado para nuvem.",
  ];
  const items = state.notifications.length ? state.notifications : defaults.map((text) => ({ text, createdAt: new Date().toISOString() }));
  list.innerHTML = items
    .map((item) => `<div class="mini-row"><span>${item.text}</span><strong>${new Date(item.createdAt).toLocaleTimeString("pt-BR")}</strong></div>`)
    .join("");
}

function renderReports() {
  if (!state.account) return;
  const income = state.transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expense = Math.abs(state.transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));
  document.querySelector("#reportBalance").textContent = money.format(state.account.balance);
  document.querySelector("#reportIncome").textContent = money.format(income);
  document.querySelector("#reportExpense").textContent = money.format(expense);
  document.querySelector("#reportCount").textContent = String(state.transactions.length);
}

function renderCard() {
  const result = document.querySelector("#cardResult");
  if (!result) return;
  const available = Math.max(0, state.card.limit - state.card.invoice);
  result.textContent = `${state.card.blocked ? "Cartao bloqueado" : "Cartao ativo"} | Fatura: ${money.format(state.card.invoice)} | Disponivel: ${money.format(available)}.`;
}

function renderInvestments() {
  const list = document.querySelector("#investmentList");
  if (!list) return;
  if (!state.investments.length) {
    list.innerHTML = "<p>Nenhuma aplicacao ainda.</p>";
    return;
  }
  list.innerHTML = state.investments
    .map((item) => {
      const projected = item.amount * 1.012;
      return `<div class="mini-row"><span>${item.product} | ${money.format(item.amount)}</span><strong>${money.format(projected)}</strong></div>`;
    })
    .join("");
}

async function loadSession() {
  if (!state.token) return;
  if (state.token === "demo-token") {
    loadDemoData(localStorage.getItem("nextt_demo_role") || "cliente");
    return;
  }
  try {
    const data = await api("/api/me");
    state.user = data.user;
    state.account = data.account;
    state.transactions = data.transactions;
    state.card = data.card || state.card;
    state.investments = data.investments || state.investments;
    state.loans = data.loans || state.loans;
    renderShell();
    renderDashboard();
    renderProfile();
    renderNotifications();
    renderInvestments();
    renderCard();
  } catch {
    localStorage.removeItem("nextt_token");
    state.token = null;
  }
}

async function loadAdmin() {
  const userList = document.querySelector("#userList");
  const auditList = document.querySelector("#auditList");
  const kycList = document.querySelector("#kycList");
  userList.innerHTML = "<p>Carregando...</p>";
  auditList.innerHTML = "<p>Carregando...</p>";
  if (kycList) kycList.innerHTML = "<p>Carregando...</p>";

  try {
    if (state.demoMode) {
      if (state.user.role !== "admin") throw new Error("Acesso restrito ao administrador.");
      userList.innerHTML = `
        <div class="mini-row"><span>Cliente Demo</span><strong>cliente</strong></div>
        <div class="mini-row"><span>Admin Nexttt</span><strong>admin</strong></div>
      `;
      auditList.innerHTML = state.transactions
        .slice(0, 6)
        .map((item) => `<div class="mini-row"><span>${item.description}</span><strong>${item.type}</strong></div>`)
        .join("");
      if (kycList) {
        kycList.innerHTML = `<div class="mini-row"><span>Cliente Demo | pending</span><button class="ghost-button" type="button" data-admin-demo="approve">Aprovar</button></div>`;
      }
      document.querySelector("#adminUsers").textContent = "2";
      document.querySelector("#adminTransactions").textContent = String(state.transactions.length);
      document.querySelector("#adminBlocked").textContent = "0";
      return;
    }
    const data = await api("/api/admin/overview");
    userList.innerHTML = data.users.map((user) => `<div class="mini-row"><span>${user.name}</span><strong>${user.role}</strong></div>`).join("");
    auditList.innerHTML = data.audit.map((item) => `<div class="mini-row"><span>${item.action}</span><strong>${item.actor}</strong></div>`).join("");
    if (kycList) {
      kycList.innerHTML = (data.kyc || [])
        .map((item) => `<div class="mini-row"><span>${item.userName || item.userId} | ${item.status}</span><button class="ghost-button" type="button" data-kyc-id="${item.id}">Aprovar</button></div>`)
        .join("") || "<p>Nenhuma abertura pendente.</p>";
      kycList.querySelectorAll("[data-kyc-id]").forEach((button) => {
        button.addEventListener("click", () => approveKyc(button.dataset.kycId));
      });
    }
    document.querySelector("#adminUsers").textContent = String(data.users.length);
    document.querySelector("#adminTransactions").textContent = String(data.transactionCount || state.transactions.length);
    document.querySelector("#adminBlocked").textContent = String(data.blockedCount || 0);
  } catch (error) {
    userList.innerHTML = `<p>${error.message}</p>`;
    auditList.innerHTML = "<p>Acesse com admin para ver auditoria.</p>";
  }
}

async function approveKyc(id) {
  try {
    await api(`/api/admin/account-opening/${id}/approve`, { method: "POST" });
    pushNotification("Abertura aprovada pelo admin.");
    loadAdmin();
  } catch (error) {
    pushNotification(error.message);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setResult(loginResult, "Validando credenciais...");
  try {
    const data = await withLoading(() => api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#email").value,
        password: document.querySelector("#password").value,
      }),
    }));
    state.token = data.token;
    localStorage.setItem("nextt_token", data.token);
    await loadSession();
  } catch (error) {
    const email = document.querySelector("#email").value.toLowerCase();
    const password = document.querySelector("#password").value;
    const isDemoUser = email === "cliente@nextt.local" || email === "admin@nextt.local";
    if (isDemoUser && password === "Nextt@123") {
      const role = email.startsWith("admin") ? "admin" : "cliente";
      localStorage.setItem("nextt_token", "demo-token");
      localStorage.setItem("nextt_demo_role", role);
      loadDemoData(role);
      pushNotification("Entrada realizada em modo demo local.");
      return;
    }
    setResult(loginResult, error.message, true);
  }
});

registerButton.addEventListener("click", async () => {
  const name = document.querySelector("#registerName").value.trim() || "Novo Cliente";
  const email = document.querySelector("#email").value.trim() || "novo@nextt.local";
  const password = document.querySelector("#password").value || "Nextt@123";
  const payload = {
    name,
    email,
    password,
    cpf: document.querySelector("#registerCpf").value.trim(),
    birth: document.querySelector("#registerBirth").value,
    phone: document.querySelector("#registerPhone").value.trim(),
    address: document.querySelector("#registerAddress").value.trim(),
    acceptedTerms: document.querySelector("#registerTerms").checked,
  };
  if (payload.cpf && !validateCpf(payload.cpf)) return setResult(loginResult, "CPF invalido no cadastro completo.", true);
  if (payload.cpf && !payload.acceptedTerms) return setResult(loginResult, "Aceite os termos demo para cadastro completo.", true);
  try {
    await withLoading(() => api("/api/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }));
    setResult(loginResult, "Cliente cadastrado. Agora clique em entrar.");
  } catch {
    localStorage.setItem("nextt_token", "demo-token");
    localStorage.setItem("nextt_demo_role", "cliente");
    loadDemoData("cliente", name, email);
    pushNotification("Cliente demo criado localmente.");
  }
});

resetPasswordButton.addEventListener("click", async () => {
  const email = document.querySelector("#email").value.trim();
  try {
    await api("/api/password-reset/request", { method: "POST", body: JSON.stringify({ email }) });
    setResult(loginResult, "Codigo demo enviado. Use 123456 como codigo na fase real.");
  } catch {
    setResult(loginResult, "Modo demo: codigo de recuperacao 123456. Nova senha sugerida: Nextt@123");
  }
});

navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
mobileTabs.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
document.querySelectorAll("[data-view-jump]").forEach((item) => item.addEventListener("click", () => setView(item.dataset.viewJump)));
document.querySelectorAll("[data-shortcut]").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelector("#operationType").value = item.dataset.shortcut;
    setView("account");
  });
});

menuButton.addEventListener("click", () => sidebar.classList.toggle("open"));
themeButton.addEventListener("click", () => document.body.classList.toggle("light-mode"));
hideBalanceButton.addEventListener("click", () => {
  state.hideBalance = !state.hideBalance;
  saveLocal();
  renderDashboard();
});
transactionSearch.addEventListener("input", renderDashboard);
transactionFilter.addEventListener("change", renderDashboard);

logoutButton.addEventListener("click", async () => {
  if (!state.demoMode) await api("/api/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("nextt_token");
  localStorage.removeItem("nextt_demo_role");
  location.reload();
});

receiptButton.addEventListener("click", () => {
  const last = state.transactions[0];
  if (!last) return;
  document.querySelector("#receiptBox").textContent =
    `Comprovante Nexttt | ${last.description} | ${money.format(last.amount)} | ID ${last.id.slice(0, 8)} | ${new Date(last.createdAt).toLocaleString("pt-BR")}`;
});

pdfReceiptButton.addEventListener("click", () => {
  if (state.demoMode) {
    document.querySelector("#receiptBox").textContent = "PDF real precisa do servidor. Use http://localhost:3000 e clique de novo.";
    return;
  }
  window.open("/api/reports/receipt.pdf", "_blank");
});

document.querySelector("#saveProfileButton").addEventListener("click", () => {
  state.user.name = document.querySelector("#profileName").value.trim() || state.user.name;
  state.user.email = document.querySelector("#profileEmail").value.trim() || state.user.email;
  renderShell();
  pushNotification("Perfil atualizado localmente.");
});

document.querySelector("#addFavoriteButton").addEventListener("click", () => {
  const value = document.querySelector("#favoriteKey").value.trim();
  if (!value) return;
  state.favorites.unshift(value);
  state.favorites = [...new Set(state.favorites)].slice(0, 8);
  document.querySelector("#favoriteKey").value = "";
  saveLocal();
  renderProfile();
  renderDashboard();
  pushNotification("Favorito adicionado.");
});

openAccountButton.addEventListener("click", async () => {
  const payload = {
    cpf: document.querySelector("#kycCpf").value.trim(),
    birth: document.querySelector("#kycBirth").value,
    phone: document.querySelector("#kycPhone").value.trim(),
    address: document.querySelector("#kycAddress").value.trim(),
    income: Number(document.querySelector("#kycIncome").value),
  };
  const result = document.querySelector("#onboardingResult");
  if (!validateCpf(payload.cpf)) return setResult(result, "CPF invalido para analise demo.", true);
  if (!payload.birth || !payload.phone || !payload.address) return setResult(result, "Preencha nascimento, telefone e endereco.", true);
  if (!payload.income || payload.income < 500) return setResult(result, "Renda insuficiente para abertura demo.", true);

  try {
    if (!state.demoMode) await api("/api/account-opening", { method: "POST", body: JSON.stringify(payload) });
    state.account.status = "Em analise";
    document.querySelectorAll("#onboardingTimeline div").forEach((item, index) => item.classList.toggle("active", index <= 1));
    renderDashboard();
    pushNotification("Abertura de conta enviada para analise.");
    setResult(result, "Analise enviada. Status atualizado para Em analise.");
  } catch (error) {
    setResult(result, error.message, true);
  }
});

function validateCpf(cpf) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(digits[10]);
}

twoFactorButton.addEventListener("click", () => {
  const code = document.querySelector("#twoFactorCode").value.trim();
  setResult(document.querySelector("#securityResult"), code === "123456" ? "2FA validado com sucesso." : "Codigo 2FA invalido.", code !== "123456");
});

fraudButton.addEventListener("click", () => {
  const amount = Number(document.querySelector("#fraudAmount").value);
  const result = document.querySelector("#securityResult");
  if (!amount) return setResult(result, "Informe um valor para simular risco.", true);
  const risk = amount > 10000 ? "alto" : amount > 5000 ? "medio" : "baixo";
  document.querySelector("#riskLabel").textContent = risk === "alto" ? "Alto" : risk === "medio" ? "Medio" : "Baixo";
  setResult(result, `Motor antifraude classificou a operacao como risco ${risk}.`, risk === "alto");
});

exportCsvButton.addEventListener("click", () => {
  const header = "id,tipo,descricao,valor,data";
  const rows = state.transactions.map((item) => [item.id, item.type, item.description, item.amount, item.createdAt].join(","));
  document.querySelector("#exportBox").value = [header, ...rows].join("\n");
  pushNotification("Relatorio CSV gerado na tela.");
});

serverCsvButton.addEventListener("click", () => {
  if (state.demoMode) {
    document.querySelector("#exportBox").value = "CSV do servidor precisa de http://localhost:3000.";
    return;
  }
  window.open("/api/reports/transactions.csv", "_blank");
});

printReportButton.addEventListener("click", () => {
  renderReports();
  document.querySelector("#exportBox").value = "Relatorio/comprovante preparado. Use Ctrl+P no navegador para salvar em PDF.";
});

cardPurchaseButton.addEventListener("click", async () => {
  const amount = Number(document.querySelector("#cardPurchaseValue").value);
  const result = document.querySelector("#cardResult");
  if (!amount || amount <= 0) return setResult(result, "Valor invalido.", true);
  if (state.card.blocked) return setResult(result, "Cartao bloqueado.", true);
  if (state.card.invoice + amount > state.card.limit) return setResult(result, "Limite insuficiente.", true);
  if (!confirmAction(`Confirmar compra no cartao de ${money.format(amount)}?`)) return;
  try {
    if (!state.demoMode) {
      const data = await api("/api/cards/purchase", { method: "POST", body: JSON.stringify({ amount }) });
      state.card = data.card;
      state.transactions = data.transactions;
    } else {
      state.card.invoice = Number((state.card.invoice + amount).toFixed(2));
      state.transactions.unshift(demoTransaction("card", -amount, "Compra no cartao", 0));
    }
    saveLocal();
    renderCard();
    renderDashboard();
    pushNotification("Compra no cartao lancada.");
  } catch (error) {
    setResult(result, error.message, true);
  }
});

invoicePaymentButton.addEventListener("click", async () => {
  const amount = Number(document.querySelector("#invoicePaymentValue").value);
  const result = document.querySelector("#cardResult");
  if (!amount || amount <= 0) return setResult(result, "Valor invalido.", true);
  if (amount > state.account.balance) return setResult(result, "Saldo insuficiente para pagar fatura.", true);
  if (!confirmAction(`Confirmar pagamento de fatura de ${money.format(amount)}?`)) return;
  try {
    if (!state.demoMode) {
      const data = await api("/api/cards/pay-invoice", { method: "POST", body: JSON.stringify({ amount }) });
      state.card = data.card;
      state.account = data.account;
      state.transactions = data.transactions;
    } else {
      state.card.invoice = Math.max(0, Number((state.card.invoice - amount).toFixed(2)));
      state.account.balance = Number((state.account.balance - amount).toFixed(2));
      state.transactions.unshift(demoTransaction("invoice", -amount, "Pagamento da fatura", 0));
    }
    saveLocal();
    renderCard();
    renderDashboard();
    pushNotification("Pagamento de fatura registrado.");
  } catch (error) {
    setResult(result, error.message, true);
  }
});

loanSimulateButton.addEventListener("click", () => {
  const amount = Number(document.querySelector("#loanAmount").value);
  const installments = Number(document.querySelector("#loanInstallments").value);
  const result = document.querySelector("#loanResult");
  if (!amount || !installments) return setResult(result, "Informe valor e parcelas.", true);
  const monthlyRate = 0.024;
  const payment = amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -installments)));
  setResult(result, `${installments} parcelas de ${money.format(payment)}. Total: ${money.format(payment * installments)}.`);
});

loanRequestButton.addEventListener("click", async () => {
  const amount = Number(document.querySelector("#loanAmount").value);
  const installments = Number(document.querySelector("#loanInstallments").value);
  const result = document.querySelector("#loanResult");
  if (!amount || !installments) return setResult(result, "Informe valor e parcelas.", true);
  if (!confirmAction(`Enviar emprestimo de ${money.format(amount)} para analise?`)) return;
  try {
    if (!state.demoMode) await api("/api/loans/request", { method: "POST", body: JSON.stringify({ amount, installments }) });
    state.loans.unshift({ id: crypto.randomUUID(), amount, installments, status: "pending" });
    saveLocal();
    pushNotification("Emprestimo enviado para analise.");
    setResult(result, "Solicitacao enviada para analise.");
  } catch (error) {
    setResult(result, error.message, true);
  }
});

investmentApplyButton.addEventListener("click", async () => {
  const product = document.querySelector("#investmentProduct").value;
  const amount = Number(document.querySelector("#investmentAmount").value);
  if (!amount || amount <= 0) return;
  if (amount > state.account.balance) return pushNotification("Saldo insuficiente para aplicar.");
  if (!confirmAction(`Confirmar aplicacao de ${money.format(amount)}?`)) return;
  try {
    if (!state.demoMode) {
      const data = await api("/api/investments/apply", { method: "POST", body: JSON.stringify({ product, amount }) });
      state.account = data.account;
      state.investments = data.investments;
      state.transactions = data.transactions;
    } else {
      state.account.balance = Number((state.account.balance - amount).toFixed(2));
      state.investments.unshift({ id: crypto.randomUUID(), product, amount, createdAt: new Date().toISOString() });
      state.transactions.unshift(demoTransaction("investment", -amount, `Aplicacao ${product}`, 0));
    }
    saveLocal();
    renderInvestments();
    renderDashboard();
    pushNotification("Aplicacao registrada.");
  } catch (error) {
    pushNotification(error.message);
  }
});

investmentRedeemButton.addEventListener("click", async () => {
  const first = state.investments[0];
  if (!first) return pushNotification("Nenhum investimento para resgatar.");
  if (!confirmAction(`Resgatar ${first.product} agora?`)) return;
  try {
    if (!state.demoMode) {
      const data = await api("/api/investments/redeem", { method: "POST", body: JSON.stringify({ id: first.id }) });
      state.account = data.account;
      state.investments = data.investments;
      state.transactions = data.transactions;
    } else {
      const amount = Number((first.amount * 1.012).toFixed(2));
      state.account.balance = Number((state.account.balance + amount).toFixed(2));
      state.investments = state.investments.filter((item) => item.id !== first.id);
      state.transactions.unshift(demoTransaction("investment", amount, `Resgate ${first.product}`, 0));
    }
    saveLocal();
    renderInvestments();
    renderDashboard();
    pushNotification("Resgate registrado.");
  } catch (error) {
    pushNotification(error.message);
  }
});

simulateButton.addEventListener("click", async () => {
  const type = document.querySelector("#operationType").value;
  const amount = Number(document.querySelector("#operationValue").value);
  const target = document.querySelector("#operationTarget").value.trim();

  if (!amount || amount <= 0) return setResult(operationResult, "Informe um valor valido para continuar.", true);
  if ((type === "transfer" || type === "pix") && !target) return setResult(operationResult, "Destino obrigatorio.", true);
  if ((state.account.usedToday || 0) + amount > (state.account.dailyLimit || 10000)) {
    return setResult(operationResult, "Operacao acima do limite diario.", true);
  }
  if (!confirmAction(`Confirmar ${type} de ${money.format(amount)}?`)) return;

  try {
    if (state.demoMode) {
      const signedAmount = type === "deposit" ? amount : -amount;
      if (state.account.balance + signedAmount < 0) return setResult(operationResult, "Saldo insuficiente.", true);
      state.account.balance = Number((state.account.balance + signedAmount).toFixed(2));
      if (signedAmount < 0) state.account.usedToday = Number(((state.account.usedToday || 0) + amount).toFixed(2));
      const labels = {
        deposit: "Deposito validado",
        withdraw: "Saque aprovado",
        transfer: `Transferencia para ${target}`,
        pix: `PIX enviado para ${target}`,
      };
      state.transactions.unshift(demoTransaction(type, signedAmount, labels[type], 0));
      renderDashboard();
      pushNotification(`${labels[type]} no valor de ${money.format(amount)}.`);
      return setResult(operationResult, "Operacao aprovada em modo demo local.");
    }
    setResult(operationResult, "Enviando operacao para validacao...");
    const data = await api("/api/transactions", {
      method: "POST",
      body: JSON.stringify({ type, amount, target }),
    });
    state.account = data.account;
    state.transactions = data.transactions;
    renderDashboard();
    pushNotification(data.message);
    setResult(operationResult, data.message);
  } catch (error) {
    setResult(operationResult, error.message, true);
  }
});

function loadInitialRoute() {
  const hashParams = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  const params = new URLSearchParams(location.search);
  new URLSearchParams(hashParams).forEach((value, key) => params.set(key, value));
  const demo = params.get("demo");
  const view = params.get("view");

  if (demo === "cliente" || demo === "admin") {
    localStorage.setItem("nextt_token", "demo-token");
    localStorage.setItem("nextt_demo_role", demo);
    loadDemoData(demo);
    if (view && document.getElementById(view)) setView(view);
    return;
  }

  loadSession().then(() => {
    if (view && document.getElementById(view) && state.user) setView(view);
  });
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

loadInitialRoute();
