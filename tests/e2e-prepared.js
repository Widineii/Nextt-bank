const { spawn } = require("child_process");

async function main() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.log("E2E preparado: Playwright nao instalado. Instale com `npm i -D playwright` e `npx playwright install`.");
    return;
  }

  const port = 3517;
  const server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });

  try {
    await waitForServer(`http://127.0.0.1:${port}/api/health`);
    const browser = await launch(chromium);
    if (!browser) {
      console.log("E2E preparado: navegador Playwright indisponivel.");
      return;
    }
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/?v=5`, { waitUntil: "networkidle" });
    await page.fill("#email", "cliente@nextt.local");
    await page.fill("#password", "Nextt@123");
    await page.click("button[type='submit']");
    await page.waitForSelector("#balanceValue", { timeout: 5000 });
    const balance = await page.textContent("#balanceValue");
    if (!balance || !balance.includes("R$")) throw new Error("Dashboard nao carregou saldo.");
    await browser.close();
    console.log("Nexttt Bank: E2E passou.");
  } finally {
    server.kill();
  }
}

async function launch(chromium) {
  for (const attempt of [
    () => chromium.launch(),
    () => chromium.launch({ channel: "msedge" }),
    () => chromium.launch({ channel: "chrome" }),
  ]) {
    try {
      return await attempt();
    } catch {}
  }
  return null;
}

async function waitForServer(url) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Servidor nao iniciou para E2E.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
