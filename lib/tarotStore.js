const STORE_KEY = "__tarot_reading_store__";
const HISTORY_LIMIT = 20;

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      latest: null,
      history: [],
      deck: { order: [], cursor: 0 },
    };
  }

  return globalThis[STORE_KEY];
}

export function setLatestReading(reading) {
  const store = getStore();
  store.latest = reading;

  if (reading) {
    store.history = [reading, ...store.history].slice(0, HISTORY_LIMIT);
  }

  return store.latest;
}

export function getLatestReading() {
  return getStore().latest;
}

export function getReadingHistory(limit = HISTORY_LIMIT) {
  const store = getStore();
  return store.history.slice(0, Math.min(limit, store.history.length));
}

export function getDeckState() {
  return getStore().deck;
}

export function setDeckState(deckState) {
  const store = getStore();
  store.deck = deckState;
  return store.deck;
}
