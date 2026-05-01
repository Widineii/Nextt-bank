const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const { sendMail } = require("./mailer");
const { config } = require("./config");
const { log } = require("./logger");
const { createStore } = require("./db");

const PORT = config.port;
const PUBLIC_DIR = config.publicDir;
const SESSION_TTL_MS = config.sessionTtlMs;
const REFRESH_TTL_MS = config.refreshTtlMs;
const rateLimits = new Map();
const store = createStore(createInitialData);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function now() {
  return new Date().toISOString();
}

function createInitialData() {
  const clientPassword = hashPassword("Nextt@123");
  const adminPassword = hashPassword("Nextt@123");
  return {
    users: [
      {
        id: "usr_client",
        name: "Marina Costa",
        email: "cliente@nextt.local",
        role: "cliente",
        passwordHash: clientPassword.hash,
        passwordSalt: clientPassword.salt,
        failedAttempts: 0,
        lockedUntil: null,
        status: "active",
        createdAt: now(),
      },
      {
        id: "usr_admin",
        name: "Admin Nexttt",
        email: "admin@nextt.local",
        role: "admin",
        passwordHash: adminPassword.hash,
        passwordSalt: adminPassword.salt,
        failedAttempts: 0,
        lockedUntil: null,
        status: "active",
        createdAt: now(),
      },
    ],
    accounts: [
      {
        id: "acc_client",
        userId: "usr_client",
        number: "0001-8840",
        type: "corrente",
        status: "Ativa",
        dailyLimit: 10000,
        usedToday: 0,
        balance: 18420.75,
      },
      {
        id: "acc_admin",
        userId: "usr_admin",
        number: "0001-0001",
        type: "operacional",
        status: "Ativa",
        dailyLimit: 50000,
        usedToday: 0,
        balance: 0,
      },
    ],
    transactions: [
      {
        id: crypto.randomUUID(),
        accountId: "acc_client",
        type: "deposit",
        amount: 7600,
        description: "Salario recebido",
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        accountId: "acc_client",
        type: "pix",
        amount: -248.9,
        description: "PIX para Mercado Nova Era",
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        accountId: "acc_client",
        type: "card",
        amount: -129.7,
        description: "Compra no cartao - streaming e apps",
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        accountId: "acc_client",
        type: "investment",
        amount: -1500,
        description: "Aplicacao CDB Fluxo",
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        accountId: "acc_client",
        type: "transfer",
        amount: -980,
        description: "Transferencia aluguel studio",
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        accountId: "acc_client",
        type: "deposit",
        amount: 1250,
        description: "Freelance recebido",
        createdAt: now(),
      },
    ],
    cards: [
      { id: "card_client", userId: "usr_client", limit: 12000, invoice: 2840.35, blocked: false, dueDay: 10 },
    ],
    investments: [
      { id: "inv_demo_cdb", userId: "usr_client", product: "cdb", amount: 3500, createdAt: now() },
      { id: "inv_demo_reserva", userId: "usr_client", product: "reserva", amount: 2200, createdAt: now() },
    ],
    loans: [
      { id: "loan_demo", userId: "usr_client", amount: 6000, installments: 12, status: "approved", rate: 0.024, createdAt: now() },
    ],
    passwordResets: [],
    kyc: [],
    sessions: [],
    audit: [],
  };
}

function ensureDataFile() {
  store.ensure();
}

function loadDb() {
  const db = store.load();
  db.cards = db.cards || [{ id: "card_client", userId: "usr_client", limit: 8000, invoice: 1820, blocked: false, dueDay: 10 }];
  db.investments = db.investments || [];
  db.loans = db.loans || [];
  db.passwordResets = db.passwordResets || [];
  db.kyc = db.kyc || [];
  db.users.forEach((user) => {
    user.status = user.status || "active";
  });
  db.accounts.forEach((account) => {
    account.status = account.status || "Ativa";
    account.dailyLimit = account.dailyLimit || 10000;
    account.usedToday = account.usedToday || 0;
  });
  return db;
}

function saveDb(db) {
  store.save(db);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { hash, salt };
}

function verifyPassword(password, user) {
  const candidate = hashPassword(password, user.passwordSalt).hash;
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(user.passwordHash, "hex"));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status || "active", createdAt: user.createdAt };
}

function addAudit(db, actor, action, details = {}) {
  db.audit.unshift({
    id: crypto.randomUUID(),
    actor: actor ? actor.email : "system",
    action,
    details,
    createdAt: now(),
  });
  db.audit = db.audit.slice(0, 100);
  log("audit", { actor: actor ? actor.email : "system", action, details });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("Payload muito grande."));
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
  });
}

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...securityHeaders(),
  });
  res.end(JSON.stringify(data));
}

function sendWithHeaders(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...securityHeaders(),
    ...headers,
  });
  res.end(JSON.stringify(data));
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; frame-ancestors 'none'",
  };
}

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local").toString().split(",")[0].trim();
}

function checkRateLimit(req) {
  const key = `${clientIp(req)}:${req.url.split("?")[0]}`;
  const nowMs = Date.now();
  const current = rateLimits.get(key) || { count: 0, resetAt: nowMs + config.rateLimitWindowMs };
  if (nowMs > current.resetAt) {
    current.count = 0;
    current.resetAt = nowMs + config.rateLimitWindowMs;
  }
  current.count += 1;
  rateLimits.set(key, current);
  return current.count <= config.rateLimitMax;
}

function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : getCookie(req, "nextt_session");
}

function requireSession(req, db) {
  const token = getBearerToken(req);
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function createSession(db, user) {
  const token = crypto.randomBytes(32).toString("hex");
  const refreshToken = crypto.randomBytes(32).toString("hex");
  db.sessions.push({
    token,
    refreshToken,
    userId: user.id,
    createdAt: now(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    refreshExpiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
  });
  return { token, refreshToken };
}

function sessionCookie(token, refreshToken) {
  return [
    `nextt_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
    `nextt_refresh=${refreshToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${REFRESH_TTL_MS / 1000}`,
  ];
}

function getAccountData(db, user) {
  const account = db.accounts.find((item) => item.userId === user.id);
  const card = db.cards.find((item) => item.userId === user.id) || null;
  const investments = db.investments.filter((item) => item.userId === user.id);
  const loans = db.loans.filter((item) => item.userId === user.id);
  const transactions = account
    ? db.transactions.filter((item) => item.accountId === account.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];
  return { account, card, investments, loans, transactions };
}

function isValidCpf(cpf) {
  const digits = String(cpf || "").replace(/\D/g, "");
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

function toCsv(rows) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

function escapePdfText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makeReceiptPdf({ title, lines }) {
  const text = [`BT /F1 18 Tf 48 780 Td (${escapePdfText(title)}) Tj`, "/F1 10 Tf"];
  lines.forEach((line, index) => {
    text.push(`48 ${740 - index * 22} Td (${escapePdfText(line)}) Tj`);
  });
  text.push("ET");
  const stream = text.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

async function handleApi(req, res, pathname) {
  const db = loadDb();

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      return send(res, 200, { ok: true, name: "Nexttt Bank", time: now() });
    }

    if (req.method === "POST" && pathname === "/api/login") {
      const { email, password } = await readBody(req);
      const user = db.users.find((item) => item.email.toLowerCase() === String(email || "").toLowerCase());
      if (!user) return send(res, 401, { message: "Credenciais invalidas." });

      if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
        return send(res, 423, { message: "Usuario bloqueado temporariamente." });
      }

      if (!verifyPassword(String(password || ""), user)) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 1000 * 60 * 15).toISOString();
          addAudit(db, user, "login_bloqueado");
        }
        saveDb(db);
        return send(res, 401, { message: "Credenciais invalidas." });
      }

      user.failedAttempts = 0;
      user.lockedUntil = null;
      const { token, refreshToken } = createSession(db, user);
      addAudit(db, user, "login_sucesso");
      saveDb(db);
      return sendWithHeaders(res, 200, { token, user: publicUser(user) }, { "Set-Cookie": sessionCookie(token, refreshToken) });
    }

    if (req.method === "POST" && pathname === "/api/register") {
      const { name, email, password, cpf, birth, phone, address, acceptedTerms } = await readBody(req);
      const normalizedEmail = String(email || "").toLowerCase().trim();
      if (!String(name || "").trim()) return send(res, 400, { message: "Nome obrigatorio." });
      if (!normalizedEmail.includes("@")) return send(res, 400, { message: "E-mail invalido." });
      if (String(password || "").length < 8) return send(res, 400, { message: "Senha precisa ter pelo menos 8 caracteres." });
      if (cpf && !isValidCpf(cpf)) return send(res, 400, { message: "CPF invalido." });
      if (cpf && !acceptedTerms) return send(res, 400, { message: "Aceite os termos." });
      if (db.users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
        return send(res, 409, { message: "E-mail ja cadastrado." });
      }
      const passwordData = hashPassword(String(password));
      const user = {
        id: crypto.randomUUID(),
        name: String(name).trim(),
        email: normalizedEmail,
        role: "cliente",
        status: "active",
        passwordHash: passwordData.hash,
        passwordSalt: passwordData.salt,
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: now(),
      };
      db.users.push(user);
      const account = {
        id: crypto.randomUUID(),
        userId: user.id,
        number: `0001-${String(db.accounts.length + 1000).slice(-4)}`,
        type: "corrente",
        status: cpf ? "Em analise" : "Ativa",
        dailyLimit: 10000,
        usedToday: 0,
        balance: 0,
      };
      db.accounts.push(account);
      db.cards.push({ id: crypto.randomUUID(), userId: user.id, limit: 3000, invoice: 0, blocked: false, dueDay: 10 });
      if (cpf) {
        db.kyc.unshift({
          id: crypto.randomUUID(),
          userId: user.id,
          cpf: String(cpf).replace(/\D/g, ""),
          birth,
          phone,
          address,
          income: 0,
          status: "pending",
          createdAt: now(),
        });
      }
      addAudit(db, user, "cadastro_cliente");
      saveDb(db);
      return send(res, 201, { message: "Cliente cadastrado.", user: publicUser(user) });
    }

    if (req.method === "POST" && pathname === "/api/password-reset/request") {
      const { email } = await readBody(req);
      const user = db.users.find((item) => item.email.toLowerCase() === String(email || "").toLowerCase());
      if (user) {
        db.passwordResets.unshift({
          id: crypto.randomUUID(),
          userId: user.id,
          code: "123456",
          expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          createdAt: now(),
        });
        sendMail({
          to: user.email,
          subject: "Codigo de recuperacao Nexttt Bank",
          text: "Seu codigo demo de recuperacao e 123456. Ele expira em 15 minutos.",
        });
        addAudit(db, user, "recuperacao_senha_solicitada");
        saveDb(db);
      }
      return send(res, 200, { message: "Se o e-mail existir, um codigo sera enviado." });
    }

    if (req.method === "POST" && pathname === "/api/password-reset/confirm") {
      const { email, code, newPassword } = await readBody(req);
      const user = db.users.find((item) => item.email.toLowerCase() === String(email || "").toLowerCase());
      if (!user) return send(res, 400, { message: "Codigo invalido." });
      const reset = db.passwordResets.find((item) => item.userId === user.id && item.code === String(code) && new Date(item.expiresAt).getTime() > Date.now());
      if (!reset) return send(res, 400, { message: "Codigo invalido ou expirado." });
      if (String(newPassword || "").length < 8) return send(res, 400, { message: "Senha curta." });
      const passwordData = hashPassword(String(newPassword));
      user.passwordHash = passwordData.hash;
      user.passwordSalt = passwordData.salt;
      db.passwordResets = db.passwordResets.filter((item) => item.id !== reset.id);
      addAudit(db, user, "senha_alterada");
      saveDb(db);
      return send(res, 200, { message: "Senha alterada." });
    }

    if (req.method === "POST" && pathname === "/api/logout") {
      const token = getBearerToken(req);
      if (token) {
        const user = requireSession(req, db);
        db.sessions = db.sessions.filter((item) => item.token !== token);
        addAudit(db, user, "logout");
        saveDb(db);
      }
      return sendWithHeaders(res, 200, { ok: true }, {
        "Set-Cookie": [
          "nextt_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
          "nextt_refresh=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
        ],
      });
    }

    if (req.method === "POST" && pathname === "/api/refresh") {
      const refreshToken = getCookie(req, "nextt_refresh");
      const session = db.sessions.find((item) => item.refreshToken === refreshToken && new Date(item.refreshExpiresAt).getTime() > Date.now());
      if (!session) return send(res, 401, { message: "Refresh invalido." });
      const user = db.users.find((item) => item.id === session.userId);
      if (!user) return send(res, 401, { message: "Usuario invalido." });
      db.sessions = db.sessions.filter((item) => item.refreshToken !== refreshToken);
      const next = createSession(db, user);
      addAudit(db, user, "sessao_renovada");
      saveDb(db);
      return sendWithHeaders(res, 200, { token: next.token, user: publicUser(user) }, { "Set-Cookie": sessionCookie(next.token, next.refreshToken) });
    }

    const user = requireSession(req, db);
    if (!user) return send(res, 401, { message: "Sessao invalida ou expirada." });

    if (req.method === "GET" && pathname === "/api/me") {
      return send(res, 200, { user: publicUser(user), ...getAccountData(db, user) });
    }

    if (req.method === "POST" && pathname === "/api/account-opening") {
      const payload = await readBody(req);
      if (!isValidCpf(payload.cpf)) return send(res, 400, { message: "CPF invalido." });
      if (!payload.birth || !payload.phone || !payload.address) return send(res, 400, { message: "Dados incompletos." });
      if (Number(payload.income) < 500) return send(res, 400, { message: "Renda insuficiente para abertura." });
      const account = db.accounts.find((item) => item.userId === user.id);
      if (!account) return send(res, 404, { message: "Conta nao encontrada." });
      account.status = "Em analise";
      db.kyc = db.kyc || [];
      db.kyc.unshift({
        id: crypto.randomUUID(),
        userId: user.id,
        cpf: String(payload.cpf).replace(/\D/g, ""),
        birth: payload.birth,
        phone: payload.phone,
        address: payload.address,
        income: Number(payload.income),
        status: "pending",
        createdAt: now(),
      });
      addAudit(db, user, "abertura_conta_enviada");
      saveDb(db);
      return send(res, 200, { message: "Abertura enviada para analise.", account });
    }

    if (req.method === "POST" && pathname === "/api/transactions") {
      const { type, amount, target } = await readBody(req);
      const numericAmount = Number(amount);
      const allowed = ["deposit", "withdraw", "transfer", "pix"];
      if (!allowed.includes(type)) return send(res, 400, { message: "Tipo de operacao invalido." });
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) return send(res, 400, { message: "Valor invalido." });
      if ((type === "transfer" || type === "pix") && !String(target || "").trim()) return send(res, 400, { message: "Destino obrigatorio." });

      const account = db.accounts.find((item) => item.userId === user.id);
      if (!account) return send(res, 404, { message: "Conta nao encontrada." });

      const signedAmount = type === "deposit" ? numericAmount : -numericAmount;
      if (account.balance + signedAmount < 0) return send(res, 400, { message: "Saldo insuficiente." });
      if ((account.usedToday || 0) + Math.abs(signedAmount) > (account.dailyLimit || 10000)) {
        return send(res, 400, { message: "Operacao acima do limite diario." });
      }

      account.balance = Number((account.balance + signedAmount).toFixed(2));
      if (signedAmount < 0) account.usedToday = Number(((account.usedToday || 0) + Math.abs(signedAmount)).toFixed(2));
      const labels = {
        deposit: "Deposito validado",
        withdraw: "Saque aprovado",
        transfer: `Transferencia para ${target}`,
        pix: `PIX enviado para ${target}`,
      };
      db.transactions.unshift({
        id: crypto.randomUUID(),
        accountId: account.id,
        type,
        amount: signedAmount,
        description: labels[type],
        createdAt: now(),
      });
      addAudit(db, user, "operacao_bancaria", { type, amount: numericAmount });
      saveDb(db);
      const data = getAccountData(db, user);
      return send(res, 200, { message: "Operacao aprovada e registrada.", ...data });
    }

    if (req.method === "POST" && pathname === "/api/cards/purchase") {
      const { amount } = await readBody(req);
      const numericAmount = Number(amount);
      const card = db.cards.find((item) => item.userId === user.id);
      const account = db.accounts.find((item) => item.userId === user.id);
      if (!card || !account) return send(res, 404, { message: "Cartao nao encontrado." });
      if (card.blocked) return send(res, 400, { message: "Cartao bloqueado." });
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) return send(res, 400, { message: "Valor invalido." });
      if (card.invoice + numericAmount > card.limit) return send(res, 400, { message: "Limite insuficiente." });
      card.invoice = Number((card.invoice + numericAmount).toFixed(2));
      db.transactions.unshift({
        id: crypto.randomUUID(),
        accountId: account.id,
        type: "card",
        amount: -numericAmount,
        description: "Compra no cartao",
        createdAt: now(),
      });
      addAudit(db, user, "compra_cartao", { amount: numericAmount });
      saveDb(db);
      return send(res, 200, { message: "Compra lancada.", ...getAccountData(db, user) });
    }

    if (req.method === "POST" && pathname === "/api/cards/pay-invoice") {
      const { amount } = await readBody(req);
      const numericAmount = Number(amount);
      const card = db.cards.find((item) => item.userId === user.id);
      const account = db.accounts.find((item) => item.userId === user.id);
      if (!card || !account) return send(res, 404, { message: "Cartao nao encontrado." });
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) return send(res, 400, { message: "Valor invalido." });
      if (numericAmount > account.balance) return send(res, 400, { message: "Saldo insuficiente." });
      account.balance = Number((account.balance - numericAmount).toFixed(2));
      card.invoice = Math.max(0, Number((card.invoice - numericAmount).toFixed(2)));
      db.transactions.unshift({
        id: crypto.randomUUID(),
        accountId: account.id,
        type: "invoice",
        amount: -numericAmount,
        description: "Pagamento da fatura",
        createdAt: now(),
      });
      addAudit(db, user, "pagamento_fatura", { amount: numericAmount });
      saveDb(db);
      return send(res, 200, { message: "Fatura paga.", ...getAccountData(db, user) });
    }

    if (req.method === "POST" && pathname === "/api/investments/apply") {
      const { product, amount } = await readBody(req);
      const numericAmount = Number(amount);
      const account = db.accounts.find((item) => item.userId === user.id);
      if (!account) return send(res, 404, { message: "Conta nao encontrada." });
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) return send(res, 400, { message: "Valor invalido." });
      if (numericAmount > account.balance) return send(res, 400, { message: "Saldo insuficiente." });
      account.balance = Number((account.balance - numericAmount).toFixed(2));
      db.investments.unshift({ id: crypto.randomUUID(), userId: user.id, product: product || "cdb", amount: numericAmount, createdAt: now() });
      db.transactions.unshift({ id: crypto.randomUUID(), accountId: account.id, type: "investment", amount: -numericAmount, description: `Aplicacao ${product || "cdb"}`, createdAt: now() });
      addAudit(db, user, "aplicacao_investimento", { product, amount: numericAmount });
      saveDb(db);
      return send(res, 200, { message: "Aplicacao registrada.", ...getAccountData(db, user) });
    }

    if (req.method === "POST" && pathname === "/api/investments/redeem") {
      const { id } = await readBody(req);
      const account = db.accounts.find((item) => item.userId === user.id);
      const investment = db.investments.find((item) => item.id === id && item.userId === user.id);
      if (!account || !investment) return send(res, 404, { message: "Investimento nao encontrado." });
      const amount = Number((investment.amount * 1.012).toFixed(2));
      account.balance = Number((account.balance + amount).toFixed(2));
      db.investments = db.investments.filter((item) => item.id !== investment.id);
      db.transactions.unshift({ id: crypto.randomUUID(), accountId: account.id, type: "investment", amount, description: `Resgate ${investment.product}`, createdAt: now() });
      addAudit(db, user, "resgate_investimento", { amount });
      saveDb(db);
      return send(res, 200, { message: "Resgate registrado.", ...getAccountData(db, user) });
    }

    if (req.method === "POST" && pathname === "/api/loans/request") {
      const { amount, installments } = await readBody(req);
      const numericAmount = Number(amount);
      const numericInstallments = Number(installments);
      if (!Number.isFinite(numericAmount) || numericAmount < 100) return send(res, 400, { message: "Valor invalido." });
      if (!Number.isInteger(numericInstallments) || numericInstallments < 1 || numericInstallments > 48) return send(res, 400, { message: "Parcelas invalidas." });
      db.loans.unshift({ id: crypto.randomUUID(), userId: user.id, amount: numericAmount, installments: numericInstallments, status: "pending", rate: 0.024, createdAt: now() });
      addAudit(db, user, "emprestimo_solicitado", { amount: numericAmount, installments: numericInstallments });
      saveDb(db);
      return send(res, 200, { message: "Emprestimo enviado para analise.", ...getAccountData(db, user) });
    }

    if (req.method === "GET" && pathname === "/api/admin/overview") {
      if (user.role !== "admin") return send(res, 403, { message: "Acesso restrito ao administrador." });
      return send(res, 200, {
        users: db.users.map(publicUser),
        audit: db.audit.slice(0, 10),
        kyc: db.kyc.map((item) => ({
          ...item,
          userName: (db.users.find((candidate) => candidate.id === item.userId) || {}).name,
        })),
        transactionCount: db.transactions.length,
        blockedCount: db.users.filter((item) => item.lockedUntil && new Date(item.lockedUntil).getTime() > Date.now()).length,
      });
    }

    if (req.method === "POST" && pathname.startsWith("/api/admin/account-opening/") && (pathname.endsWith("/approve") || pathname.endsWith("/reject"))) {
      if (user.role !== "admin") return send(res, 403, { message: "Acesso restrito ao administrador." });
      const id = pathname.split("/")[4];
      const action = pathname.split("/")[5];
      const request = db.kyc.find((item) => item.id === id);
      if (!request) return send(res, 404, { message: "Solicitacao nao encontrada." });
      request.status = action === "approve" ? "approved" : "rejected";
      const account = db.accounts.find((item) => item.userId === request.userId);
      if (account) account.status = action === "approve" ? "Ativa" : "Reprovada";
      addAudit(db, user, action === "approve" ? "abertura_conta_aprovada" : "abertura_conta_reprovada", { requestId: id });
      saveDb(db);
      return send(res, 200, { message: action === "approve" ? "Abertura aprovada." : "Abertura reprovada." });
    }

    if (req.method === "POST" && pathname.startsWith("/api/admin/users/")) {
      if (user.role !== "admin") return send(res, 403, { message: "Acesso restrito ao administrador." });
      const parts = pathname.split("/");
      const targetId = parts[4];
      const action = parts[5];
      const target = db.users.find((item) => item.id === targetId);
      if (!target) return send(res, 404, { message: "Usuario nao encontrado." });
      if (action === "block") target.status = "blocked";
      if (action === "unblock") target.status = "active";
      addAudit(db, user, `usuario_${action}`, { targetId });
      saveDb(db);
      return send(res, 200, { message: "Usuario atualizado.", user: publicUser(target) });
    }

    if (req.method === "GET" && pathname === "/api/reports/transactions.csv") {
      const { transactions } = getAccountData(db, user);
      const csv = toCsv([
        ["id", "tipo", "descricao", "valor", "data"],
        ...transactions.map((item) => [item.id, item.type, item.description, item.amount, item.createdAt]),
      ]);
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=nexttt-transacoes.csv",
      });
      res.end(csv);
      return;
    }

    if (req.method === "GET" && pathname === "/api/reports/receipt.pdf") {
      const { account, transactions } = getAccountData(db, user);
      const last = transactions[0];
      const pdf = makeReceiptPdf({
        title: "Comprovante Nexttt Bank",
        lines: [
          `Cliente: ${user.name}`,
          `Conta: ${account ? account.number : "-"}`,
          `Operacao: ${last ? last.description : "Sem operacao"}`,
          `Valor: ${last ? last.amount : 0}`,
          `Data: ${last ? last.createdAt : now()}`,
          `ID: ${last ? last.id : crypto.randomUUID()}`,
          "Assinatura: Nexttt Bank Demo",
        ],
      });
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=nexttt-comprovante.pdf",
      });
      res.end(pdf);
      return;
    }

    return send(res, 404, { message: "Rota nao encontrada." });
  } catch (error) {
    return send(res, 500, { message: error.message || "Erro interno." });
  }
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      ...securityHeaders(),
      "Cache-Control": pathname.includes("?") ? "public, max-age=31536000, immutable" : "no-cache",
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  log("request", { method: req.method, pathname, ip: clientIp(req) });
  if (!checkRateLimit(req)) {
    return send(res, 429, { message: "Muitas requisicoes. Tente novamente em instantes." });
  }
  if (pathname.startsWith("/api/")) return handleApi(req, res, pathname);
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`Nexttt Bank rodando em http://localhost:${PORT}`);
});
