const STORE_KEY = "__tarot_reading_store__";

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = { latest: null };
  }

  return globalThis[STORE_KEY];
}

export function setLatestReading(reading) {
  const store = getStore();
  store.latest = reading;
  return store.latest;
}

export function getLatestReading() {
  return getStore().latest;
}
