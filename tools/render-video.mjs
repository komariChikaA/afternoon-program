import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

function argumentsFrom(argv) {
  const result = { fps: 60, width: 1920, height: 1080, out: "frames" };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === "--fps") result.fps = Number(argv[++index]);
    else if (key === "--width") result.width = Number(argv[++index]);
    else if (key === "--height") result.height = Number(argv[++index]);
    else if (key === "--out") result.out = argv[++index];
    else throw new Error(`Unknown argument: ${key}`);
  }
  if (![result.fps, result.width, result.height].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("fps, width, and height must be positive numbers");
  }
  return result;
}

const options = argumentsFrom(process.argv.slice(2));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, options.out);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ["--allow-file-access-from-files"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: options.width, height: options.height, deviceScaleFactor: 1 });
  const url = `${pathToFileURL(path.join(root, "app.html")).href}?render=1`;
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(async () => {
    await window.VN_READY;
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
  });

  const total = await page.evaluate(() => window.VNPlayer.totalDuration());
  const frames = Math.ceil(total / 1000 * options.fps);
  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / options.fps * 1000;
    await page.evaluate(async (milliseconds) => {
      window.VNPlayer.seek(milliseconds);
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }, time);
    const filename = `frame-${String(frame).padStart(6, "0")}.png`;
    await page.screenshot({ path: path.join(output, filename), type: "png" });
    if (frame % options.fps === 0) process.stdout.write(`Rendered ${frame}/${frames}\r`);
  }
  process.stdout.write(`Rendered ${frames}/${frames}\n`);
  console.log(`Frames saved to ${output}`);
} finally {
  await browser.close();
}
