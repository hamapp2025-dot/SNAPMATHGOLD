type StorageListener = () => void | Promise<void>;

const listeners = new Set<StorageListener>();

export function subscribeToStorageUpdates(listener: StorageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitStorageUpdate() {
  for (const listener of listeners) {
    Promise.resolve(listener()).catch(() => {});
  }
}

export function safeParseInt(value: string | null | undefined, fallback = 0) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeParseBoolean(value: string | null | undefined, fallback = false) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeStringArray(value: string | null | undefined) {
  const parsed = safeParseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [] as string[];
  return Array.from(new Set(parsed.filter((item): item is string => typeof item === 'string'))).sort();
}
