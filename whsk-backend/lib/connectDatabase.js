function connectDatabase(mongoose, uri, { schedule = setTimeout, retryDelay = 5000, logger = console } = {}) {
  let stopped = false;
  let retry;
  let connecting;
  const connect = () => {
    if (stopped) return Promise.resolve();
    if (connecting) return connecting;
    clearTimeout(retry);
    connecting = (async () => {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        poolSize: 10,
      });
      logger.info("Connected to DB");
    } catch {
      if (stopped) return;
      logger.error("MongoDB connection unavailable. Retrying in 5 seconds.");
      retry = schedule(connect, retryDelay);
      retry.unref?.();
    } finally {
      connecting = null;
    }
    })();
    return connecting;
  };
  connect();
  const stop = () => { stopped = true; clearTimeout(retry); };
  stop.ready = () => connecting || (mongoose.connection?.readyState === 1 ? Promise.resolve() : connect());
  return stop;
}

module.exports = { connectDatabase };
