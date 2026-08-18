import { chromium } from "playwright";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const resultsDir = path.join(root, "test-results", "e2e");
const fixturesDir = path.join(resultsDir, "fixtures");
const downloadsDir = path.join(resultsDir, "downloads");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseURL = "http://127.0.0.1:4177";
const passed = [];
const failed = [];
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createPdf(filePath, pageCount, rotations = []) {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    const page = doc.addPage([240, 160]);
    page.drawRectangle({ x: 0, y: 0, width: 240, height: 160, color: rgb((index + 1) / 5, 0.25, 0.55) });
    page.drawText(`Fixture page ${index + 1}`, { x: 30, y: 70, size: 18, color: rgb(1, 1, 1) });
    if (rotations[index]) page.setRotation(degrees(rotations[index]));
  }
  await writeFile(filePath, await doc.save());
}

async function createFixtures() {
  await rm(resultsDir, { recursive: true, force: true });
  await mkdir(fixturesDir, { recursive: true });
  await mkdir(downloadsDir, { recursive: true });
  const pixels = [
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADElEQVR42mNk+M/wHwAF/gL+ShCO2wAAAABJRU5ErkJggg==",
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADElEQVR42mP8z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  ];
  const images = [];
  for (let index = 0; index < pixels.length; index += 1) {
    const file = path.join(fixturesDir, `sample-${index + 1}.png`);
    await writeFile(file, Buffer.from(pixels[index], "base64"));
    images.push(file);
  }
  const pdfA = path.join(fixturesDir, "source-a.pdf");
  const pdfB = path.join(fixturesDir, "source-b.pdf");
  const pdfRotations = path.join(fixturesDir, "source-rotations.pdf");
  await createPdf(pdfA, 3);
  await createPdf(pdfB, 1);
  await createPdf(pdfRotations, 3, [0, 90, 180]);
  return { images, pdfA, pdfB, pdfRotations };
}

function startServer() {
  server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", "4177"], { cwd: root, shell: true, stdio: "pipe" });
  server.stderr.on("data", data => process.stderr.write(data));
}

async function waitForServer() {
  for (let retry = 0; retry < 80; retry += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Vite test server did not start");
}

async function saveDownload(page, button, name) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    button.click(),
  ]);
  const saved = path.join(downloadsDir, name);
  await download.saveAs(saved);
  assert(existsSync(saved), `Download was not created: ${name}`);
  return saved;
}

async function waitForImageOutput(page) {
  await page.getByText("Ready to download", { exact: true }).waitFor({ timeout: 10000 });
  const button = page.locator("button", { hasText: "Download" }).first();
  await button.waitFor({ timeout: 5000 });
  return button;
}

async function runImageTool(browser, fixture, id, options = {}) {
  const page = await browser.newPage();
  await page.goto(`${baseURL}/tool/${id}`, { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(options.files ?? [fixture.images[0]]);
  if (options.afterUpload) await options.afterUpload(page);
  const downloadButton = await waitForImageOutput(page);
  const saved = await saveDownload(page, downloadButton, `${id}.bin`);
  const bytes = await readFile(saved);
  assert(bytes.byteLength > 20, `${id} produced an empty image output`);
  await page.screenshot({ path: path.join(resultsDir, `${id}.png`), fullPage: true });
  await page.close();
}

async function runPdfTool(browser, fixture, id, execute, verify) {
  const page = await browser.newPage();
  await page.goto(`${baseURL}/pdf/${id}`, { waitUntil: "networkidle" });
  await execute(page);
  const saved = await saveDownload(page, page.getByRole("button", { name: /Download PDF|Download merged PDF|Download compressed PDF/i }).last(), `${id}.pdf`);
  await verify(saved);
  await page.screenshot({ path: path.join(resultsDir, `${id}.png`), fullPage: true });
  await page.close();
}

async function test(name, callback) {
  try {
    await callback();
    passed.push(name);
    console.log(`PASS ${name}`);
  } catch (error) {
    failed.push({ name, error: error instanceof Error ? error.message : String(error) });
    console.error(`FAIL ${name}:`, error);
  }
}

async function main() {
  const fixture = await createFixtures();
  startServer();
  await waitForServer();
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });

  await test("圖片合併", () => runImageTool(browser, fixture, "merge", { files: fixture.images }));
  await test("圖片壓縮", () => runImageTool(browser, fixture, "compress"));
  await test("圖片調整大小", () => runImageTool(browser, fixture, "resize"));
  await test("圖片裁剪", () => runImageTool(browser, fixture, "crop"));
  await test("圖片格式轉換", () => runImageTool(browser, fixture, "convert"));
  await test("圖片旋轉翻轉", () => runImageTool(browser, fixture, "rotate"));
  await test("圖片色調調整", () => runImageTool(browser, fixture, "adjustments"));
  await test("圖片浮水印", () => runImageTool(browser, fixture, "watermark"));
  await test("自動處理線", () => runImageTool(browser, fixture, "auto", { files: fixture.images, afterUpload: page => page.getByRole("button", { name: /Run Pipeline/i }).click() }));
  await test("批次裁剪", () => runImageTool(browser, fixture, "batch-crop", { files: fixture.images, afterUpload: page => page.getByRole("button", { name: /Apply to All/i }).click() }));
  await test("EXIF 方向修正", () => runImageTool(browser, fixture, "exif-fix", { afterUpload: page => page.getByRole("button", { name: /EXIF Fix/i }).click() }));
  await test("純色背景移除", () => runImageTool(browser, fixture, "bg-remove", { afterUpload: page => page.getByRole("button", { name: /Background Remove/i }).click() }));

  await test("PDF 合併", () => runPdfTool(browser, fixture, "pdf-merge", async page => {
    await page.locator('input[type="file"]').setInputFiles([fixture.pdfA, fixture.pdfB]);
    await page.getByRole("button", { name: /Merge PDF Files/i }).click();
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPageCount() === 4, "Merged PDF does not contain four pages")));

  await test("PDF 分割", async () => {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/pdf/pdf-split`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Split PDF/i }).click();
    await page.getByText(/Split files/i).waitFor({ timeout: 10000 });
    const saved = await saveDownload(page, page.getByRole("button").filter({ has: page.locator("svg") }).last(), "pdf-split.pdf");
    assert((await PDFDocument.load(await readFile(saved))).getPageCount() === 1, "Split PDF should contain one page");
    await page.close();
  });

  await test("PDF 壓縮", () => runPdfTool(browser, fixture, "pdf-compress", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Compress PDF/i }).click();
    await page.getByText(/Original/i).waitFor({ timeout: 10000 });
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPageCount() === 3, "Compressed PDF lost pages")));

  await test("PDF 轉圖片", async () => {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/pdf/pdf-to-image`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Convert to Images/i }).click();
    await page.getByText(/Pages converted/i).waitFor({ timeout: 10000 });
    const saved = await saveDownload(page, page.getByRole("button").last(), "pdf-to-image.png");
    assert((await readFile(saved)).byteLength > 40, "PDF-to-image output is empty");
    await page.close();
  });

  await test("圖片轉 PDF", () => runPdfTool(browser, fixture, "image-to-pdf", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.images.slice(0, 2));
    await page.getByRole("button", { name: /Create PDF/i }).click();
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPageCount() === 2, "Image-to-PDF should have two pages")));

  await test("PDF 隱私清理", () => runPdfTool(browser, fixture, "pdf-protect", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Protect PDF/i }).click();
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPageCount() === 3, "Privacy-cleaned PDF lost pages")));

  await test("PDF 旋轉", () => runPdfTool(browser, fixture, "pdf-rotate", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Rotate PDF/i }).click();
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPage(0).getRotation().angle === 90, "PDF rotation was not applied")));

  await test("PDF 頁碼", () => runPdfTool(browser, fixture, "pdf-pages", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Add Page Numbers/i }).click();
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPageCount() === 3, "Page numbering changed page count")));

  await test("PDF 擷取頁面", () => runPdfTool(browser, fixture, "pdf-extract", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfA);
    await page.getByRole("button", { name: /Extract Pages/i }).click();
  }, async file => assert((await PDFDocument.load(await readFile(file))).getPageCount() === 1, "Extracted PDF should contain one page")));

  await test("PDF 自訂排序", () => runPdfTool(browser, fixture, "pdf-reorder", async page => {
    await page.locator('input[type="file"]').setInputFiles(fixture.pdfRotations);
    await page.getByRole("button", { name: /Reverse/i }).click();
    await page.getByRole("button", { name: /Rebuild PDF/i }).click();
  }, async file => {
    const doc = await PDFDocument.load(await readFile(file));
    assert(doc.getPage(0).getRotation().angle === 180, "Custom reorder did not reverse pages");
    assert(doc.getPage(2).getRotation().angle === 0, "Custom reorder output order is incorrect");
  }));

  await browser.close();
  if (server) server.kill();
  const report = { passed, failed, total: passed.length + failed.length, generatedAt: new Date().toISOString() };
  await writeFile(path.join(resultsDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  if (server) server.kill();
  process.exit(1);
});
