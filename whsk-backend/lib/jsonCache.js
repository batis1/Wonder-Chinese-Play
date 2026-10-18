// Public catalogues only: bounded memory, shared concurrent reads, write invalidation.
function createJsonCache({ ttl = 30000, maxEntries = 24, maxBytes = 8 * 1024 * 1024 } = {}) {
  const values = new Map();
  const pending = new Map();
  let bytes = 0;
  let generation = 0;
  const clear = () => { values.clear(); bytes = 0; generation += 1; };
  const remove = key => { const value = values.get(key); if (value) bytes -= value.body.length; values.delete(key); };
  const reply = (res, entry, state) => res.set('X-Catalog-Cache', state).type('json').send(entry.body);

  const middleware = async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl;
    let cached = values.get(key);
    if (cached && cached.expires > Date.now()) return reply(res, cached, 'HIT');
    remove(key);
    if (pending.has(key)) {
      await pending.get(key);
      if (res.destroyed) return;
      cached = values.get(key);
      if (cached && cached.expires > Date.now()) return reply(res, cached, 'SHARED');
    }
    const startedGeneration = generation;
    let release;
    const promise = new Promise(resolve => { release = resolve; });
    pending.set(key, promise);
    const finish = () => { if (pending.get(key) === promise) pending.delete(key); release(); };
    res.once('finish', finish);
    res.once('close', finish);
    const originalJson = res.json.bind(res);
    res.json = data => {
      if (res.statusCode !== 200) return originalJson(data);
      const body = Buffer.from(JSON.stringify(data));
      if (startedGeneration === generation && body.length <= maxBytes) {
        remove(key);
        while (values.size && (values.size >= maxEntries || bytes + body.length > maxBytes)) remove(values.keys().next().value);
        values.set(key, { body, expires: Date.now() + ttl });
        bytes += body.length;
      }
      return reply(res, { body }, 'MISS');
    };
    next();
  };
  const invalidateOnWrite = (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) res.once('finish', () => { if (res.statusCode < 400) clear(); });
    next();
  };
  return { middleware, invalidateOnWrite, clear };
}
module.exports = { createJsonCache };
