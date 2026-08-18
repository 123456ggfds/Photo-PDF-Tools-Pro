import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseURL = "http://127.0.0.1:4178";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fixtures = {
  image1: path.join(root, "test-results", "e2e", "fixtures", "sample-1.png"),
  image2: path.join(root, "test-results", "e2e", "fixtures", "sample-2.png"),
  image3: path.join(root, "test-results", "e2e", "fixtures", "sample-3.png"),
  pdf: path.join(root, "test-results", "e2e", "fixtures", "source-a.pdf"),
};

for (const [name, file] of Object.entries(fixtures)) {
  if (!existsSync(file)) throw new Error(`Missing test fixture: ${name}`);
}

const server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", "4178"], { cwd: root, shell: true, stdio: "pipe" });
const waitForServer = async () => {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Preview verification server did not start");
};

const previews = [];
try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const imageTools = ["merge", "compress", "resize", "crop", "convert", "rotate", "adjustments", "watermark", "auto", "batch-crop", "exif-fix", "bg-remove"];
  for (const toolId of imageTools) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${baseURL}/tool/${toolId}`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles(toolId === "merge" || toolId === "auto" || toolId === "batch-crop" ? [fixtures.image1, fixtures.image2, fixtures.image3] : [fixtures.image1]);
    if (toolId === "auto") await page.getByRole("button", { name: /Run Pipeline/i }).click();
    if (toolId === "batch-crop") await page.getByRole("button", { name: /Apply to All/i }).click();
    if (toolId === "exif-fix") await page.getByRole("button", { name: /EXIF Fix/i }).click();
    if (toolId === "bg-remove") await page.getByRole("button", { name: /Background Remove/i }).click();
    await page.getByText("Ready to download", { exact: true }).waitFor({ timeout: 12000 });
    const canvas = page.getByTestId("main-canvas");
    await canvas.waitFor({ state: "visible", timeout: 5000 });
    const box = await canvas.boundingBox();
    if (!box || box.width < 1 || box.height < 1) throw new Error(`${toolId} output preview canvas is not visible`);
    previews.push({ toolId, canvasWidth: Math.round(box.width), canvasHeight: Math.round(box.height) });
    await page.close();
  }

  const pdfPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pdfPage.goto(`${baseURL}/pdf/pdf-to-image`, { waitUntil: "networkidle" });
  await pdfPage.locator('input[type="file"]').setInputFiles(fixtures.pdf);
  await pdfPage.getByRole("button", { name: /Convert to Images/i }).click();
  await pdfPage.getByText(/PAGES CONVERTED/i).waitFor({ timeout: 12000 });
  const thumbnailCount = await pdfPage.locator("img").count();
  if (thumbnailCount < 3) throw new Error(`PDF image previews are incomplete: expected at least 3, got ${thumbnailCount}`);
  previews.push({ toolId: "pdf-to-image", thumbnailCount });
  await pdfPage.close();
  await browser.close();
  console.log(JSON.stringify({ passed: previews.length, previews }, null, 2));
} finally {
  server.kill();
}
