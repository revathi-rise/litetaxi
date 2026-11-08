// Loaded by jest before test modules. Test-only: relax rate limits so a single IP can run the suite.
process.env.THROTTLE_MULTIPLIER = '1000';
process.env.THROTTLE_LIMIT = '100000';
process.env.DB_MODE = 'memory';
process.env.OTP_MODE = 'dev';
process.env.ROUTING_PROVIDER = 'mock';
process.env.GEO_PROVIDER = 'mock';
// Deterministic dispatch: tests drive drivers and the ticker manually.
process.env.SIM_DRIVERS = 'false';
process.env.DISPATCH_TICK_MS = '0';
process.env.DISPATCH_BATCH_SIZE = '1';
