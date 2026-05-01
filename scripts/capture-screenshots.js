const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "portfolio", "screenshots");
const port = 3400;

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (error) {
    fs.writeFileSync(
      path.join(outDir, "README.txt"),
      [
        "Playwright nao esta disponivel neste Node.",
        "Para tirar prints manualmente:",
        "1. Rode: npm start",
        "2. Abra: http://localhost:3000/?v=5",
        "3. Capture login, dashboard, conta, cartao, investimentos, admin e mobile.",
      ].join("\n"),
    );
    console.log("Playwright indisponivel. Instrucoes criadas em portfolio/screenshots/README.txt");
    return;
  }

  const server = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });

  try {
    await waitForServer(`http://127.0.0.1:${port}/api/health`);
    let browser;
    browser = await launchAvailableBrowser(chromium);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/?v=5`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outDir, "01-login.png"), fullPage: true });
    await page.fill("#email", "cliente@nextt.local");
    await page.fill("#password", "Nextt@123");
    await page.click("button[type='submit']");
    await page.waitForSelector("#balanceValue", { timeout: 5000 });
    await page.screenshot({ path: path.join(outDir, "02-dashboard-desktop.png"), fullPage: true });
    await page.click('[data-view="account"]');
    await page.screenshot({ path: path.join(outDir, "03-conta-pix.png"), fullPage: true });
    await page.click('[data-view="cards"]');
    await page.screenshot({ path: path.join(outDir, "04-cartao.png"), fullPage: true });
    await page.click('[data-view="investments"]');
    await page.screenshot({ path: path.join(outDir, "05-investimentos.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await mobile.goto(`http://127.0.0.1:${port}/?v=5`, { waitUntil: "networkidle" });
    await mobile.fill("#email", "cliente@nextt.local");
    await mobile.fill("#password", "Nextt@123");
    await mobile.click("button[type='submit']");
    await mobile.waitForSelector("#balanceValue", { timeout: 5000 });
    await mobile.screenshot({ path: path.join(outDir, "06-mobile-dashboard.png"), fullPage: true });
    await browser.close();
    console.log(`Prints salvos em ${outDir}`);
  } finally {
    server.kill();
  }
}

async function launchAvailableBrowser(chromium) {
  const attempts = [
    () => chromium.launch(),
    () => chromium.launch({ channel: "msedge" }),
    () => chromium.launch({ channel: "chrome" }),
  ];
  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }
  writeManualInstructions(`Nenhum navegador compativel foi encontrado para Playwright: ${lastError.message}`);
  console.log("Navegador indisponivel. Instrucoes criadas em portfolio/screenshots/README.txt");
  throw new Error("SCREENSHOT_FALLBACK_READY");
}

function writeManualInstructions(reason) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "README.txt"),
    [
      reason,
      "",
      "Para tirar prints manualmente:",
      "1. Rode: .\\start-nextt-visible.bat",
      "2. Abra: http://localhost:3000/?v=5",
      "3. Use Ctrl+F5 se aparecer cache antigo.",
      "4. Capture estas telas:",
      "   - 01-login.png",
      "   - 02-dashboard-desktop.png",
      "   - 03-conta-pix.png",
      "   - 04-cartao.png",
      "   - 05-investimentos.png",
      "   - 06-admin.png",
      "   - 07-mobile-dashboard.png",
    ].join("\n"),
  );
}

async function waitForServer(url) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Servidor nao iniciou para capturar prints.");
}

main().catch((error) => {
  if (error.message === "SCREENSHOT_FALLBACK_READY") process.exit(0);
  console.error(error);
  process.exit(1);
});
