// Share only public course/catalogue reads. Account data is never stored here.
const entries = new Map();
const MAX_ENTRIES = 12;

export function cachedGet(url, ttl = 60000) {
  const cached = entries.get(url);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const entry = { expires: Infinity };
  entry.promise = fetch(url).then(response => {
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }).then(value => { entry.value = value; entry.expires = Date.now() + ttl; return value; }).catch(error => {
    if (entries.get(url) === entry) entries.delete(url);
    throw error;
  });
  entries.delete(url);
  entries.set(url, entry);
  while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value);
  return entry.promise;
}

export function clearCachedGet(url) { if (url) entries.delete(url); else entries.clear(); }
export function peekCachedGet(url) { const entry = entries.get(url); return entry?.expires > Date.now() ? entry.value : undefined; }
