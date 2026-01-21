import { Redis } from "@upstash/redis";

const STORE_KEY = "__tarot_reading_store__";
const HISTORY_LIMIT = 20;
const STORAGE_KEY = process.env.TAROT_STORAGE_KEY || "tarot:state";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function defaultState() {
  return {
    active: null,
    latest: null,
    queue: [],
    history: [],
    deck: { order: [], cursor: 0 },
  };
}

function getMemoryStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = defaultState();
  }

  return globalThis[STORE_KEY];
}

function normalizeState(state) {
  if (!state || typeof state !== "object") {
    return defaultState();
  }

  return {
    active: state.active ?? null,
    latest: state.latest ?? state.active ?? null,
    queue: Array.isArray(state.queue) ? state.queue : [],
    history: Array.isArray(state.history) ? state.history : [],
    deck: state.deck ?? { order: [], cursor: 0 },
  };
}

async function loadState() {
  if (!redis) {
    return getMemoryStore();
  }

  try {
    const stored = await redis.get(STORAGE_KEY);
    if (!stored) {
      return getMemoryStore();
    }

    const parsed =
      typeof stored === "string" ? JSON.parse(stored) : stored;
    const normalized = normalizeState(parsed);
    globalThis[STORE_KEY] = normalized;
    return normalized;
  } catch (error) {
    return getMemoryStore();
  }
}

async function saveState(state) {
  const normalized = normalizeState(state);
  globalThis[STORE_KEY] = normalized;

  if (redis) {
    try {
      await redis.set(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      // keep in-memory fallback
    }
  }

  return normalized;
}

export async function enqueueReading(reading) {
  const state = await loadState();
  const history = reading
    ? [reading, ...state.history].slice(0, HISTORY_LIMIT)
    : state.history;
  const hasActive = Boolean(state.active);
  const queue = hasActive ? [...state.queue, reading] : state.queue;
  const active = hasActive ? state.active : reading;

  const nextState = await saveState({
    ...state,
    active,
    latest: active,
    queue,
    history,
  });

  return {
    status: hasActive ? "queued" : "active",
    active: nextState.active,
    queueLength: nextState.queue.length,
  };
}

export async function completeReading(readingId) {
  const state = await loadState();
  if (!state.active) {
    return { active: null, queueLength: state.queue.length };
  }

  if (readingId && state.active.id !== readingId) {
    return { active: state.active, queueLength: state.queue.length };
  }

  const queue = [...state.queue];
  const nextActive = queue.shift() || null;

  const nextState = await saveState({
    ...state,
    active: nextActive,
    latest: nextActive,
    queue,
  });

  return { active: nextState.active, queueLength: nextState.queue.length };
}

export async function getLatestReading() {
  const state = await loadState();
  return state.active;
}

export async function getQueueLength() {
  const state = await loadState();
  return state.queue.length;
}

export async function getReadingHistory(limit = HISTORY_LIMIT) {
  const state = await loadState();
  return state.history.slice(0, Math.min(limit, state.history.length));
}

export async function getDeckState() {
  const state = await loadState();
  return state.deck;
}

export async function setDeckState(deckState) {
  const state = await loadState();
  const nextState = await saveState({
    ...state,
    deck: deckState,
  });
  return nextState.deck;
}
