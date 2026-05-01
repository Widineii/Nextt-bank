const assert = require("assert");
const { spawn } = require("child_process");

const PORT = 3317;
const base = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 25; i += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await wait(200);
  }
  throw new Error("Servidor nao iniciou para teste smoke.");
}

(async () => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  });

  try {
    await waitForServer();
    const login = await fetch(`${base}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "cliente@nextt.local", password: "Nextt@123" }),
    });
    assert(login.ok, "login falhou");
    const loginData = await login.json();
    assert(loginData.token, "token ausente");

    const me = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${loginData.token}` } });
    assert(me.ok, "me falhou");
    const meData = await me.json();
    assert(meData.account, "account ausente");
    assert(Array.isArray(meData.transactions), "transactions ausentes");

    const pdf = await fetch(`${base}/api/reports/receipt.pdf`, { headers: { Authorization: `Bearer ${loginData.token}` } });
    assert(pdf.ok, "pdf falhou");
    assert((pdf.headers.get("content-type") || "").includes("application/pdf"), "pdf content-type invalido");

    console.log("Nextt Bank: API smoke passou.");
  } finally {
    child.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
