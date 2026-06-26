import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Simple in-process write queue so concurrent writes to the same file
// never interleave and corrupt the JSON on disk.
const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) ?? Promise.resolve();
  const next = prev.then(task, task);
  queues.set(
    key,
    next.catch(() => undefined)
  );
  return next;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "ENOENT") {
      await writeJson(file, fallback);
      return fallback;
    }
    throw err;
  }
}

export async function writeJson<T>(file: string, data: T): Promise<void> {
  return enqueue(file, async () => {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, file);
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const serialized = JSON.stringify(data, null, 2);
    await fs.writeFile(tmpPath, serialized, "utf-8");
    await fs.rename(tmpPath, filePath);
  });
}

export async function updateJson<T>(
  file: string,
  fallback: T,
  updater: (current: T) => T
): Promise<T> {
  return enqueue(file, async () => {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, file);
    let current: T;
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      current = raw.trim() ? (JSON.parse(raw) as T) : fallback;
    } catch {
      current = fallback;
    }
    const updated = updater(current);
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(updated, null, 2), "utf-8");
    await fs.rename(tmpPath, filePath);
    return updated;
  });
}
