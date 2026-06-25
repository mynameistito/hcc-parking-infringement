var __defProp = Object.defineProperty;
var __name = (target, value) =>
  __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now
  ? globalThis.performance.now.bind(globalThis.performance)
  : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0,
  },
  detail: void 0,
  toJSON() {
    return this;
  },
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail,
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName
      ? this._entries.filter((e) => e.name !== markName)
      : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName
      ? this._entries.filter((e) => e.name !== measureName)
      : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter(
      (e) => e.entryType !== "resource" || e.entryType !== "navigation"
    );
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter(
      (e) => e.name === name && (!type || e.entryType === type)
    );
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]
        ?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end,
      },
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance =
  globalThis.performance && "addEventListener" in globalThis.performance
    ? globalThis.performance
    : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ __name(function hrtime2(startTime) {
    const now = Date.now();
    const seconds = Math.trunc(now / 1e3);
    const nanos = (now % 1e3) * 1e6;
    if (startTime) {
      let diffSeconds = seconds - startTime[0];
      let diffNanos = nanos - startTime[0];
      if (diffNanos < 0) {
        diffSeconds = diffSeconds - 1;
        diffNanos = 1e9 + diffNanos;
      }
      return [diffSeconds, diffNanos];
    }
    return [seconds, nanos];
  }, "hrtime"),
  {
    bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint"),
  }
);

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {}
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [
      ...Object.getOwnPropertyNames(_Process.prototype),
      ...Object.getOwnPropertyNames(EventEmitter.prototype),
    ]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(
      `${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`
    );
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return (this.#stdin ??= new ReadStream(0));
  }
  get stdout() {
    return (this.#stdout ??= new WriteStream(1));
  }
  get stderr() {
    return (this.#stderr ??= new WriteStream(2));
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {}
  unref() {}
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError(
      "process.setUncaughtExceptionCaptureCallback"
    );
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError(
      "process.hasUncaughtExceptionCaptureCallback"
    );
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = {
    has: /* @__PURE__ */ notImplemented("process.permission.has"),
  };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport"),
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented(
      "process.finalization.unregister"
    ),
    registerBeforeExit: /* @__PURE__ */ notImplemented(
      "process.finalization.registerBeforeExit"
    ),
  };
  memoryUsage = Object.assign(
    () => ({
      arrayBuffers: 0,
      rss: 0,
      external: 0,
      heapTotal: 0,
      heapUsed: 0,
    }),
    { rss: /* @__PURE__ */ __name(() => 0, "rss") }
  );
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick,
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions,
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding,
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = (i === middleware.length && next) || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  res;
  status;
  /**
   * Creates an instance of `HTTPException`.
   * @param status - HTTP status code for the exception. Defaults to 500.
   * @param options - Additional options for the exception.
   */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
   * Returns the response object associated with the exception.
   * If a response object is not provided, a new response is created with the error message and status code.
   * @returns The response object.
   */
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers,
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status,
    });
  }
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(
  async (request, options = /* @__PURE__ */ Object.create(null)) => {
    const { all = false, dot = false } = options;
    const headers =
      request instanceof HonoRequest ? request.raw.headers : request.headers;
    const contentType = headers.get("Content-Type");
    if (
      contentType?.startsWith("multipart/form-data") ||
      contentType?.startsWith("application/x-www-form-urlencoded")
    ) {
      return parseFormData(request, { all, dot });
    }
    return {};
  },
  "parseBody"
);
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (
        !nestedForm[key2] ||
        typeof nestedForm[key2] !== "object" ||
        Array.isArray(nestedForm[key2]) ||
        nestedForm[key2] instanceof File
      ) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match3, index) => {
    const mark = `@${index}`;
    groups.push([mark, match3]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match3 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match3) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match3[2]) {
        patternCache[cacheKey] =
          next && next[0] !== ":" && next[0] !== "*"
            ? [cacheKey, match3[1], new RegExp(`^${match3[2]}(?=/${next})`)]
            : [label, match3[1], new RegExp(`^${match3[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match3[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match3) => {
      try {
        return decoder(match3);
      } catch {
        return match3;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name(
  (str) => tryDecode(str, decodeURI),
  "tryDecodeURI"
);
var getPath = /* @__PURE__ */ __name((request) => {
  const url2 = request.url;
  const start = url2.indexOf("/", url2.indexOf(":") + 4);
  let i = start;
  for (; i < url2.length; i++) {
    const charCode = url2.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url2.indexOf("?", i);
      const hashIndex = url2.indexOf("#", i);
      const end =
        queryIndex === -1
          ? hashIndex === -1
            ? void 0
            : hashIndex
          : hashIndex === -1
            ? queryIndex
            : Math.min(queryIndex, hashIndex);
      const path = url2.slice(start, end);
      return tryDecodeURI(
        path.includes("%25") ? path.replace(/%25/g, "%2525") : path
      );
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url2.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/"
    ? result.slice(0, -1)
    : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1
    ? tryDecode(value, decodeURIComponent_)
    : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url2, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url2.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url2.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url2.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url2.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url2.indexOf("&", valueIndex);
        return _decodeURI(
          url2.slice(valueIndex, endIndex === -1 ? void 0 : endIndex)
        );
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url2.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url2);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url2);
  let keyIndex = url2.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url2.indexOf("&", keyIndex + 1);
    let valueIndex = url2.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url2.slice(
      keyIndex + 1,
      valueIndex === -1
        ? nextKeyIndex === -1
          ? void 0
          : nextKeyIndex
        : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url2.slice(
        valueIndex + 1,
        nextKeyIndex === -1 ? void 0 : nextKeyIndex
      );
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url2, key) => {
  return _getQueryParam(url2, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name(
  (str) => tryDecode(str, decodeURIComponent_),
  "tryDecodeURIComponent"
);
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(
        this.#matchResult[0][this.routeIndex][1][key]
      );
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return (bodyCache[key] = raw2[key]());
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then(
      (buffer) => new Uint8Array(buffer)
    );
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex]
      .path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3,
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(
  async (str, phase, preserveCallbacks, context, buffer) => {
    if (typeof str === "object" && !(str instanceof String)) {
      if (!(str instanceof Promise)) {
        str = str.toString();
      }
      if (str instanceof Promise) {
        str = await str;
      }
    }
    const callbacks = str.callbacks;
    if (!callbacks?.length) {
      return Promise.resolve(str);
    }
    if (buffer) {
      buffer[0] += str;
    } else {
      buffer = [str];
    }
    const resStr = Promise.all(
      callbacks.map((c) => c({ phase, buffer, context }))
    ).then((res) =>
      Promise.all(
        res
          .filter(Boolean)
          .map((str2) => resolveCallback(str2, phase, false, context, buffer))
      ).then(() => buffer[0])
    );
    if (preserveCallbacks) {
      return raw(await resStr, callbacks);
    } else {
      return resStr;
    }
  },
  "resolveCallback"
);

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers,
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name(
  (body, init) => new Response(body, init),
  "createResponseInstance"
);
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(
      this.#rawRequest,
      this.#path,
      this.#matchResult
    );
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return (this.#res ||= createResponseInstance(null, {
      headers: (this.#preparedHeaders ??= new Headers()),
    }));
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name(
    (layout) => (this.#layout = layout),
    "setLayout"
  );
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res
      ? this.#res.headers
      : (this.#preparedHeaders ??= new Headers());
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res
      ? new Headers(this.#res.headers)
      : (this.#preparedHeaders ?? new Headers());
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders =
        arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status =
      typeof arg === "number" ? arg : (arg?.status ?? this.#status);
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name(
    (...args) => this.#newResponse(...args),
    "newResponse"
  );
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name(
    (data, arg, headers) => this.#newResponse(data, arg, headers),
    "body"
  );
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders &&
      !this.#status &&
      !arg &&
      !headers &&
      !this.finalized
      ? new Response(text)
      : this.#newResponse(
          text,
          arg,
          setDefaultContentType(TEXT_PLAIN, headers)
        );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object2, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object2),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name(
      (html2) =>
        this.#newResponse(
          html2,
          arg,
          setDefaultContentType("text/html; charset=UTF-8", headers)
        ),
      "res"
    );
    return typeof html === "object"
      ? resolveCallback(
          html,
          HtmlEscapedCallbackPhase.Stringify,
          false,
          {}
        ).then(res)
      : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString)
        ? locationString
        : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT =
  "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath =
      (strict ?? true) ? (options.getPath ?? getPath) : getPathNoStrict;
  }
  #clone() {
    const clone2 = new _Hono({
      router: this.router,
      getPath: this.getPath,
    });
    clone2.errorHandler = this.errorHandler;
    clone2.#notFoundHandler = this.#notFoundHandler;
    clone2.routes = this.routes;
    return clone2;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(
          async (c, next) =>
            (await compose([], app2.errorHandler)(c, () => r.handler(c, next)))
              .res,
          "handler"
        );
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name(
            (request) => request,
            "replaceRequest"
          );
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler
      ? (c) => {
          const options2 = optionHandler(c);
          return Array.isArray(options2) ? options2 : [options2];
        }
      : (c) => {
          let executionContext = void 0;
          try {
            executionContext = c.executionCtx;
          } catch {}
          return [c.env, executionContext];
        };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url2 = new URL(request.url);
        url2.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url2, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(
        replaceRequest(c.req.raw),
        ...getOptions(c)
      );
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath:
        baseRoutePath !== void 0
          ? mergePath(this._basePath, baseRoutePath)
          : this._basePath,
      path,
      method,
      handler,
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () =>
        new Response(
          null,
          await this.#dispatch(request, executionCtx, env2, "GET")
        ))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler,
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise
        ? res
            .then(
              (resolved) =>
                resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
            )
            .catch((err) => this.#handleError(err, c))
        : (res ?? this.#notFoundHandler(c));
    }
    const composed = compose(
      matchResult[0],
      this.errorHandler,
      this.#notFoundHandler
    );
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(
        requestInit ? new Request(input, requestInit) : input,
        Env,
        executionCtx
      );
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input)
          ? input
          : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(
        this.#dispatch(event.request, event, void 0, event.request.method)
      );
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match22 = /* @__PURE__ */ __name(
    (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match3 = path2.match(matcher[0]);
      if (!match3) {
        return [[], emptyParam];
      }
      const index = match3.indexOf("", 1);
      return [matcher[1][index], match3];
    },
    "match2"
  );
  this.match = match22;
  return match22(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? (a < b ? -1 : 1) : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (
    b === ONLY_WILDCARD_REG_EXP_STR ||
    b === TAIL_WILDCARD_REG_EXP_STR
  ) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? (a < b ? -1 : 1) : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern =
      token === "*"
        ? restTokens.length === 0
          ? ["", "", ONLY_WILDCARD_REG_EXP_STR]
          : ["", "", LABEL_REG_EXP_STR]
        : token === "/*"
          ? ["", "", TAIL_WILDCARD_REG_EXP_STR]
          : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (
          Object.keys(this.#children).some(
            (k) =>
              k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
          )
        ) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (
          Object.keys(this.#children).some(
            (k) =>
              k.length > 1 &&
              k !== ONLY_WILDCARD_REG_EXP_STR &&
              k !== TAIL_WILDCARD_REG_EXP_STR
          )
        ) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (
        (typeof c.#varIndex === "number"
          ? `(${k})@${c.#varIndex}`
          : regExpMetaChars.has(k)
            ? `\\${k}`
            : k) + c.buildRegExpStr()
      );
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(
      tokens,
      index,
      paramAssoc,
      this.#context,
      pathErrorCheckOnly
    );
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(
      /#(\d+)|@(\d+)|\.\*\$/g,
      (_, handlerIndex, paramIndex) => {
        if (handlerIndex !== void 0) {
          indexReplacementMap[++captureIndex] = Number(handlerIndex);
          return "$()";
        }
        if (paramIndex !== void 0) {
          paramReplacementMap[Number(paramIndex)] = ++captureIndex;
          return "";
        }
        return "";
      }
    );
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return (wildcardRegExpCache[path] ??= new RegExp(
    path === "*"
      ? ""
      : `^${path.replace(/\/\*$|([.\\+*[^\]$()])/g, (_, metaChar) =>
          metaChar ? `\\${metaChar}` : "(?:|/.*)"
        )}$`
  ));
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes
    .map((route) => [!/\*|\/:/.test(route[0]), ...route])
    .sort(([isStaticA, pathA], [isStaticB, pathB]) =>
      isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
    );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [
        handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]),
        emptyParam,
      ];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map2 = handlerData[i][j]?.[1];
      if (!map2) {
        continue;
      }
      const keys = Object.keys(map2);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map2[keys[k]] = paramReplacementMap[map2[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(
  buildMatcherFromPreprocessedRoutes,
  "buildMatcherFromPreprocessedRoutes"
);
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = {
      [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null),
    };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||=
            findMiddleware(middleware[m], path) ||
            findMiddleware(middleware[METHOD_NAME_ALL], path) ||
            [];
        });
      } else {
        middleware[method][path] ||=
          findMiddleware(middleware[method], path) ||
          findMiddleware(middleware[METHOD_NAME_ALL], path) ||
          [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...(findMiddleware(middleware[m], path2) ||
              findMiddleware(middleware[METHOD_NAME_ALL], path2) ||
              []),
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes)
      .concat(Object.keys(this.#middleware))
      .forEach((method) => {
        matchers[method] ||= this.#buildMatcher(method);
      });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method]
        ? Object.keys(r[method]).map((path) => [path, r[method][path]])
        : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [
            path,
            r[METHOD_NAME_ALL][path],
          ])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order,
      },
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || (params && params !== emptyParams)) {
          for (
            let i2 = 0, len2 = handlerSet.possibleKeys.length;
            i2 < len2;
            i2++
          ) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] =
              params?.[key] && !processed
                ? params[key]
                : (nodeParams[key] ?? params?.[key]);
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(
                handlerSets,
                nextNode.#children["*"],
                method,
                node.#params
              );
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params =
            node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(
                handlerSets,
                child,
                method,
                node.#params,
                params
              );
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = (curNodesQueue[componentCount] ||= []);
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(
                handlerSets,
                child,
                method,
                params,
                node.#params
              );
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router =
      options.router ??
      new SmartRouter({
        routers: [new RegExpRouter(), new TrieRouter()],
      });
  }
};

// src/server/auth.ts
var parseApiKeys = /* @__PURE__ */ __name((apiKeyValue) => {
  if (apiKeyValue === void 0 || apiKeyValue === "") {
    return /* @__PURE__ */ new Set();
  }
  return new Set(
    apiKeyValue
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean)
  );
}, "parseApiKeys");
var extractBearerToken = /* @__PURE__ */ __name((authorization) => {
  if (authorization === void 0 || authorization === "") {
    return null;
  }
  const match3 = /^Bearer\s+(?<token>.+)$/iu.exec(authorization);
  return match3?.groups?.token?.trim() ?? null;
}, "extractBearerToken");
var verifyApiKey = /* @__PURE__ */ __name((request, env2) => {
  const validKeys = parseApiKeys(env2.API_KEY);
  if (validKeys.size === 0) {
    return false;
  }
  const bearer = extractBearerToken(
    request.headers.get("Authorization") ?? void 0
  );
  if (bearer !== null && validKeys.has(bearer)) {
    return true;
  }
  const headerKey = request.headers.get("X-API-Key")?.trim();
  return headerKey !== void 0 && headerKey !== "" && validKeys.has(headerKey);
}, "verifyApiKey");
var verifyCronSecret = /* @__PURE__ */ __name((request, env2) => {
  const secret = env2.CRON_SECRET?.trim();
  if (secret === void 0 || secret === "") {
    return false;
  }
  const bearer = extractBearerToken(
    request.headers.get("Authorization") ?? void 0
  );
  if (bearer === secret) {
    return true;
  }
  const headerSecret = request.headers.get("X-Cron-Secret")?.trim();
  return headerSecret === secret;
}, "verifyCronSecret");
var verifyApiKeyOrCronSecret = /* @__PURE__ */ __name(
  (request, env2) =>
    verifyApiKey(request, env2) || verifyCronSecret(request, env2),
  "verifyApiKeyOrCronSecret"
);

// src/server/store.ts
var STORE_NAME = "hamilton-parking";
var getParkingStore = /* @__PURE__ */ __name(
  (env2) => env2.PARKING_STORE.getByName(STORE_NAME, { locationHint: "oc" }),
  "getParkingStore"
);

// src/server/cache.ts
var getCacheStatus = /* @__PURE__ */ __name(
  async (env2) => await getParkingStore(env2).getCacheStatus(),
  "getCacheStatus"
);

// src/server/explore.ts
var browseSuburbs = /* @__PURE__ */ __name(
  async (env2, query) => await getParkingStore(env2).browseSuburbs(query),
  "browseSuburbs"
);
var browseStreets = /* @__PURE__ */ __name(
  async (env2, query) => await getParkingStore(env2).browseStreets(query),
  "browseStreets"
);
var browseVehicles = /* @__PURE__ */ __name(
  async (env2, query) => await getParkingStore(env2).browseVehicles(query),
  "browseVehicles"
);
var getTopVehicles = /* @__PURE__ */ __name(
  async (env2, limit = 10) => await getParkingStore(env2).getTopVehicles(limit),
  "getTopVehicles"
);
var exploreInfringements = /* @__PURE__ */ __name(
  async (env2, query) => await getParkingStore(env2).listInfringements(query),
  "exploreInfringements"
);

// src/server/geocode.ts
import { setTimeout as delay } from "node:timers/promises";

// node_modules/zod/v4/classic/external.js
var external_exports = {};
__export(external_exports, {
  $brand: () => $brand,
  $input: () => $input,
  $output: () => $output,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRealError: () => ZodRealError,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint3,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  clone: () => clone,
  codec: () => codec,
  coerce: () => coerce_exports,
  config: () => config2,
  core: () => core_exports2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  decode: () => decode2,
  decodeAsync: () => decodeAsync2,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  encode: () => encode2,
  encodeAsync: () => encodeAsync2,
  endsWith: () => _endsWith,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  flattenError: () => flattenError,
  float32: () => float32,
  float64: () => float64,
  formatError: () => formatError,
  fromJSONSchema: () => fromJSONSchema,
  function: () => _function,
  getErrorMap: () => getErrorMap,
  globalRegistry: () => globalRegistry,
  gt: () => _gt,
  gte: () => _gte,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  includes: () => _includes,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  iso: () => iso_exports,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  length: () => _length,
  literal: () => literal,
  locales: () => locales_exports,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  mac: () => mac2,
  map: () => map,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  meta: () => meta2,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  negative: () => _negative,
  never: () => never,
  nonnegative: () => _nonnegative,
  nonoptional: () => nonoptional,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  overwrite: () => _overwrite,
  parse: () => parse2,
  parseAsync: () => parseAsync2,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  positive: () => _positive,
  prefault: () => prefault,
  preprocess: () => preprocess,
  prettifyError: () => prettifyError,
  promise: () => promise,
  property: () => _property,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  regex: () => _regex,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode2,
  safeDecodeAsync: () => safeDecodeAsync2,
  safeEncode: () => safeEncode2,
  safeEncodeAsync: () => safeEncodeAsync2,
  safeParse: () => safeParse2,
  safeParseAsync: () => safeParseAsync2,
  set: () => set,
  setErrorMap: () => setErrorMap,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  toJSONSchema: () => toJSONSchema,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  transform: () => transform,
  treeifyError: () => treeifyError,
  trim: () => _trim,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  uppercase: () => _uppercase,
  url: () => url,
  util: () => util_exports,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor,
});

// node_modules/zod/v4/core/index.js
var core_exports2 = {};
__export(core_exports2, {
  $ZodAny: () => $ZodAny,
  $ZodArray: () => $ZodArray,
  $ZodAsyncError: () => $ZodAsyncError,
  $ZodBase64: () => $ZodBase64,
  $ZodBase64URL: () => $ZodBase64URL,
  $ZodBigInt: () => $ZodBigInt,
  $ZodBigIntFormat: () => $ZodBigIntFormat,
  $ZodBoolean: () => $ZodBoolean,
  $ZodCIDRv4: () => $ZodCIDRv4,
  $ZodCIDRv6: () => $ZodCIDRv6,
  $ZodCUID: () => $ZodCUID,
  $ZodCUID2: () => $ZodCUID2,
  $ZodCatch: () => $ZodCatch,
  $ZodCheck: () => $ZodCheck,
  $ZodCheckBigIntFormat: () => $ZodCheckBigIntFormat,
  $ZodCheckEndsWith: () => $ZodCheckEndsWith,
  $ZodCheckGreaterThan: () => $ZodCheckGreaterThan,
  $ZodCheckIncludes: () => $ZodCheckIncludes,
  $ZodCheckLengthEquals: () => $ZodCheckLengthEquals,
  $ZodCheckLessThan: () => $ZodCheckLessThan,
  $ZodCheckLowerCase: () => $ZodCheckLowerCase,
  $ZodCheckMaxLength: () => $ZodCheckMaxLength,
  $ZodCheckMaxSize: () => $ZodCheckMaxSize,
  $ZodCheckMimeType: () => $ZodCheckMimeType,
  $ZodCheckMinLength: () => $ZodCheckMinLength,
  $ZodCheckMinSize: () => $ZodCheckMinSize,
  $ZodCheckMultipleOf: () => $ZodCheckMultipleOf,
  $ZodCheckNumberFormat: () => $ZodCheckNumberFormat,
  $ZodCheckOverwrite: () => $ZodCheckOverwrite,
  $ZodCheckProperty: () => $ZodCheckProperty,
  $ZodCheckRegex: () => $ZodCheckRegex,
  $ZodCheckSizeEquals: () => $ZodCheckSizeEquals,
  $ZodCheckStartsWith: () => $ZodCheckStartsWith,
  $ZodCheckStringFormat: () => $ZodCheckStringFormat,
  $ZodCheckUpperCase: () => $ZodCheckUpperCase,
  $ZodCodec: () => $ZodCodec,
  $ZodCustom: () => $ZodCustom,
  $ZodCustomStringFormat: () => $ZodCustomStringFormat,
  $ZodDate: () => $ZodDate,
  $ZodDefault: () => $ZodDefault,
  $ZodDiscriminatedUnion: () => $ZodDiscriminatedUnion,
  $ZodE164: () => $ZodE164,
  $ZodEmail: () => $ZodEmail,
  $ZodEmoji: () => $ZodEmoji,
  $ZodEncodeError: () => $ZodEncodeError,
  $ZodEnum: () => $ZodEnum,
  $ZodError: () => $ZodError,
  $ZodExactOptional: () => $ZodExactOptional,
  $ZodFile: () => $ZodFile,
  $ZodFunction: () => $ZodFunction,
  $ZodGUID: () => $ZodGUID,
  $ZodIPv4: () => $ZodIPv4,
  $ZodIPv6: () => $ZodIPv6,
  $ZodISODate: () => $ZodISODate,
  $ZodISODateTime: () => $ZodISODateTime,
  $ZodISODuration: () => $ZodISODuration,
  $ZodISOTime: () => $ZodISOTime,
  $ZodIntersection: () => $ZodIntersection,
  $ZodJWT: () => $ZodJWT,
  $ZodKSUID: () => $ZodKSUID,
  $ZodLazy: () => $ZodLazy,
  $ZodLiteral: () => $ZodLiteral,
  $ZodMAC: () => $ZodMAC,
  $ZodMap: () => $ZodMap,
  $ZodNaN: () => $ZodNaN,
  $ZodNanoID: () => $ZodNanoID,
  $ZodNever: () => $ZodNever,
  $ZodNonOptional: () => $ZodNonOptional,
  $ZodNull: () => $ZodNull,
  $ZodNullable: () => $ZodNullable,
  $ZodNumber: () => $ZodNumber,
  $ZodNumberFormat: () => $ZodNumberFormat,
  $ZodObject: () => $ZodObject,
  $ZodObjectJIT: () => $ZodObjectJIT,
  $ZodOptional: () => $ZodOptional,
  $ZodPipe: () => $ZodPipe,
  $ZodPrefault: () => $ZodPrefault,
  $ZodPreprocess: () => $ZodPreprocess,
  $ZodPromise: () => $ZodPromise,
  $ZodReadonly: () => $ZodReadonly,
  $ZodRealError: () => $ZodRealError,
  $ZodRecord: () => $ZodRecord,
  $ZodRegistry: () => $ZodRegistry,
  $ZodSet: () => $ZodSet,
  $ZodString: () => $ZodString,
  $ZodStringFormat: () => $ZodStringFormat,
  $ZodSuccess: () => $ZodSuccess,
  $ZodSymbol: () => $ZodSymbol,
  $ZodTemplateLiteral: () => $ZodTemplateLiteral,
  $ZodTransform: () => $ZodTransform,
  $ZodTuple: () => $ZodTuple,
  $ZodType: () => $ZodType,
  $ZodULID: () => $ZodULID,
  $ZodURL: () => $ZodURL,
  $ZodUUID: () => $ZodUUID,
  $ZodUndefined: () => $ZodUndefined,
  $ZodUnion: () => $ZodUnion,
  $ZodUnknown: () => $ZodUnknown,
  $ZodVoid: () => $ZodVoid,
  $ZodXID: () => $ZodXID,
  $ZodXor: () => $ZodXor,
  $brand: () => $brand,
  $constructor: () => $constructor,
  $input: () => $input,
  $output: () => $output,
  Doc: () => Doc,
  JSONSchema: () => json_schema_exports,
  JSONSchemaGenerator: () => JSONSchemaGenerator,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  _any: () => _any,
  _array: () => _array,
  _base64: () => _base64,
  _base64url: () => _base64url,
  _bigint: () => _bigint,
  _boolean: () => _boolean,
  _catch: () => _catch,
  _check: () => _check,
  _cidrv4: () => _cidrv4,
  _cidrv6: () => _cidrv6,
  _coercedBigint: () => _coercedBigint,
  _coercedBoolean: () => _coercedBoolean,
  _coercedDate: () => _coercedDate,
  _coercedNumber: () => _coercedNumber,
  _coercedString: () => _coercedString,
  _cuid: () => _cuid,
  _cuid2: () => _cuid2,
  _custom: () => _custom,
  _date: () => _date,
  _decode: () => _decode,
  _decodeAsync: () => _decodeAsync,
  _default: () => _default,
  _discriminatedUnion: () => _discriminatedUnion,
  _e164: () => _e164,
  _email: () => _email,
  _emoji: () => _emoji2,
  _encode: () => _encode,
  _encodeAsync: () => _encodeAsync,
  _endsWith: () => _endsWith,
  _enum: () => _enum,
  _file: () => _file,
  _float32: () => _float32,
  _float64: () => _float64,
  _gt: () => _gt,
  _gte: () => _gte,
  _guid: () => _guid,
  _includes: () => _includes,
  _int: () => _int,
  _int32: () => _int32,
  _int64: () => _int64,
  _intersection: () => _intersection,
  _ipv4: () => _ipv4,
  _ipv6: () => _ipv6,
  _isoDate: () => _isoDate,
  _isoDateTime: () => _isoDateTime,
  _isoDuration: () => _isoDuration,
  _isoTime: () => _isoTime,
  _jwt: () => _jwt,
  _ksuid: () => _ksuid,
  _lazy: () => _lazy,
  _length: () => _length,
  _literal: () => _literal,
  _lowercase: () => _lowercase,
  _lt: () => _lt,
  _lte: () => _lte,
  _mac: () => _mac,
  _map: () => _map,
  _max: () => _lte,
  _maxLength: () => _maxLength,
  _maxSize: () => _maxSize,
  _mime: () => _mime,
  _min: () => _gte,
  _minLength: () => _minLength,
  _minSize: () => _minSize,
  _multipleOf: () => _multipleOf,
  _nan: () => _nan,
  _nanoid: () => _nanoid,
  _nativeEnum: () => _nativeEnum,
  _negative: () => _negative,
  _never: () => _never,
  _nonnegative: () => _nonnegative,
  _nonoptional: () => _nonoptional,
  _nonpositive: () => _nonpositive,
  _normalize: () => _normalize,
  _null: () => _null2,
  _nullable: () => _nullable,
  _number: () => _number,
  _optional: () => _optional,
  _overwrite: () => _overwrite,
  _parse: () => _parse,
  _parseAsync: () => _parseAsync,
  _pipe: () => _pipe,
  _positive: () => _positive,
  _promise: () => _promise,
  _property: () => _property,
  _readonly: () => _readonly,
  _record: () => _record,
  _refine: () => _refine,
  _regex: () => _regex,
  _safeDecode: () => _safeDecode,
  _safeDecodeAsync: () => _safeDecodeAsync,
  _safeEncode: () => _safeEncode,
  _safeEncodeAsync: () => _safeEncodeAsync,
  _safeParse: () => _safeParse,
  _safeParseAsync: () => _safeParseAsync,
  _set: () => _set,
  _size: () => _size,
  _slugify: () => _slugify,
  _startsWith: () => _startsWith,
  _string: () => _string,
  _stringFormat: () => _stringFormat,
  _stringbool: () => _stringbool,
  _success: () => _success,
  _superRefine: () => _superRefine,
  _symbol: () => _symbol,
  _templateLiteral: () => _templateLiteral,
  _toLowerCase: () => _toLowerCase,
  _toUpperCase: () => _toUpperCase,
  _transform: () => _transform,
  _trim: () => _trim,
  _tuple: () => _tuple,
  _uint32: () => _uint32,
  _uint64: () => _uint64,
  _ulid: () => _ulid,
  _undefined: () => _undefined2,
  _union: () => _union,
  _unknown: () => _unknown,
  _uppercase: () => _uppercase,
  _url: () => _url,
  _uuid: () => _uuid,
  _uuidv4: () => _uuidv4,
  _uuidv6: () => _uuidv6,
  _uuidv7: () => _uuidv7,
  _void: () => _void,
  _xid: () => _xid,
  _xor: () => _xor,
  clone: () => clone,
  config: () => config2,
  createStandardJSONSchemaMethod: () => createStandardJSONSchemaMethod,
  createToJSONSchemaMethod: () => createToJSONSchemaMethod,
  decode: () => decode,
  decodeAsync: () => decodeAsync,
  describe: () => describe,
  encode: () => encode,
  encodeAsync: () => encodeAsync,
  extractDefs: () => extractDefs,
  finalize: () => finalize,
  flattenError: () => flattenError,
  formatError: () => formatError,
  globalConfig: () => globalConfig,
  globalRegistry: () => globalRegistry,
  initializeContext: () => initializeContext,
  isValidBase64: () => isValidBase64,
  isValidBase64URL: () => isValidBase64URL,
  isValidJWT: () => isValidJWT,
  locales: () => locales_exports,
  meta: () => meta,
  parse: () => parse,
  parseAsync: () => parseAsync,
  prettifyError: () => prettifyError,
  process: () => process,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode,
  safeDecodeAsync: () => safeDecodeAsync,
  safeEncode: () => safeEncode,
  safeEncodeAsync: () => safeEncodeAsync,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  toDotPath: () => toDotPath,
  toJSONSchema: () => toJSONSchema,
  treeifyError: () => treeifyError,
  util: () => util_exports,
  version: () => version2,
});

// node_modules/zod/v4/core/core.js
var _a;
var NEVER = /* @__PURE__ */ Object.freeze({
  status: "aborted",
});
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        enumerable: false,
        value: {
          constr: _,
          def,
          traits: /* @__PURE__ */ new Set(),
        },
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  __name(init, "init");
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
    static {
      __name(this, "Definition");
    }
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    let _a3;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  __name(_, "_");
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: /* @__PURE__ */ __name((inst) => {
      if (params?.Parent && inst instanceof params.Parent) {
        return true;
      }
      return inst?._zod?.traits?.has(name);
    }, "value"),
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
__name($constructor, "$constructor");
var $brand = /* @__PURE__ */ Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
  static {
    __name(this, "$ZodAsyncError");
  }
  constructor() {
    super(
      `Encountered Promise during synchronous parse. Use .parseAsync() instead.`
    );
  }
};
var $ZodEncodeError = class extends Error {
  static {
    __name(this, "$ZodEncodeError");
  }
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config2(newConfig) {
  if (newConfig) {
    Object.assign(globalConfig, newConfig);
  }
  return globalConfig;
}
__name(config2, "config");

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert2,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage,
});
function assertEqual(val) {
  return val;
}
__name(assertEqual, "assertEqual");
function assertNotEqual(val) {
  return val;
}
__name(assertNotEqual, "assertNotEqual");
function assertIs(_arg) {}
__name(assertIs, "assertIs");
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
__name(assertNever, "assertNever");
function assert2(_) {}
__name(assert2, "assert");
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter(
    (v) => typeof v === "number"
  );
  const values = Object.entries(entries)
    .filter(([k, _]) => numericValues.indexOf(+k) === -1)
    .map(([_, v]) => v);
  return values;
}
__name(getEnumValues, "getEnumValues");
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
__name(joinValues, "joinValues");
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}
__name(jsonStringifyReplacer, "jsonStringifyReplacer");
function cached(getter) {
  const set2 = false;
  return {
    get value() {
      if (!set2) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    },
  };
}
__name(cached, "cached");
function nullish(input) {
  return input === null || input === void 0;
}
__name(nullish, "nullish");
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
__name(cleanRegex, "cleanRegex");
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance) {
    return 0;
  }
  return ratio - roundedRatio;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value;
  Object.defineProperty(object2, key, {
    configurable: true,
    get() {
      if (value === EVALUATING) {
        return;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v,
        // configurable: true,
      });
    },
  });
}
__name(defineLazy, "defineLazy");
function objectClone(obj) {
  return Object.create(
    Object.getPrototypeOf(obj),
    Object.getOwnPropertyDescriptors(obj)
  );
}
__name(objectClone, "objectClone");
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}
__name(assignProp, "assignProp");
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
__name(mergeDefs, "mergeDefs");
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
__name(cloneDef, "cloneDef");
function getElementAtPath(obj, path) {
  if (!path) {
    return obj;
  }
  return path.reduce((acc, key) => acc?.[key], obj);
}
__name(getElementAtPath, "getElementAtPath");
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
__name(promiseAllObject, "promiseAllObject");
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
__name(randomString, "randomString");
function esc(str) {
  return JSON.stringify(str);
}
__name(esc, "esc");
function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/[\s_-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}
__name(slugify, "slugify");
var captureStackTrace =
  "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
__name(isObject, "isObject");
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (
    typeof navigator !== "undefined" &&
    "Cloudflare-Workers"?.includes("Cloudflare")
  ) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false) {
    return false;
  }
  const ctor = o.constructor;
  if (ctor === void 0) {
    return true;
  }
  if (typeof ctor !== "function") {
    return true;
  }
  const prot = ctor.prototype;
  if (isObject(prot) === false) {
    return false;
  }
  if (Object.hasOwn(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
__name(isPlainObject, "isPlainObject");
function shallowClone(o) {
  if (isPlainObject(o)) {
    return { ...o };
  }
  if (Array.isArray(o)) {
    return [...o];
  }
  if (o instanceof Map) {
    return new Map(o);
  }
  if (o instanceof Set) {
    return new Set(o);
  }
  return o;
}
__name(shallowClone, "shallowClone");
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
__name(numKeys, "numKeys");
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined": {
      return "undefined";
    }
    case "string": {
      return "string";
    }
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "boolean": {
      return "boolean";
    }
    case "function": {
      return "function";
    }
    case "bigint": {
      return "bigint";
    }
    case "symbol": {
      return "symbol";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (
        data.then &&
        typeof data.then === "function" &&
        data.catch &&
        typeof data.catch === "function"
      ) {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    }
    default: {
      throw new Error(`Unknown data type: ${t}`);
    }
  }
}, "getParsedType");
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined",
]);
function escapeRegex(str) {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
__name(escapeRegex, "escapeRegex");
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent) {
    cl._zod.parent = inst;
  }
  return cl;
}
__name(clone, "clone");
function normalizeParams(_params) {
  const params = _params;
  if (!params) {
    return {};
  }
  if (typeof params === "string") {
    return { error: /* @__PURE__ */ __name(() => params, "error") };
  }
  if (params?.message !== void 0) {
    if (params?.error !== void 0) {
      throw new Error("Cannot specify both `message` and `error` params");
    }
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string") {
    return {
      ...params,
      error: /* @__PURE__ */ __name(() => params.error, "error"),
    };
  }
  return params;
}
__name(normalizeParams, "normalizeParams");
function createTransparentProxy(getter) {
  let target;
  return new Proxy(
    {},
    {
      defineProperty(_, prop, descriptor) {
        target ?? (target = getter());
        return Reflect.defineProperty(target, prop, descriptor);
      },
      deleteProperty(_, prop) {
        target ?? (target = getter());
        return Reflect.deleteProperty(target, prop);
      },
      get(_, prop, receiver) {
        target ?? (target = getter());
        return Reflect.get(target, prop, receiver);
      },
      getOwnPropertyDescriptor(_, prop) {
        target ?? (target = getter());
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
      has(_, prop) {
        target ?? (target = getter());
        return Reflect.has(target, prop);
      },
      ownKeys(_) {
        target ?? (target = getter());
        return Reflect.ownKeys(target);
      },
      set(_, prop, value, receiver) {
        target ?? (target = getter());
        return Reflect.set(target, prop, value, receiver);
      },
    }
  );
}
__name(createTransparentProxy, "createTransparentProxy");
function stringifyPrimitive(value) {
  if (typeof value === "bigint") {
    return `${value.toString()}n`;
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return `${value}`;
}
__name(stringifyPrimitive, "stringifyPrimitive");
function optionalKeys(shape) {
  return Object.keys(shape).filter(
    (k) =>
      shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional"
  );
}
__name(optionalKeys, "optionalKeys");
var NUMBER_FORMAT_RANGES = {
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
  int32: [-2147483648, 2147483647],
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  uint32: [0, 4294967295],
};
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), 9223372036854775807n],
  uint64: [0n, 18446744073709551615n],
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const { checks } = currDef;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(
      ".pick() cannot be used on object schemas containing refinements"
    );
  }
  const def = mergeDefs(schema._zod.def, {
    checks: [],
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key]) {
          continue;
        }
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
  });
  return clone(schema, def);
}
__name(pick, "pick");
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const { checks } = currDef;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(
      ".omit() cannot be used on object schemas containing refinements"
    );
  }
  const def = mergeDefs(schema._zod.def, {
    checks: [],
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key]) {
          continue;
        }
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
  });
  return clone(schema, def);
}
__name(omit, "omit");
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const { checks } = schema._zod.def;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error(
          "Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead."
        );
      }
    }
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
  });
  return clone(schema, def);
}
__name(extend, "extend");
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
  });
  return clone(schema, def);
}
__name(safeExtend, "safeExtend");
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(
      ".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead."
    );
  }
  const def = mergeDefs(a._zod.def, {
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? [],
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
  });
  return clone(a, def);
}
__name(merge, "merge");
function partial(Class2, schema, mask) {
  const currDef = schema._zod.def;
  const { checks } = currDef;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(
      ".partial() cannot be used on object schemas containing refinements"
    );
  }
  const def = mergeDefs(schema._zod.def, {
    checks: [],
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key]) {
            continue;
          }
          shape[key] = Class2
            ? new Class2({
                innerType: oldShape[key],
                type: "optional",
              })
            : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class2
            ? new Class2({
                innerType: oldShape[key],
                type: "optional",
              })
            : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
  });
  return clone(schema, def);
}
__name(partial, "partial");
function required(Class2, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key]) {
            continue;
          }
          shape[key] = new Class2({
            innerType: oldShape[key],
            type: "nonoptional",
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class2({
            innerType: oldShape[key],
            type: "nonoptional",
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
  });
  return clone(schema, def);
}
__name(required, "required");
function aborted(x, startIndex = 0) {
  if (x.aborted === true) {
    return true;
  }
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
__name(aborted, "aborted");
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true) {
    return true;
  }
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
__name(explicitlyAborted, "explicitlyAborted");
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    let _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
__name(prefixIssues, "prefixIssues");
function unwrapMessage(message2) {
  return typeof message2 === "string" ? message2 : message2?.message;
}
__name(unwrapMessage, "unwrapMessage");
function finalizeIssue(iss, ctx, config3) {
  const message2 = iss.message
    ? iss.message
    : (unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ??
      unwrapMessage(ctx?.error?.(iss)) ??
      unwrapMessage(config3.customError?.(iss)) ??
      unwrapMessage(config3.localeError?.(iss)) ??
      "Invalid input");
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message2;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
__name(finalizeIssue, "finalizeIssue");
function getSizableOrigin(input) {
  if (input instanceof Set) {
    return "set";
  }
  if (input instanceof Map) {
    return "map";
  }
  if (input instanceof File) {
    return "file";
  }
  return "unknown";
}
__name(getSizableOrigin, "getSizableOrigin");
function getLengthableOrigin(input) {
  if (Array.isArray(input)) {
    return "array";
  }
  if (typeof input === "string") {
    return "string";
  }
  return "unknown";
}
__name(getLengthableOrigin, "getLengthableOrigin");
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (
        obj &&
        Object.getPrototypeOf(obj) !== Object.prototype &&
        "constructor" in obj &&
        obj.constructor
      ) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
__name(parsedType, "parsedType");
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      code: "custom",
      input,
      inst,
      message: iss,
    };
  }
  return { ...iss };
}
__name(issue, "issue");
function cleanEnum(obj) {
  return Object.entries(obj)
    .filter(([k, _]) =>
      // return true if NaN, meaning it's not a number, thus a string key
      Number.isNaN(Number.parseInt(k, 10))
    )
    .map((el) => el[1]);
}
__name(cleanEnum, "cleanEnum");
function base64ToUint8Array(base643) {
  const binaryString = atob(base643);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.codePointAt(i);
  }
  return bytes;
}
__name(base64ToUint8Array, "base64ToUint8Array");
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCodePoint(bytes[i]);
  }
  return btoa(binaryString);
}
__name(uint8ArrayToBase64, "uint8ArrayToBase64");
function base64urlToUint8Array(base64url3) {
  const base643 = base64url3.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (base643.length % 4)) % 4);
  return base64ToUint8Array(base643 + padding);
}
__name(base64urlToUint8Array, "base64urlToUint8Array");
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll(/[=]/g, "");
}
__name(uint8ArrayToBase64url, "uint8ArrayToBase64url");
function hexToUint8Array(hex3) {
  const cleanHex = hex3.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
__name(hexToUint8Array, "hexToUint8Array");
function uint8ArrayToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(uint8ArrayToHex, "uint8ArrayToHex");
var Class = class {
  static {
    __name(this, "Class");
  }
  constructor(..._args) {}
};

// node_modules/zod/v4/core/errors.js
var initializer = /* @__PURE__ */ __name((inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    enumerable: false,
    value: inst._zod,
  });
  Object.defineProperty(inst, "issues", {
    enumerable: false,
    value: def,
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    enumerable: false,
    value: /* @__PURE__ */ __name(() => inst.message, "value"),
  });
}, "initializer");
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error51, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error51.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { fieldErrors, formErrors };
}
__name(flattenError, "flattenError");
function formatError(error51, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = /* @__PURE__ */ __name((error52, path = []) => {
    for (const issue2 of error52.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) =>
          processError({ issues }, [...path, ...issue2.path])
        );
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  }, "processError");
  processError(error51);
  return fieldErrors;
}
__name(formatError, "formatError");
function treeifyError(error51, mapper = (issue2) => issue2.message) {
  const result = { errors: [] };
  const processError = /* @__PURE__ */ __name((error52, path = []) => {
    let _a3, _b;
    for (const issue2 of error52.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) =>
          processError({ issues }, [...path, ...issue2.path])
        );
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue2));
          continue;
        }
        let curr = result;
        let i = 0;
        while (i < fullpath.length) {
          const el = fullpath[i];
          const terminal = i === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ?? (curr.properties = {});
            (_a3 = curr.properties)[el] ?? (_a3[el] = { errors: [] });
            curr = curr.properties[el];
          } else {
            curr.items ?? (curr.items = []);
            (_b = curr.items)[el] ?? (_b[el] = { errors: [] });
            curr = curr.items[el];
          }
          if (terminal) {
            curr.errors.push(mapper(issue2));
          }
          i++;
        }
      }
    }
  }, "processError");
  processError(error51);
  return result;
}
__name(treeifyError, "treeifyError");
function toDotPath(_path) {
  const segs = [];
  const path = _path.map((seg) => (typeof seg === "object" ? seg.key : seg));
  for (const seg of path) {
    if (typeof seg === "number") {
      segs.push(`[${seg}]`);
    } else if (typeof seg === "symbol") {
      segs.push(`[${JSON.stringify(String(seg))}]`);
    } else if (/[^\w$]/.test(seg)) {
      segs.push(`[${JSON.stringify(seg)}]`);
    } else {
      if (segs.length) {
        segs.push(".");
      }
      segs.push(seg);
    }
  }
  return segs.join("");
}
__name(toDotPath, "toDotPath");
function prettifyError(error51) {
  const lines = [];
  const issues = [...error51.issues].toSorted(
    (a, b) => (a.path ?? []).length - (b.path ?? []).length
  );
  for (const issue2 of issues) {
    lines.push(`\u2716 ${issue2.message}`);
    if (issue2.path?.length) {
      lines.push(`  \u2192 at ${toDotPath(issue2.path)}`);
    }
  }
  return lines.join("\n");
}
__name(prettifyError, "prettifyError");

// node_modules/zod/v4/core/parse.js
var _parse = /* @__PURE__ */ __name(
  (_Err) => (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ issues: [], value }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(
        result.issues.map((iss) => finalizeIssue(iss, ctx, config2()))
      );
      captureStackTrace(e, _params?.callee);
      throw e;
    }
    return result.value;
  },
  "_parse"
);
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = /* @__PURE__ */ __name(
  (_Err) => async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ issues: [], value }, ctx);
    if (result instanceof Promise) {
      result = await result;
    }
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(
        result.issues.map((iss) => finalizeIssue(iss, ctx, config2()))
      );
      captureStackTrace(e, params?.callee);
      throw e;
    }
    return result.value;
  },
  "_parseAsync"
);
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = /* @__PURE__ */ __name(
  (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ issues: [], value }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    return result.issues.length
      ? {
          error: new (_Err ?? $ZodError)(
            result.issues.map((iss) => finalizeIssue(iss, ctx, config2()))
          ),
          success: false,
        }
      : { data: result.value, success: true };
  },
  "_safeParse"
);
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = /* @__PURE__ */ __name(
  (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ issues: [], value }, ctx);
    if (result instanceof Promise) {
      result = await result;
    }
    return result.issues.length
      ? {
          error: new _Err(
            result.issues.map((iss) => finalizeIssue(iss, ctx, config2()))
          ),
          success: false,
        }
      : { data: result.value, success: true };
  },
  "_safeParseAsync"
);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = /* @__PURE__ */ __name(
  (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx
      ? { ..._ctx, direction: "backward" }
      : { direction: "backward" };
    return _parse(_Err)(schema, value, ctx);
  },
  "_encode"
);
var encode = /* @__PURE__ */ _encode($ZodRealError);
var _decode = /* @__PURE__ */ __name(
  (_Err) => (schema, value, _ctx) => _parse(_Err)(schema, value, _ctx),
  "_decode"
);
var decode = /* @__PURE__ */ _decode($ZodRealError);
var _encodeAsync = /* @__PURE__ */ __name(
  (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx
      ? { ..._ctx, direction: "backward" }
      : { direction: "backward" };
    return _parseAsync(_Err)(schema, value, ctx);
  },
  "_encodeAsync"
);
var encodeAsync = /* @__PURE__ */ _encodeAsync($ZodRealError);
var _decodeAsync = /* @__PURE__ */ __name(
  (_Err) => async (schema, value, _ctx) =>
    _parseAsync(_Err)(schema, value, _ctx),
  "_decodeAsync"
);
var decodeAsync = /* @__PURE__ */ _decodeAsync($ZodRealError);
var _safeEncode = /* @__PURE__ */ __name(
  (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx
      ? { ..._ctx, direction: "backward" }
      : { direction: "backward" };
    return _safeParse(_Err)(schema, value, ctx);
  },
  "_safeEncode"
);
var safeEncode = /* @__PURE__ */ _safeEncode($ZodRealError);
var _safeDecode = /* @__PURE__ */ __name(
  (_Err) => (schema, value, _ctx) => _safeParse(_Err)(schema, value, _ctx),
  "_safeDecode"
);
var safeDecode = /* @__PURE__ */ _safeDecode($ZodRealError);
var _safeEncodeAsync = /* @__PURE__ */ __name(
  (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx
      ? { ..._ctx, direction: "backward" }
      : { direction: "backward" };
    return _safeParseAsync(_Err)(schema, value, ctx);
  },
  "_safeEncodeAsync"
);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync($ZodRealError);
var _safeDecodeAsync = /* @__PURE__ */ __name(
  (_Err) => async (schema, value, _ctx) =>
    _safeParseAsync(_Err)(schema, value, _ctx),
  "_safeDecodeAsync"
);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync($ZodRealError);

// node_modules/zod/v4/core/regexes.js
var regexes_exports = {};
__export(regexes_exports, {
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint2,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  cuid: () => cuid,
  cuid2: () => cuid2,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain2,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hex: () => hex,
  hostname: () => hostname,
  html5Email: () => html5Email,
  httpProtocol: () => httpProtocol,
  idnEmail: () => idnEmail,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  mac: () => mac,
  md5_base64: () => md5_base64,
  md5_base64url: () => md5_base64url,
  md5_hex: () => md5_hex,
  nanoid: () => nanoid,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  sha1_base64: () => sha1_base64,
  sha1_base64url: () => sha1_base64url,
  sha1_hex: () => sha1_hex,
  sha256_base64: () => sha256_base64,
  sha256_base64url: () => sha256_base64url,
  sha256_hex: () => sha256_hex,
  sha384_base64: () => sha384_base64,
  sha384_base64url: () => sha384_base64url,
  sha384_hex: () => sha384_hex,
  sha512_base64: () => sha512_base64,
  sha512_base64url: () => sha512_base64url,
  sha512_hex: () => sha512_hex,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid,
});
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration =
  /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var extendedDuration =
  /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var guid =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = /* @__PURE__ */ __name((version3) => {
  if (!version3) {
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  }
  return new RegExp(
    `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version3}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`
  );
}, "uuid");
var uuid4 = /* @__PURE__ */ uuid(4);
var uuid6 = /* @__PURE__ */ uuid(6);
var uuid7 = /* @__PURE__ */ uuid(7);
var email =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;
var html5Email =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var rfc5322Email =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
var idnEmail = unicodeEmail;
var browserEmail =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
__name(emoji, "emoji");
var ipv4 =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var mac = /* @__PURE__ */ __name((delimiter) => {
  const escapedDelim = escapeRegex(delimiter ?? ":");
  return new RegExp(
    `^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`
  );
}, "mac");
var cidrv4 =
  /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 =
  /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var hostname =
  /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var domain2 =
  /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex =
    typeof args.precision === "number"
      ? args.precision === -1
        ? `${hhmm}`
        : args.precision === 0
          ? `${hhmm}:[0-5]\\d`
          : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}`
      : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
__name(timeSource, "timeSource");
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
__name(time, "time");
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local) {
    opts.push("");
  }
  if (args.offset) {
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  }
  const timeRegex = `${time3}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
__name(datetime, "datetime");
var string = /* @__PURE__ */ __name((params) => {
  const regex = params
    ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}`
    : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
}, "string");
var bigint2 = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var _undefined = /^undefined$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
var hex = /^[0-9a-fA-F]*$/;
function fixedBase64(bodyLength, padding) {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
__name(fixedBase64, "fixedBase64");
function fixedBase64url(length) {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
__name(fixedBase64url, "fixedBase64url");
var md5_hex = /^[0-9a-fA-F]{32}$/;
var md5_base64 = /* @__PURE__ */ fixedBase64(22, "==");
var md5_base64url = /* @__PURE__ */ fixedBase64url(22);
var sha1_hex = /^[0-9a-fA-F]{40}$/;
var sha1_base64 = /* @__PURE__ */ fixedBase64(27, "=");
var sha1_base64url = /* @__PURE__ */ fixedBase64url(27);
var sha256_hex = /^[0-9a-fA-F]{64}$/;
var sha256_base64 = /* @__PURE__ */ fixedBase64(43, "=");
var sha256_base64url = /* @__PURE__ */ fixedBase64url(43);
var sha384_hex = /^[0-9a-fA-F]{96}$/;
var sha384_base64 = /* @__PURE__ */ fixedBase64(64, "");
var sha384_base64url = /* @__PURE__ */ fixedBase64url(64);
var sha512_hex = /^[0-9a-fA-F]{128}$/;
var sha512_base64 = /* @__PURE__ */ fixedBase64(86, "==");
var sha512_base64url = /* @__PURE__ */ fixedBase64url(86);

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  let _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var numericOriginMap = {
  bigint: "bigint",
  number: "number",
  object: "date",
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor(
  "$ZodCheckLessThan",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      const curr =
        (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ??
        Number.POSITIVE_INFINITY;
      if (def.value < curr) {
        if (def.inclusive) {
          bag.maximum = def.value;
        } else {
          bag.exclusiveMaximum = def.value;
        }
      }
    });
    inst._zod.check = (payload) => {
      if (
        def.inclusive ? payload.value <= def.value : payload.value < def.value
      ) {
        return;
      }
      payload.issues.push({
        code: "too_big",
        continue: !def.abort,
        inclusive: def.inclusive,
        input: payload.value,
        inst,
        maximum:
          typeof def.value === "object" ? def.value.getTime() : def.value,
        origin,
      });
    };
  }
);
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor(
  "$ZodCheckGreaterThan",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      const curr =
        (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ??
        Number.NEGATIVE_INFINITY;
      if (def.value > curr) {
        if (def.inclusive) {
          bag.minimum = def.value;
        } else {
          bag.exclusiveMinimum = def.value;
        }
      }
    });
    inst._zod.check = (payload) => {
      if (
        def.inclusive ? payload.value >= def.value : payload.value > def.value
      ) {
        return;
      }
      payload.issues.push({
        code: "too_small",
        continue: !def.abort,
        inclusive: def.inclusive,
        input: payload.value,
        inst,
        minimum:
          typeof def.value === "object" ? def.value.getTime() : def.value,
        origin,
      });
    };
  }
);
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor(
  "$ZodCheckMultipleOf",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.onattach.push((inst2) => {
      let _a3;
      (_a3 = inst2._zod.bag).multipleOf ?? (_a3.multipleOf = def.value);
    });
    inst._zod.check = (payload) => {
      if (typeof payload.value !== typeof def.value) {
        throw new TypeError(
          "Cannot mix number and bigint in multiple_of check."
        );
      }
      const isMultiple =
        typeof payload.value === "bigint"
          ? payload.value % def.value === 0n
          : floatSafeRemainder(payload.value, def.value) === 0;
      if (isMultiple) {
        return;
      }
      payload.issues.push({
        code: "not_multiple_of",
        continue: !def.abort,
        divisor: def.value,
        input: payload.value,
        inst,
        origin: typeof payload.value,
      });
    };
  }
);
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor(
  "$ZodCheckNumberFormat",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    def.format = def.format || "float64";
    const isInt = def.format?.includes("int");
    const origin = isInt ? "int" : "number";
    const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.format = def.format;
      bag.minimum = minimum;
      bag.maximum = maximum;
      if (isInt) {
        bag.pattern = integer;
      }
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      if (isInt) {
        if (!Number.isInteger(input)) {
          payload.issues.push({
            code: "invalid_type",
            continue: false,
            expected: origin,
            format: def.format,
            input,
            inst,
          });
          return;
        }
        if (!Number.isSafeInteger(input)) {
          if (input > 0) {
            payload.issues.push({
              code: "too_big",
              continue: !def.abort,
              inclusive: true,
              input,
              inst,
              maximum: Number.MAX_SAFE_INTEGER,
              note: "Integers must be within the safe integer range.",
              origin,
            });
          } else {
            payload.issues.push({
              code: "too_small",
              continue: !def.abort,
              inclusive: true,
              input,
              inst,
              minimum: Number.MIN_SAFE_INTEGER,
              note: "Integers must be within the safe integer range.",
              origin,
            });
          }
          return;
        }
      }
      if (input < minimum) {
        payload.issues.push({
          code: "too_small",
          continue: !def.abort,
          inclusive: true,
          input,
          inst,
          minimum,
          origin: "number",
        });
      }
      if (input > maximum) {
        payload.issues.push({
          code: "too_big",
          continue: !def.abort,
          inclusive: true,
          input,
          inst,
          maximum,
          origin: "number",
        });
      }
    };
  }
);
var $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor(
  "$ZodCheckBigIntFormat",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.format = def.format;
      bag.minimum = minimum;
      bag.maximum = maximum;
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      if (input < minimum) {
        payload.issues.push({
          code: "too_small",
          continue: !def.abort,
          inclusive: true,
          input,
          inst,
          minimum,
          origin: "bigint",
        });
      }
      if (input > maximum) {
        payload.issues.push({
          code: "too_big",
          continue: !def.abort,
          inclusive: true,
          input,
          inst,
          maximum,
          origin: "bigint",
        });
      }
    };
  }
);
var $ZodCheckMaxSize = /* @__PURE__ */ $constructor(
  "$ZodCheckMaxSize",
  (inst, def) => {
    let _a3;
    $ZodCheck.init(inst, def);
    (_a3 = inst._zod.def).when ??
      (_a3.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
    inst._zod.onattach.push((inst2) => {
      const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
      if (def.maximum < curr) {
        inst2._zod.bag.maximum = def.maximum;
      }
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      const { size } = input;
      if (size <= def.maximum) {
        return;
      }
      payload.issues.push({
        code: "too_big",
        continue: !def.abort,
        inclusive: true,
        input,
        inst,
        maximum: def.maximum,
        origin: getSizableOrigin(input),
      });
    };
  }
);
var $ZodCheckMinSize = /* @__PURE__ */ $constructor(
  "$ZodCheckMinSize",
  (inst, def) => {
    let _a3;
    $ZodCheck.init(inst, def);
    (_a3 = inst._zod.def).when ??
      (_a3.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
    inst._zod.onattach.push((inst2) => {
      const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
      if (def.minimum > curr) {
        inst2._zod.bag.minimum = def.minimum;
      }
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      const { size } = input;
      if (size >= def.minimum) {
        return;
      }
      payload.issues.push({
        code: "too_small",
        continue: !def.abort,
        inclusive: true,
        input,
        inst,
        minimum: def.minimum,
        origin: getSizableOrigin(input),
      });
    };
  }
);
var $ZodCheckSizeEquals = /* @__PURE__ */ $constructor(
  "$ZodCheckSizeEquals",
  (inst, def) => {
    let _a3;
    $ZodCheck.init(inst, def);
    (_a3 = inst._zod.def).when ??
      (_a3.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.minimum = def.size;
      bag.maximum = def.size;
      bag.size = def.size;
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      const { size } = input;
      if (size === def.size) {
        return;
      }
      const tooBig = size > def.size;
      payload.issues.push({
        origin: getSizableOrigin(input),
        ...(tooBig
          ? { code: "too_big", maximum: def.size }
          : { code: "too_small", minimum: def.size }),
        inclusive: true,
        exact: true,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor(
  "$ZodCheckMaxLength",
  (inst, def) => {
    let _a3;
    $ZodCheck.init(inst, def);
    (_a3 = inst._zod.def).when ??
      (_a3.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
    inst._zod.onattach.push((inst2) => {
      const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
      if (def.maximum < curr) {
        inst2._zod.bag.maximum = def.maximum;
      }
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      const { length } = input;
      if (length <= def.maximum) {
        return;
      }
      const origin = getLengthableOrigin(input);
      payload.issues.push({
        code: "too_big",
        continue: !def.abort,
        inclusive: true,
        input,
        inst,
        maximum: def.maximum,
        origin,
      });
    };
  }
);
var $ZodCheckMinLength = /* @__PURE__ */ $constructor(
  "$ZodCheckMinLength",
  (inst, def) => {
    let _a3;
    $ZodCheck.init(inst, def);
    (_a3 = inst._zod.def).when ??
      (_a3.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
    inst._zod.onattach.push((inst2) => {
      const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
      if (def.minimum > curr) {
        inst2._zod.bag.minimum = def.minimum;
      }
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      const { length } = input;
      if (length >= def.minimum) {
        return;
      }
      const origin = getLengthableOrigin(input);
      payload.issues.push({
        code: "too_small",
        continue: !def.abort,
        inclusive: true,
        input,
        inst,
        minimum: def.minimum,
        origin,
      });
    };
  }
);
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor(
  "$ZodCheckLengthEquals",
  (inst, def) => {
    let _a3;
    $ZodCheck.init(inst, def);
    (_a3 = inst._zod.def).when ??
      (_a3.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.minimum = def.length;
      bag.maximum = def.length;
      bag.length = def.length;
    });
    inst._zod.check = (payload) => {
      const input = payload.value;
      const { length } = input;
      if (length === def.length) {
        return;
      }
      const origin = getLengthableOrigin(input);
      const tooBig = length > def.length;
      payload.issues.push({
        origin,
        ...(tooBig
          ? { code: "too_big", maximum: def.length }
          : { code: "too_small", minimum: def.length }),
        inclusive: true,
        exact: true,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor(
  "$ZodCheckStringFormat",
  (inst, def) => {
    let _a3, _b;
    $ZodCheck.init(inst, def);
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.format = def.format;
      if (def.pattern) {
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(def.pattern);
      }
    });
    if (def.pattern) {
      (_a3 = inst._zod).check ??
        (_a3.check = (payload) => {
          def.pattern.lastIndex = 0;
          if (def.pattern.test(payload.value)) {
            return;
          }
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            ...(def.pattern ? { pattern: def.pattern.toString() } : {}),
            inst,
            continue: !def.abort,
          });
        });
    } else {
      (_b = inst._zod).check ?? (_b.check = () => {});
    }
  }
);
var $ZodCheckRegex = /* @__PURE__ */ $constructor(
  "$ZodCheckRegex",
  (inst, def) => {
    $ZodCheckStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value)) {
        return;
      }
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "regex",
        input: payload.value,
        inst,
        origin: "string",
        pattern: def.pattern.toString(),
      });
    };
  }
);
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor(
  "$ZodCheckLowerCase",
  (inst, def) => {
    def.pattern ?? (def.pattern = lowercase);
    $ZodCheckStringFormat.init(inst, def);
  }
);
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor(
  "$ZodCheckUpperCase",
  (inst, def) => {
    def.pattern ?? (def.pattern = uppercase);
    $ZodCheckStringFormat.init(inst, def);
  }
);
var $ZodCheckIncludes = /* @__PURE__ */ $constructor(
  "$ZodCheckIncludes",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const escapedRegex = escapeRegex(def.includes);
    const pattern = new RegExp(
      typeof def.position === "number"
        ? `^.{${def.position}}${escapedRegex}`
        : escapedRegex
    );
    def.pattern = pattern;
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(pattern);
    });
    inst._zod.check = (payload) => {
      if (payload.value.includes(def.includes, def.position)) {
        return;
      }
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "includes",
        includes: def.includes,
        input: payload.value,
        inst,
        origin: "string",
      });
    };
  }
);
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor(
  "$ZodCheckStartsWith",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(pattern);
    });
    inst._zod.check = (payload) => {
      if (payload.value.startsWith(def.prefix)) {
        return;
      }
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "starts_with",
        input: payload.value,
        inst,
        origin: "string",
        prefix: def.prefix,
      });
    };
  }
);
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor(
  "$ZodCheckEndsWith",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.onattach.push((inst2) => {
      const { bag } = inst2._zod;
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(pattern);
    });
    inst._zod.check = (payload) => {
      if (payload.value.endsWith(def.suffix)) {
        return;
      }
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "ends_with",
        input: payload.value,
        inst,
        origin: "string",
        suffix: def.suffix,
      });
    };
  }
);
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
__name(handleCheckPropertyResult, "handleCheckPropertyResult");
var $ZodCheckProperty = /* @__PURE__ */ $constructor(
  "$ZodCheckProperty",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
      const result = def.schema._zod.run(
        {
          issues: [],
          value: payload.value[def.property],
        },
        {}
      );
      if (result instanceof Promise) {
        return result.then((result2) =>
          handleCheckPropertyResult(result2, payload, def.property)
        );
      }
      handleCheckPropertyResult(result, payload, def.property);
      return;
    };
  }
);
var $ZodCheckMimeType = /* @__PURE__ */ $constructor(
  "$ZodCheckMimeType",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    const mimeSet = new Set(def.mime);
    inst._zod.onattach.push((inst2) => {
      inst2._zod.bag.mime = def.mime;
    });
    inst._zod.check = (payload) => {
      if (mimeSet.has(payload.value.type)) {
        return;
      }
      payload.issues.push({
        code: "invalid_value",
        continue: !def.abort,
        input: payload.value.type,
        inst,
        values: def.mime,
      });
    };
  }
);
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor(
  "$ZodCheckOverwrite",
  (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
      payload.value = def.tx(payload.value);
    };
  }
);

// node_modules/zod/v4/core/doc.js
var Doc = class {
  static {
    __name(this, "Doc");
  }
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this) {
      this.args = args;
    }
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(
      ...lines.map((x) => x.length - x.trimStart().length)
    );
    const dedented = lines
      .map((x) => x.slice(minIndent))
      .map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = content.map((x) => `  ${x}`);
    return new F(...args, lines.join("\n"));
  }
};

// node_modules/zod/v4/core/versions.js
var version2 = {
  major: 4,
  minor: 4,
  patch: 3,
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  let _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version2;
  const checks = [...(inst._zod.def.checks ?? [])];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = /* @__PURE__ */ __name((payload, checks2, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload)) {
            continue;
          }
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun) {
            continue;
          }
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen) {
              return;
            }
            if (!isAborted) {
              isAborted = aborted(payload, currLen);
            }
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen) {
            continue;
          }
          if (!isAborted) {
            isAborted = aborted(payload, currLen);
          }
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => payload);
      }
      return payload;
    }, "runChecks");
    const handleCanaryResult = /* @__PURE__ */ __name(
      (canary, payload, ctx) => {
        if (aborted(canary)) {
          canary.aborted = true;
          return canary;
        }
        const checkResult = runChecks(payload, checks, ctx);
        if (checkResult instanceof Promise) {
          if (ctx.async === false) {
            throw new $ZodAsyncError();
          }
          return checkResult.then((checkResult2) =>
            inst._zod.parse(checkResult2, ctx)
          );
        }
        return inst._zod.parse(checkResult, ctx);
      },
      "handleCanaryResult"
    );
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse(
          { issues: [], value: payload.value },
          { ...ctx, skipChecks: true }
        );
        if (canary instanceof Promise) {
          return canary.then((canary2) =>
            handleCanaryResult(canary2, payload, ctx)
          );
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false) {
          throw new $ZodAsyncError();
        }
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: /* @__PURE__ */ __name((value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch {
        return safeParseAsync(inst, value).then((r) =>
          r.success ? { value: r.data } : { issues: r.error?.issues }
        );
      }
    }, "validate"),
    vendor: "zod",
    version: 1,
  }));
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern =
    [...(inst?._zod.bag?.patterns ?? [])].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce) {
      try {
        payload.value = String(payload.value);
      } catch {}
    }
    if (typeof payload.value === "string") {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "string",
      input: payload.value,
      inst,
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor(
  "$ZodStringFormat",
  (inst, def) => {
    $ZodCheckStringFormat.init(inst, def);
    $ZodString.init(inst, def);
  }
);
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8,
    };
    const v = versionMap[def.version];
    if (v === void 0) {
      throw new Error(`Invalid UUID version: "${def.version}"`);
    }
    def.pattern ?? (def.pattern = uuid(v));
  } else {
    def.pattern ?? (def.pattern = uuid());
  }
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            continue: !def.abort,
            format: "url",
            input: payload.value,
            inst,
            note: "Invalid URL format",
          });
          return;
        }
      }
      const url2 = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url2.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            continue: !def.abort,
            format: "url",
            input: payload.value,
            inst,
            note: "Invalid hostname",
            pattern: def.hostname.source,
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (
          !def.protocol.test(
            url2.protocol.endsWith(":")
              ? url2.protocol.slice(0, -1)
              : url2.protocol
          )
        ) {
          payload.issues.push({
            code: "invalid_format",
            continue: !def.abort,
            format: "url",
            input: payload.value,
            inst,
            note: "Invalid protocol",
            pattern: def.protocol.source,
          });
        }
      }
      if (def.normalize) {
        payload.value = url2.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch {
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "url",
        input: payload.value,
        inst,
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor(
  "$ZodISODateTime",
  (inst, def) => {
    def.pattern ?? (def.pattern = datetime(def));
    $ZodStringFormat.init(inst, def);
  }
);
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor(
  "$ZodISODuration",
  (inst, def) => {
    def.pattern ?? (def.pattern = duration);
    $ZodStringFormat.init(inst, def);
  }
);
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "ipv6",
        input: payload.value,
        inst,
      });
    }
  };
});
var $ZodMAC = /* @__PURE__ */ $constructor("$ZodMAC", (inst, def) => {
  def.pattern ?? (def.pattern = mac(def.delimiter));
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `mac`;
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2) {
        throw new Error();
      }
      const [address, prefix] = parts;
      if (!prefix) {
        throw new Error();
      }
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix) {
        throw new Error();
      }
      if (prefixNum < 0 || prefixNum > 128) {
        throw new Error();
      }
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "cidrv6",
        input: payload.value,
        inst,
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "") {
    return true;
  }
  if (/\s/.test(data)) {
    return false;
  }
  if (data.length % 4 !== 0) {
    return false;
  }
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
__name(isValidBase64, "isValidBase64");
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value)) {
      return;
    }
    payload.issues.push({
      code: "invalid_format",
      continue: !def.abort,
      format: "base64",
      input: payload.value,
      inst,
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data)) {
    return false;
  }
  const base643 = data.replaceAll(/[-_]/g, (c) => (c === "-" ? "+" : "/"));
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
__name(isValidBase64URL, "isValidBase64URL");
var $ZodBase64URL = /* @__PURE__ */ $constructor(
  "$ZodBase64URL",
  (inst, def) => {
    def.pattern ?? (def.pattern = base64url);
    $ZodStringFormat.init(inst, def);
    inst._zod.bag.contentEncoding = "base64url";
    inst._zod.check = (payload) => {
      if (isValidBase64URL(payload.value)) {
        return;
      }
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: "base64url",
        input: payload.value,
        inst,
      });
    };
  }
);
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3) {
      return false;
    }
    const [header] = tokensParts;
    if (!header) {
      return false;
    }
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") {
      return false;
    }
    if (!parsedHeader.alg) {
      return false;
    }
    if (
      algorithm &&
      (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg)) {
      return;
    }
    payload.issues.push({
      code: "invalid_format",
      continue: !def.abort,
      format: "jwt",
      input: payload.value,
      inst,
    });
  };
});
var $ZodCustomStringFormat = /* @__PURE__ */ $constructor(
  "$ZodCustomStringFormat",
  (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
      if (def.fn(payload.value)) {
        return;
      }
      payload.issues.push({
        code: "invalid_format",
        continue: !def.abort,
        format: def.format,
        input: payload.value,
        inst,
      });
    };
  }
);
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = Number(payload.value);
      } catch {}
    }
    const input = payload.value;
    if (
      typeof input === "number" &&
      !Number.isNaN(input) &&
      Number.isFinite(input)
    ) {
      return payload;
    }
    const received =
      typeof input === "number"
        ? Number.isNaN(input)
          ? "NaN"
          : !Number.isFinite(input)
            ? "Infinity"
            : void 0
        : void 0;
    payload.issues.push({
      code: "invalid_type",
      expected: "number",
      input,
      inst,
      ...(received ? { received } : {}),
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor(
  "$ZodNumberFormat",
  (inst, def) => {
    $ZodCheckNumberFormat.init(inst, def);
    $ZodNumber.init(inst, def);
  }
);
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = Boolean(payload.value);
      } catch {}
    }
    const input = payload.value;
    if (typeof input === "boolean") {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "boolean",
      input,
      inst,
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint2;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = BigInt(payload.value);
      } catch {}
    }
    if (typeof payload.value === "bigint") {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "bigint",
      input: payload.value,
      inst,
    });
    return payload;
  };
});
var $ZodBigIntFormat = /* @__PURE__ */ $constructor(
  "$ZodBigIntFormat",
  (inst, def) => {
    $ZodCheckBigIntFormat.init(inst, def);
    $ZodBigInt.init(inst, def);
  }
);
var $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "symbol") {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "symbol",
      input,
      inst,
    });
    return payload;
  };
});
var $ZodUndefined = /* @__PURE__ */ $constructor(
  "$ZodUndefined",
  (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = _undefined;
    inst._zod.values = /* @__PURE__ */ new Set([void 0]);
    inst._zod.parse = (payload, _ctx) => {
      const input = payload.value;
      if (input === void 0) {
        return payload;
      }
      payload.issues.push({
        code: "invalid_type",
        expected: "undefined",
        input,
        inst,
      });
      return payload;
    };
  }
);
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "null",
      input,
      inst,
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      code: "invalid_type",
      expected: "never",
      input: payload.value,
      inst,
    });
    return payload;
  };
});
var $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === void 0) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "void",
      input,
      inst,
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch {}
    }
    const input = payload.value;
    const isDate2 = input instanceof Date;
    const isValidDate = isDate2 && !Number.isNaN(input.getTime());
    if (isValidDate) {
      return payload;
    }
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...(isDate2 ? { received: "Invalid Date" } : {}),
      inst,
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
__name(handleArrayResult, "handleArrayResult");
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "array",
        input,
        inst,
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run(
        {
          issues: [],
          value: item,
        },
        ctx
      );
      if (result instanceof Promise) {
        proms.push(
          result.then((result2) => handleArrayResult(result2, payload, i))
        );
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(
  result,
  final,
  key,
  input,
  isOptionalIn,
  isOptionalOut
) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key],
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
__name(handlePropertyResult, "handlePropertyResult");
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keySet: new Set(keys),
    keys,
    numKeys: keys.length,
    optionalKeys: new Set(okeys),
  };
}
__name(normalizeDef, "normalizeDef");
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const { keySet } = def;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__") {
      continue;
    }
    if (keySet.has(key)) {
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ issues: [], value: input[key] }, ctx);
    if (r instanceof Promise) {
      proms.push(
        r.then((r2) =>
          handlePropertyResult(
            r2,
            payload,
            key,
            input,
            isOptionalIn,
            isOptionalOut
          )
        )
      );
    } else {
      handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      input,
      inst,
      keys: unrecognized,
    });
  }
  if (!proms.length) {
    return payload;
  }
  return Promise.all(proms).then(() => payload);
}
__name(handleCatchall, "handleCatchall");
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: /* @__PURE__ */ __name(() => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh,
        });
        return newSh;
      }, "get"),
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const { shape } = def;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values) {
          propValues[key].add(v);
        }
      }
    }
    return propValues;
  });
  const { isObject: isObject2 } = util_exports;
  const { catchall } = def;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? ({ value } = _normalized);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst,
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const { shape } = value;
    for (const key of value.keys) {
      const el = shape[key];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ issues: [], value: input[key] }, ctx);
      if (r instanceof Promise) {
        proms.push(
          r.then((r2) =>
            handlePropertyResult(
              r2,
              payload,
              key,
              input,
              isOptionalIn,
              isOptionalOut
            )
          )
        );
      } else {
        handlePropertyResult(
          r,
          payload,
          key,
          input,
          isOptionalIn,
          isOptionalOut
        );
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor(
  "$ZodObjectJIT",
  (inst, def) => {
    $ZodObject.init(inst, def);
    const superParse = inst._zod.parse;
    const _normalized = cached(() => normalizeDef(def));
    const generateFastpass = /* @__PURE__ */ __name((shape) => {
      const doc = new Doc(["shape", "payload", "ctx"]);
      const normalized = _normalized.value;
      const parseStr = /* @__PURE__ */ __name((key) => {
        const k = esc(key);
        return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
      }, "parseStr");
      doc.write(`const input = payload.value;`);
      const ids = /* @__PURE__ */ Object.create(null);
      let counter = 0;
      for (const key of normalized.keys) {
        ids[key] = `key_${counter++}`;
      }
      doc.write(`const newResult = {};`);
      for (const key of normalized.keys) {
        const id = ids[key];
        const k = esc(key);
        const schema = shape[key];
        const isOptionalIn = schema?._zod?.optin === "optional";
        const isOptionalOut = schema?._zod?.optout === "optional";
        doc.write(`const ${id} = ${parseStr(key)};`);
        if (isOptionalIn && isOptionalOut) {
          doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
        } else if (!isOptionalIn) {
          doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
        } else {
          doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
        }
      }
      doc.write(`payload.value = newResult;`);
      doc.write(`return payload;`);
      const fn = doc.compile();
      return (payload, ctx) => fn(shape, payload, ctx);
    }, "generateFastpass");
    let fastpass;
    const { isObject: isObject2 } = util_exports;
    const jit = !globalConfig.jitless;
    const { allowsEval: allowsEval2 } = util_exports;
    const fastEnabled = jit && allowsEval2.value;
    const { catchall } = def;
    let value;
    inst._zod.parse = (payload, ctx) => {
      value ?? ({ value } = _normalized);
      const input = payload.value;
      if (!isObject2(input)) {
        payload.issues.push({
          code: "invalid_type",
          expected: "object",
          input,
          inst,
        });
        return payload;
      }
      if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
        if (!fastpass) {
          fastpass = generateFastpass(def.shape);
        }
        payload = fastpass(payload, ctx);
        if (!catchall) {
          return payload;
        }
        return handleCatchall([], input, payload, ctx, value, inst);
      }
      return superParse(payload, ctx);
    };
  }
);
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    errors: results.map((result) =>
      result.issues.map((iss) => finalizeIssue(iss, ctx, config2()))
    ),
    input: final.value,
    inst,
  });
  return final;
}
__name(handleUnionResults, "handleUnionResults");
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () =>
    def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0
  );
  defineLazy(inst._zod, "optout", () =>
    def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0
  );
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => [...option._zod.values]));
    }
    return;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns3 = def.options.map((o) => o._zod.pattern);
      return new RegExp(
        `^(${patterns3.map((p) => cleanRegex(p.source)).join("|")})$`
      );
    }
    return;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run(
        {
          issues: [],
          value: payload.value,
        },
        ctx
      );
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0) {
          return result;
        }
        results.push(result);
      }
    }
    if (!async) {
      return handleUnionResults(results, payload, inst, ctx);
    }
    return Promise.all(results).then((results2) =>
      handleUnionResults(results2, payload, inst, ctx)
    );
  };
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
  const successes = results.filter((r) => r.issues.length === 0);
  if (successes.length === 1) {
    final.value = successes[0].value;
    return final;
  }
  if (successes.length === 0) {
    final.issues.push({
      code: "invalid_union",
      errors: results.map((result) =>
        result.issues.map((iss) => finalizeIssue(iss, ctx, config2()))
      ),
      input: final.value,
      inst,
    });
  } else {
    final.issues.push({
      code: "invalid_union",
      errors: [],
      inclusive: false,
      input: final.value,
      inst,
    });
  }
  return final;
}
__name(handleExclusiveUnionResults, "handleExclusiveUnionResults");
var $ZodXor = /* @__PURE__ */ $constructor("$ZodXor", (inst, def) => {
  $ZodUnion.init(inst, def);
  def.inclusive = false;
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run(
        {
          issues: [],
          value: payload.value,
        },
        ctx
      );
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        results.push(result);
      }
    }
    if (!async) {
      return handleExclusiveUnionResults(results, payload, inst, ctx);
    }
    return Promise.all(results).then((results2) =>
      handleExclusiveUnionResults(results2, payload, inst, ctx)
    );
  };
});
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor(
  "$ZodDiscriminatedUnion",
  (inst, def) => {
    def.inclusive = false;
    $ZodUnion.init(inst, def);
    const _super = inst._zod.parse;
    defineLazy(inst._zod, "propValues", () => {
      const propValues = {};
      for (const option of def.options) {
        const pv = option._zod.propValues;
        if (!pv || Object.keys(pv).length === 0) {
          throw new Error(
            `Invalid discriminated union option at index "${def.options.indexOf(option)}"`
          );
        }
        for (const [k, v] of Object.entries(pv)) {
          if (!propValues[k]) {
            propValues[k] = /* @__PURE__ */ new Set();
          }
          for (const val of v) {
            propValues[k].add(val);
          }
        }
      }
      return propValues;
    });
    const disc = cached(() => {
      const opts = def.options;
      const map2 = /* @__PURE__ */ new Map();
      for (const o of opts) {
        const values = o._zod.propValues?.[def.discriminator];
        if (!values || values.size === 0) {
          throw new Error(
            `Invalid discriminated union option at index "${def.options.indexOf(o)}"`
          );
        }
        for (const v of values) {
          if (map2.has(v)) {
            throw new Error(`Duplicate discriminator value "${String(v)}"`);
          }
          map2.set(v, o);
        }
      }
      return map2;
    });
    inst._zod.parse = (payload, ctx) => {
      const input = payload.value;
      if (!isObject(input)) {
        payload.issues.push({
          code: "invalid_type",
          expected: "object",
          input,
          inst,
        });
        return payload;
      }
      const opt = disc.value.get(input?.[def.discriminator]);
      if (opt) {
        return opt._zod.run(payload, ctx);
      }
      if (def.unionFallback || ctx.direction === "backward") {
        return _super(payload, ctx);
      }
      payload.issues.push({
        code: "invalid_union",
        discriminator: def.discriminator,
        errors: [],
        input,
        inst,
        note: "No matching discriminator",
        options: [...disc.value.keys()],
        path: [def.discriminator],
      });
      return payload;
    };
  }
);
var $ZodIntersection = /* @__PURE__ */ $constructor(
  "$ZodIntersection",
  (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
      const input = payload.value;
      const left = def.left._zod.run({ issues: [], value: input }, ctx);
      const right = def.right._zod.run({ issues: [], value: input }, ctx);
      const async = left instanceof Promise || right instanceof Promise;
      if (async) {
        return Promise.all([left, right]).then(([left2, right2]) =>
          handleIntersectionResults(payload, left2, right2)
        );
      }
      return handleIntersectionResults(payload, left, right);
    };
  }
);
function mergeValues(a, b) {
  if (a === b) {
    return { data: a, valid: true };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { data: a, valid: true };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter(
      (key) => bKeys.indexOf(key) !== -1
    );
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath],
          valid: false,
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { data: newObj, valid: true };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { mergeErrorPath: [], valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath],
          valid: false,
        };
      }
      newArray.push(sharedValue.data);
    }
    return { data: newArray, valid: true };
  }
  return { mergeErrorPath: [], valid: false };
}
__name(mergeValues, "mergeValues");
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k)) {
          unrecKeys.set(k, {});
        }
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k)) {
          unrecKeys.set(k, {});
        }
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result)) {
    return result;
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(
      `Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`
    );
  }
  result.value = merged.data;
  return result;
}
__name(handleIntersectionResults, "handleIntersectionResults");
var $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
  $ZodType.init(inst, def);
  const { items } = def;
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "tuple",
        input,
        inst,
      });
      return payload;
    }
    payload.value = [];
    const proms = [];
    const optinStart = getTupleOptStart(items, "optin");
    const optoutStart = getTupleOptStart(items, "optout");
    if (!def.rest) {
      if (input.length < optinStart) {
        payload.issues.push({
          code: "too_small",
          inclusive: true,
          input,
          inst,
          minimum: optinStart,
          origin: "array",
        });
        return payload;
      }
      if (input.length > items.length) {
        payload.issues.push({
          code: "too_big",
          inclusive: true,
          input,
          inst,
          maximum: items.length,
          origin: "array",
        });
      }
    }
    const itemResults = new Array(items.length);
    for (let i = 0; i < items.length; i++) {
      const r = items[i]._zod.run({ issues: [], value: input[i] }, ctx);
      if (r instanceof Promise) {
        proms.push(
          r.then((rr) => {
            itemResults[i] = rr;
          })
        );
      } else {
        itemResults[i] = r;
      }
    }
    if (def.rest) {
      let i = items.length - 1;
      const rest = input.slice(items.length);
      for (const el of rest) {
        i++;
        const result = def.rest._zod.run({ issues: [], value: el }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((r) => handleTupleResult(r, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() =>
        handleTupleResults(itemResults, payload, items, input, optoutStart)
      );
    }
    return handleTupleResults(itemResults, payload, items, input, optoutStart);
  };
});
function getTupleOptStart(items, key) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i]._zod[key] !== "optional") {
      return i + 1;
    }
  }
  return 0;
}
__name(getTupleOptStart, "getTupleOptStart");
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
__name(handleTupleResult, "handleTupleResult");
function handleTupleResults(itemResults, final, items, input, optoutStart) {
  for (let i = 0; i < items.length; i++) {
    const r = itemResults[i];
    const isPresent = i < input.length;
    if (r.issues.length) {
      if (!isPresent && i >= optoutStart) {
        final.value.length = i;
        break;
      }
      final.issues.push(...prefixIssues(i, r.issues));
    }
    final.value[i] = r.value;
  }
  for (let i = final.value.length - 1; i >= input.length; i--) {
    if (items[i]._zod.optout === "optional" && final.value[i] === void 0) {
      final.value.length = i;
    } else {
      break;
    }
  }
  return final;
}
__name(handleTupleResults, "handleTupleResults");
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "record",
        input,
        inst,
      });
      return payload;
    }
    const proms = [];
    const { values } = def.keyType._zod;
    if (values) {
      payload.value = {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (
          typeof key === "string" ||
          typeof key === "number" ||
          typeof key === "symbol"
        ) {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          const keyResult = def.keyType._zod.run(
            { issues: [], value: key },
            ctx
          );
          if (keyResult instanceof Promise) {
            throw new TypeError(
              "Async schemas not supported in object keys currently"
            );
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              input: key,
              inst,
              issues: keyResult.issues.map((iss) =>
                finalizeIssue(iss, ctx, config2())
              ),
              origin: "record",
              path: [key],
            });
            continue;
          }
          const outKey = keyResult.value;
          const result = def.valueType._zod.run(
            { issues: [], value: input[key] },
            ctx
          );
          if (result instanceof Promise) {
            proms.push(
              result.then((result2) => {
                if (result2.issues.length) {
                  payload.issues.push(...prefixIssues(key, result2.issues));
                }
                payload.value[outKey] = result2.value;
              })
            );
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__") {
          continue;
        }
        if (!Object.prototype.propertyIsEnumerable.call(input, key)) {
          continue;
        }
        let keyResult = def.keyType._zod.run({ issues: [], value: key }, ctx);
        if (keyResult instanceof Promise) {
          throw new TypeError(
            "Async schemas not supported in object keys currently"
          );
        }
        const checkNumericKey =
          typeof key === "string" &&
          number.test(key) &&
          keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run(
            { issues: [], value: Number(key) },
            ctx
          );
          if (retryResult instanceof Promise) {
            throw new TypeError(
              "Async schemas not supported in object keys currently"
            );
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else {
            payload.issues.push({
              code: "invalid_key",
              input: key,
              inst,
              issues: keyResult.issues.map((iss) =>
                finalizeIssue(iss, ctx, config2())
              ),
              origin: "record",
              path: [key],
            });
          }
          continue;
        }
        const result = def.valueType._zod.run(
          { issues: [], value: input[key] },
          ctx
        );
        if (result instanceof Promise) {
          proms.push(
            result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[keyResult.value] = result2.value;
            })
          );
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Map)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "map",
        input,
        inst,
      });
      return payload;
    }
    const proms = [];
    payload.value = /* @__PURE__ */ new Map();
    for (const [key, value] of input) {
      const keyResult = def.keyType._zod.run({ issues: [], value: key }, ctx);
      const valueResult = def.valueType._zod.run({ issues: [], value }, ctx);
      if (keyResult instanceof Promise || valueResult instanceof Promise) {
        proms.push(
          Promise.all([keyResult, valueResult]).then(
            ([keyResult2, valueResult2]) => {
              handleMapResult(
                keyResult2,
                valueResult2,
                payload,
                key,
                input,
                inst,
                ctx
              );
            }
          )
        );
      } else {
        handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        code: "invalid_key",
        input,
        inst,
        issues: keyResult.issues.map((iss) =>
          finalizeIssue(iss, ctx, config2())
        ),
        origin: "map",
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        code: "invalid_element",
        input,
        inst,
        issues: valueResult.issues.map((iss) =>
          finalizeIssue(iss, ctx, config2())
        ),
        key,
        origin: "map",
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
__name(handleMapResult, "handleMapResult");
var $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Set)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "set",
        input,
        inst,
      });
      return payload;
    }
    const proms = [];
    payload.value = /* @__PURE__ */ new Set();
    for (const item of input) {
      const result = def.valueType._zod.run({ issues: [], value: item }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleSetResult(result2, payload)));
      } else {
        handleSetResult(result, payload);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
__name(handleSetResult, "handleSetResult");
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(
    `^(${values
      .filter((k) => propertyKeyTypes.has(typeof k))
      .map((o) => (typeof o === "string" ? escapeRegex(o) : o.toString()))
      .join("|")})$`
  );
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      input,
      inst,
      values,
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  const values = new Set(def.values);
  inst._zod.values = values;
  inst._zod.pattern = new RegExp(
    `^(${def.values.map((o) => (typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o))).join("|")})$`
  );
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      input,
      inst,
      values: def.values,
    });
    return payload;
  };
});
var $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input instanceof File) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_type",
      expected: "file",
      input,
      inst,
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor(
  "$ZodTransform",
  (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    inst._zod.parse = (payload, ctx) => {
      if (ctx.direction === "backward") {
        throw new $ZodEncodeError(inst.constructor.name);
      }
      const _out = def.transform(payload.value, payload);
      if (ctx.async) {
        const output = _out instanceof Promise ? _out : Promise.resolve(_out);
        return output.then((output2) => {
          payload.value = output2;
          payload.fallback = true;
          return payload;
        });
      }
      if (_out instanceof Promise) {
        throw new $ZodAsyncError();
      }
      payload.value = _out;
      payload.fallback = true;
      return payload;
    };
  }
);
function handleOptionalResult(result, input) {
  if (input === void 0 && (result.issues.length || result.fallback)) {
    return { issues: [], value: void 0 };
  }
  return result;
}
__name(handleOptionalResult, "handleOptionalResult");
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () =>
    def.innerType._zod.values
      ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0])
      : void 0
  );
  defineLazy(inst._zod, "pattern", () => {
    const { pattern } = def.innerType._zod;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise) {
        return result.then((r) => handleOptionalResult(r, input));
      }
      return handleOptionalResult(result, input);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor(
  "$ZodExactOptional",
  (inst, def) => {
    $ZodOptional.init(inst, def);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
    inst._zod.parse = (payload, ctx) => def.innerType._zod.run(payload, ctx);
  }
);
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const { pattern } = def.innerType._zod;
    return pattern
      ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`)
      : void 0;
  });
  defineLazy(inst._zod, "values", () =>
    def.innerType._zod.values
      ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null])
      : void 0
  );
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
__name(handleDefaultResult, "handleDefaultResult");
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor(
  "$ZodNonOptional",
  (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => {
      const v = def.innerType._zod.values;
      return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
    });
    inst._zod.parse = (payload, ctx) => {
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise) {
        return result.then((result2) => handleNonOptionalResult(result2, inst));
      }
      return handleNonOptionalResult(result, inst);
    };
  }
);
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst,
    });
  }
  return payload;
}
__name(handleNonOptionalResult, "handleNonOptionalResult");
var $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError("ZodSuccess");
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.issues.length === 0;
        return payload;
      });
    }
    payload.value = result.issues.length === 0;
    return payload;
  };
});
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) =>
                finalizeIssue(iss, ctx, config2())
              ),
            },
            input: payload.value,
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) =>
            finalizeIssue(iss, ctx, config2())
          ),
        },
        input: payload.value,
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
var $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "nan",
        input: payload.value,
        inst,
      });
      return payload;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run(
    { fallback: left.fallback, issues: left.issues, value: left.value },
    ctx
  );
}
__name(handlePipeResult, "handlePipeResult");
var $ZodCodec = /* @__PURE__ */ $constructor("$ZodCodec", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
      const left = def.in._zod.run(payload, ctx);
      if (left instanceof Promise) {
        return left.then((left2) => handleCodecAResult(left2, def, ctx));
      }
      return handleCodecAResult(left, def, ctx);
    }
    const right = def.out._zod.run(payload, ctx);
    if (right instanceof Promise) {
      return right.then((right2) => handleCodecAResult(right2, def, ctx));
    }
    return handleCodecAResult(right, def, ctx);
  };
});
function handleCodecAResult(result, def, ctx) {
  if (result.issues.length) {
    result.aborted = true;
    return result;
  }
  const direction = ctx.direction || "forward";
  if (direction === "forward") {
    const transformed2 = def.transform(result.value, result);
    if (transformed2 instanceof Promise) {
      return transformed2.then((value) =>
        handleCodecTxResult(result, value, def.out, ctx)
      );
    }
    return handleCodecTxResult(result, transformed2, def.out, ctx);
  }
  const transformed = def.reverseTransform(result.value, result);
  if (transformed instanceof Promise) {
    return transformed.then((value) =>
      handleCodecTxResult(result, value, def.in, ctx)
    );
  }
  return handleCodecTxResult(result, transformed, def.in, ctx);
}
__name(handleCodecAResult, "handleCodecAResult");
function handleCodecTxResult(left, value, nextSchema, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return nextSchema._zod.run({ issues: left.issues, value }, ctx);
}
__name(handleCodecTxResult, "handleCodecTxResult");
var $ZodPreprocess = /* @__PURE__ */ $constructor(
  "$ZodPreprocess",
  (inst, def) => {
    $ZodPipe.init(inst, def);
  }
);
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
__name(handleReadonlyResult, "handleReadonlyResult");
var $ZodTemplateLiteral = /* @__PURE__ */ $constructor(
  "$ZodTemplateLiteral",
  (inst, def) => {
    $ZodType.init(inst, def);
    const regexParts = [];
    for (const part of def.parts) {
      if (typeof part === "object" && part !== null) {
        if (!part._zod.pattern) {
          throw new Error(
            `Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`
          );
        }
        const source =
          part._zod.pattern instanceof RegExp
            ? part._zod.pattern.source
            : part._zod.pattern;
        if (!source) {
          throw new Error(`Invalid template literal part: ${part._zod.traits}`);
        }
        const start = source.startsWith("^") ? 1 : 0;
        const end = source.endsWith("$") ? source.length - 1 : source.length;
        regexParts.push(source.slice(start, end));
      } else if (part === null || primitiveTypes.has(typeof part)) {
        regexParts.push(escapeRegex(`${part}`));
      } else {
        throw new Error(`Invalid template literal part: ${part}`);
      }
    }
    inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
    inst._zod.parse = (payload, _ctx) => {
      if (typeof payload.value !== "string") {
        payload.issues.push({
          code: "invalid_type",
          expected: "string",
          input: payload.value,
          inst,
        });
        return payload;
      }
      inst._zod.pattern.lastIndex = 0;
      if (!inst._zod.pattern.test(payload.value)) {
        payload.issues.push({
          code: "invalid_format",
          format: def.format ?? "template_literal",
          input: payload.value,
          inst,
          pattern: inst._zod.pattern.source,
        });
        return payload;
      }
      return payload;
    };
  }
);
var $ZodFunction = /* @__PURE__ */ $constructor("$ZodFunction", (inst, def) => {
  $ZodType.init(inst, def);
  inst._def = def;
  inst._zod.def = def;
  inst.implement = (func) => {
    if (typeof func !== "function") {
      throw new TypeError("implement() must be called with a function");
    }
    return /* @__PURE__ */ __name(function implement(...args) {
      const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
      const result = Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return parse(inst._def.output, result);
      }
      return result;
    }, "implement");
  };
  inst.implementAsync = (func) => {
    if (typeof func !== "function") {
      throw new TypeError("implementAsync() must be called with a function");
    }
    return /* @__PURE__ */ __name(async function implementAsync(...args) {
      const parsedArgs = inst._def.input
        ? await parseAsync(inst._def.input, args)
        : args;
      const result = await Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return await parseAsync(inst._def.output, result);
      }
      return result;
    }, "implementAsync");
  };
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "function") {
      payload.issues.push({
        code: "invalid_type",
        expected: "function",
        input: payload.value,
        inst,
      });
      return payload;
    }
    const hasPromiseOutput =
      inst._def.output && inst._def.output._zod.def.type === "promise";
    if (hasPromiseOutput) {
      payload.value = inst.implementAsync(payload.value);
    } else {
      payload.value = inst.implement(payload.value);
    }
    return payload;
  };
  inst.input = (...args) => {
    const F = inst.constructor;
    if (Array.isArray(args[0])) {
      return new F({
        input: new $ZodTuple({
          items: args[0],
          rest: args[1],
          type: "tuple",
        }),
        output: inst._def.output,
        type: "function",
      });
    }
    return new F({
      input: args[0],
      output: inst._def.output,
      type: "function",
    });
  };
  inst.output = (output) => {
    const F = inst.constructor;
    return new F({
      input: inst._def.input,
      output,
      type: "function",
    });
  };
  return inst;
});
var $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) =>
    Promise.resolve(payload.value).then((inner) =>
      def.innerType._zod.run({ issues: [], value: inner }, ctx)
    );
});
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner) {
      d._cachedInner = def.getter();
    }
    return d._cachedInner;
  });
  defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
  defineLazy(
    inst._zod,
    "propValues",
    () => inst._zod.innerType?._zod?.propValues
  );
  defineLazy(
    inst._zod,
    "optin",
    () => inst._zod.innerType?._zod?.optin ?? void 0
  );
  defineLazy(
    inst._zod,
    "optout",
    () => inst._zod.innerType?._zod?.optout ?? void 0
  );
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => payload;
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...(inst._zod.def.path ?? [])],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort,
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params) {
      _iss.params = inst._zod.def.params;
    }
    payload.issues.push(issue(_iss));
  }
}
__name(handleRefineResult, "handleRefineResult");

// node_modules/zod/v4/locales/index.js
var locales_exports = {};
__export(locales_exports, {
  ar: () => ar_default,
  az: () => az_default,
  be: () => be_default,
  bg: () => bg_default,
  ca: () => ca_default,
  cs: () => cs_default,
  da: () => da_default,
  de: () => de_default,
  el: () => el_default,
  en: () => en_default,
  eo: () => eo_default,
  es: () => es_default,
  fa: () => fa_default,
  fi: () => fi_default,
  fr: () => fr_default,
  frCA: () => fr_CA_default,
  he: () => he_default,
  hr: () => hr_default,
  hu: () => hu_default,
  hy: () => hy_default,
  id: () => id_default,
  is: () => is_default,
  it: () => it_default,
  ja: () => ja_default,
  ka: () => ka_default,
  kh: () => kh_default,
  km: () => km_default,
  ko: () => ko_default,
  lt: () => lt_default,
  mk: () => mk_default,
  ms: () => ms_default,
  nl: () => nl_default,
  no: () => no_default,
  ota: () => ota_default,
  pl: () => pl_default,
  ps: () => ps_default,
  pt: () => pt_default,
  ro: () => ro_default,
  ru: () => ru_default,
  sl: () => sl_default,
  sv: () => sv_default,
  ta: () => ta_default,
  th: () => th_default,
  tr: () => tr_default,
  ua: () => ua_default,
  uk: () => uk_default,
  ur: () => ur_default,
  uz: () => uz_default,
  vi: () => vi_default,
  yo: () => yo_default,
  zhCN: () => zh_CN_default,
  zhTW: () => zh_TW_default,
});

// node_modules/zod/v4/locales/ar.js
var error = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0639\u0646\u0635\u0631",
      verb: "\u0623\u0646 \u064A\u062D\u0648\u064A",
    },
    file: {
      unit: "\u0628\u0627\u064A\u062A",
      verb: "\u0623\u0646 \u064A\u062D\u0648\u064A",
    },
    set: {
      unit: "\u0639\u0646\u0635\u0631",
      verb: "\u0623\u0646 \u064A\u062D\u0648\u064A",
    },
    string: {
      unit: "\u062D\u0631\u0641",
      verb: "\u0623\u0646 \u064A\u062D\u0648\u064A",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64-encoded",
    base64url:
      "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64url-encoded",
    cidrv4:
      "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv4",
    cidrv6:
      "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u062A\u0627\u0631\u064A\u062E \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    datetime:
      "\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    duration: "\u0645\u062F\u0629 \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    e164: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0628\u0645\u0639\u064A\u0627\u0631 E.164",
    email:
      "\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
    emoji: "\u0625\u064A\u0645\u0648\u062C\u064A",
    guid: "GUID",
    ipv4: "\u0639\u0646\u0648\u0627\u0646 IPv4",
    ipv6: "\u0639\u0646\u0648\u0627\u0646 IPv6",
    json_string:
      "\u0646\u064E\u0635 \u0639\u0644\u0649 \u0647\u064A\u0626\u0629 JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0645\u062F\u062E\u0644",
    template_literal: "\u0645\u062F\u062E\u0644",
    time: "\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    ulid: "ULID",
    url: "\u0631\u0627\u0628\u0637",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 instanceof ${issue2.expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
        }
        return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u0627\u062E\u062A\u064A\u0627\u0631 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062A\u0648\u0642\u0639 \u0627\u0646\u062A\u0642\u0627\u0621 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A: ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return ` \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"}`;
        }
        return `\u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 "${issue2.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0646\u062A\u0647\u064A \u0628\u0640 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0636\u0645\u0651\u064E\u0646 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0646\u0645\u0637 ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644`;
      }
      case "not_multiple_of": {
        return `\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646 \u0645\u0636\u0627\u0639\u0641\u0627\u062A ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u0645\u0639\u0631\u0641${issue2.keys.length > 1 ? "\u0627\u062A" : ""} \u063A\u0631\u064A\u0628${issue2.keys.length > 1 ? "\u0629" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
      }
      case "invalid_key": {
        return `\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
      }
      case "invalid_element": {
        return `\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
      }
      default: {
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
      }
    }
  };
}, "error");
function ar_default() {
  return {
    localeError: error(),
  };
}
__name(ar_default, "default");

// node_modules/zod/v4/locales/az.js
var error2 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "element", verb: "olmal\u0131d\u0131r" },
    file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
    set: { unit: "element", verb: "olmal\u0131d\u0131r" },
    string: { unit: "simvol", verb: "olmal\u0131d\u0131r" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO date",
    datetime: "ISO datetime",
    duration: "ISO duration",
    e164: "E.164 number",
    email: "email address",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    json_string: "JSON string",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "ISO time",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n instanceof ${issue2.expected}, daxil olan ${received}`;
        }
        return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${expected}, daxil olan ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Yanl\u0131\u015F se\xE7im: a\u015Fa\u011F\u0131dak\u0131lardan biri olmal\u0131d\u0131r: ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        }
        return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.prefix}" il\u0259 ba\u015Flamal\u0131d\u0131r`;
        }
        if (_issue.format === "ends_with") {
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.suffix}" il\u0259 bitm\u0259lidir`;
        }
        if (_issue.format === "includes") {
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.includes}" daxil olmal\u0131d\u0131r`;
        }
        if (_issue.format === "regex") {
          return `Yanl\u0131\u015F m\u0259tn: ${_issue.pattern} \u015Fablonuna uy\u011Fun olmal\u0131d\u0131r`;
        }
        return `Yanl\u0131\u015F ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Yanl\u0131\u015F \u0259d\u0259d: ${issue2.divisor} il\u0259 b\xF6l\xFCn\u0259 bil\u0259n olmal\u0131d\u0131r`;
      }
      case "unrecognized_keys": {
        return `Tan\u0131nmayan a\xE7ar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F a\xE7ar`;
      }
      case "invalid_union": {
        return "Yanl\u0131\u015F d\u0259y\u0259r";
      }
      case "invalid_element": {
        return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F d\u0259y\u0259r`;
      }
      default: {
        return `Yanl\u0131\u015F d\u0259y\u0259r`;
      }
    }
  };
}, "error");
function az_default() {
  return {
    localeError: error2(),
  };
}
__name(az_default, "default");

// node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
__name(getBelarusianPlural, "getBelarusianPlural");
var error3 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: {
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E",
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
      },
      verb: "\u043C\u0435\u0446\u044C",
    },
    file: {
      unit: {
        few: "\u0431\u0430\u0439\u0442\u044B",
        many: "\u0431\u0430\u0439\u0442\u0430\u045E",
        one: "\u0431\u0430\u0439\u0442",
      },
      verb: "\u043C\u0435\u0446\u044C",
    },
    set: {
      unit: {
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E",
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
      },
      verb: "\u043C\u0435\u0446\u044C",
    },
    string: {
      unit: {
        few: "\u0441\u0456\u043C\u0432\u0430\u043B\u044B",
        many: "\u0441\u0456\u043C\u0432\u0430\u043B\u0430\u045E",
        one: "\u0441\u0456\u043C\u0432\u0430\u043B",
      },
      verb: "\u043C\u0435\u0446\u044C",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64",
    base64url:
      "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64url",
    cidrv4: "IPv4 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u0434\u0430\u0442\u0430",
    datetime: "ISO \u0434\u0430\u0442\u0430 \u0456 \u0447\u0430\u0441",
    duration:
      "ISO \u043F\u0440\u0430\u0446\u044F\u0433\u043B\u0430\u0441\u0446\u044C",
    e164: "\u043D\u0443\u043C\u0430\u0440 E.164",
    email: "email \u0430\u0434\u0440\u0430\u0441",
    emoji: "\u044D\u043C\u043E\u0434\u0437\u0456",
    guid: "GUID",
    ipv4: "IPv4 \u0430\u0434\u0440\u0430\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0430\u0441",
    json_string: "JSON \u0440\u0430\u0434\u043E\u043A",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0443\u0432\u043E\u0434",
    template_literal: "\u0443\u0432\u043E\u0434",
    time: "ISO \u0447\u0430\u0441",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u043C\u0430\u0441\u0456\u045E",
    nan: "NaN",
    number: "\u043B\u0456\u043A",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F instanceof ${issue2.expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
        }
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F ${expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0432\u0430\u0440\u044B\u044F\u043D\u0442: \u0447\u0430\u043A\u0430\u045E\u0441\u044F \u0430\u0434\u0437\u0456\u043D \u0437 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getBelarusianPlural(
            maxValue,
            sizing.unit.one,
            sizing.unit.few,
            sizing.unit.many
          );
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getBelarusianPlural(
            minValue,
            sizing.unit.one,
            sizing.unit.few,
            sizing.unit.many
          );
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u043F\u0430\u0447\u044B\u043D\u0430\u0446\u0446\u0430 \u0437 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u0430\u043A\u0430\u043D\u0447\u0432\u0430\u0446\u0446\u0430 \u043D\u0430 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u043C\u044F\u0448\u0447\u0430\u0446\u044C "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0430\u0434\u043F\u0430\u0432\u044F\u0434\u0430\u0446\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        }
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043B\u0456\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0431\u044B\u0446\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u0430\u0437\u043D\u0430\u043D\u044B ${issue2.keys.length > 1 ? "\u043A\u043B\u044E\u0447\u044B" : "\u043A\u043B\u044E\u0447"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
      }
      case "invalid_element": {
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u0430\u0435 \u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435 \u045E ${issue2.origin}`;
      }
      default: {
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434`;
      }
    }
  };
}, "error");
function be_default() {
  return {
    localeError: error3(),
  };
}
__name(be_default, "default");

// node_modules/zod/v4/locales/bg.js
var error4 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
      verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430",
    },
    file: {
      unit: "\u0431\u0430\u0439\u0442\u0430",
      verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430",
    },
    set: {
      unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
      verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430",
    },
    string: {
      unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430",
      verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "base64-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
    base64url:
      "base64url-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
    cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u0434\u0430\u0442\u0430",
    datetime: "ISO \u0432\u0440\u0435\u043C\u0435",
    duration:
      "ISO \u043F\u0440\u043E\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E\u0441\u0442",
    e164: "E.164 \u043D\u043E\u043C\u0435\u0440",
    email: "\u0438\u043C\u0435\u0439\u043B \u0430\u0434\u0440\u0435\u0441",
    emoji: "\u0435\u043C\u043E\u0434\u0436\u0438",
    guid: "GUID",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
    json_string: "JSON \u043D\u0438\u0437",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0432\u0445\u043E\u0434",
    template_literal: "\u0432\u0445\u043E\u0434",
    time: "ISO \u0432\u0440\u0435\u043C\u0435",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u043C\u0430\u0441\u0438\u0432",
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D instanceof ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
        }
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u043E\u043F\u0446\u0438\u044F: \u043E\u0447\u0430\u043A\u0432\u0430\u043D\u043E \u0435\u0434\u043D\u043E \u043E\u0442 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430"}`;
        }
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u0432\u0430 \u0441 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u0432\u044A\u0440\u0448\u0432\u0430 \u0441 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0432\u043A\u043B\u044E\u0447\u0432\u0430 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0441\u044A\u0432\u043F\u0430\u0434\u0430 \u0441 ${_issue.pattern}`;
        }
        let invalid_adj =
          "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D";
        if (_issue.format === "emoji") {
          invalid_adj =
            "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        }
        if (_issue.format === "datetime") {
          invalid_adj =
            "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        }
        if (_issue.format === "date") {
          invalid_adj =
            "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        }
        if (_issue.format === "time") {
          invalid_adj =
            "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        }
        if (_issue.format === "duration") {
          invalid_adj =
            "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        }
        return `${invalid_adj} ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E \u0447\u0438\u0441\u043B\u043E: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0431\u044A\u0434\u0435 \u043A\u0440\u0430\u0442\u043D\u043E \u043D\u0430 ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u041D\u0435\u0440\u0430\u0437\u043F\u043E\u0437\u043D\u0430\u0442${issue2.keys.length > 1 ? "\u0438" : ""} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u043E\u0432\u0435" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434";
      }
      case "invalid_element": {
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442 \u0432 ${issue2.origin}`;
      }
      default: {
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434`;
      }
    }
  };
}, "error");
function bg_default() {
  return {
    localeError: error4(),
  };
}
__name(bg_default, "default");

// node_modules/zod/v4/locales/ca.js
var error5 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elements", verb: "contenir" },
    file: { unit: "bytes", verb: "contenir" },
    set: { unit: "elements", verb: "contenir" },
    string: { unit: "car\xE0cters", verb: "contenir" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "cadena codificada en base64",
    base64url: "cadena codificada en base64url",
    cidrv4: "rang IPv4",
    cidrv6: "rang IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "data ISO",
    datetime: "data i hora ISO",
    duration: "durada ISO",
    e164: "n\xFAmero E.164",
    email: "adre\xE7a electr\xF2nica",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "adre\xE7a IPv4",
    ipv6: "adre\xE7a IPv6",
    json_string: "cadena JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "entrada",
    template_literal: "entrada",
    time: "hora ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Tipus inv\xE0lid: s'esperava instanceof ${issue2.expected}, s'ha rebut ${received}`;
        }
        return `Tipus inv\xE0lid: s'esperava ${expected}, s'ha rebut ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Valor inv\xE0lid: s'esperava ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Opci\xF3 inv\xE0lida: s'esperava una de ${joinValues(issue2.values, " o ")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "com a m\xE0xim" : "menys de";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} contingu\xE9s ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        }
        return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} fos ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "com a m\xEDnim" : "m\xE9s de";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Massa petit: s'esperava que ${issue2.origin} contingu\xE9s ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Massa petit: s'esperava que ${issue2.origin} fos ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Format inv\xE0lid: ha de comen\xE7ar amb "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Format inv\xE0lid: ha d'acabar amb "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Format inv\xE0lid: ha d'incloure "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Format inv\xE0lid: ha de coincidir amb el patr\xF3 ${_issue.pattern}`;
        }
        return `Format inv\xE0lid per a ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `N\xFAmero inv\xE0lid: ha de ser m\xFAltiple de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Clau${issue2.keys.length > 1 ? "s" : ""} no reconeguda${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Clau inv\xE0lida a ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Entrada inv\xE0lida";
      }
      // Could also be "Tipus d'unió invàlid" but "Entrada invàlida" is more general
      case "invalid_element": {
        return `Element inv\xE0lid a ${issue2.origin}`;
      }
      default: {
        return `Entrada inv\xE0lida`;
      }
    }
  };
}, "error");
function ca_default() {
  return {
    localeError: error5(),
  };
}
__name(ca_default, "default");

// node_modules/zod/v4/locales/cs.js
var error6 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "prvk\u016F", verb: "m\xEDt" },
    file: { unit: "bajt\u016F", verb: "m\xEDt" },
    set: { unit: "prvk\u016F", verb: "m\xEDt" },
    string: { unit: "znak\u016F", verb: "m\xEDt" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64",
    base64url: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64url",
    cidrv4: "rozsah IPv4",
    cidrv6: "rozsah IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "datum ve form\xE1tu ISO",
    datetime: "datum a \u010Das ve form\xE1tu ISO",
    duration: "doba trv\xE1n\xED ISO",
    e164: "\u010D\xEDslo E.164",
    email: "e-mailov\xE1 adresa",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    json_string: "\u0159et\u011Bzec ve form\xE1tu JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "regul\xE1rn\xED v\xFDraz",
    template_literal: "vstup",
    time: "\u010Das ve form\xE1tu ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "pole",
    function: "funkce",
    nan: "NaN",
    number: "\u010D\xEDslo",
    string: "\u0159et\u011Bzec",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no instanceof ${issue2.expected}, obdr\u017Eeno ${received}`;
        }
        return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${expected}, obdr\u017Eeno ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Neplatn\xE1 mo\u017Enost: o\u010Dek\xE1v\xE1na jedna z hodnot ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
        }
        return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
        }
        return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED za\u010D\xEDnat na "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED kon\u010Dit na "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED obsahovat "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED odpov\xEDdat vzoru ${_issue.pattern}`;
        }
        return `Neplatn\xFD form\xE1t ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Neplatn\xE9 \u010D\xEDslo: mus\xED b\xFDt n\xE1sobkem ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Nezn\xE1m\xE9 kl\xED\u010De: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Neplatn\xFD kl\xED\u010D v ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Neplatn\xFD vstup";
      }
      case "invalid_element": {
        return `Neplatn\xE1 hodnota v ${issue2.origin}`;
      }
      default: {
        return `Neplatn\xFD vstup`;
      }
    }
  };
}, "error");
function cs_default() {
  return {
    localeError: error6(),
  };
}
__name(cs_default, "default");

// node_modules/zod/v4/locales/da.js
var error7 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementer", verb: "indeholdt" },
    file: { unit: "bytes", verb: "havde" },
    set: { unit: "elementer", verb: "indeholdt" },
    string: { unit: "tegn", verb: "havde" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-kodet streng",
    base64url: "base64url-kodet streng",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO-dato",
    datetime: "ISO dato- og klokkesl\xE6t",
    duration: "ISO-varighed",
    e164: "E.164-nummer",
    email: "e-mailadresse",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4-omr\xE5de",
    ipv6: "IPv6-omr\xE5de",
    json_string: "JSON-streng",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "ISO-klokkesl\xE6t",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "liste",
    boolean: "boolean",
    file: "fil",
    nan: "NaN",
    number: "tal",
    object: "objekt",
    set: "s\xE6t",
    string: "streng",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldigt input: forventede instanceof ${issue2.expected}, fik ${received}`;
        }
        return `Ugyldigt input: forventede ${expected}, fik ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Ugyldig v\xE6rdi: forventede ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Ugyldigt valg: forventede en af f\xF8lgende ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `For stor: forventede ${origin ?? "value"} ${sizing.verb} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
        }
        return `For stor: forventede ${origin ?? "value"} havde ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `For lille: forventede ${origin} ${sizing.verb} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lille: forventede ${origin} havde ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ugyldig streng: skal starte med "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Ugyldig streng: skal ende med "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Ugyldig streng: skal indeholde "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Ugyldig streng: skal matche m\xF8nsteret ${_issue.pattern}`;
        }
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Ugyldigt tal: skal v\xE6re deleligt med ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `${issue2.keys.length > 1 ? "Ukendte n\xF8gler" : "Ukendt n\xF8gle"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Ugyldig n\xF8gle i ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Ugyldigt input: matcher ingen af de tilladte typer";
      }
      case "invalid_element": {
        return `Ugyldig v\xE6rdi i ${issue2.origin}`;
      }
      default: {
        return `Ugyldigt input`;
      }
    }
  };
}, "error");
function da_default() {
  return {
    localeError: error7(),
  };
}
__name(da_default, "default");

// node_modules/zod/v4/locales/de.js
var error8 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "Elemente", verb: "zu haben" },
    file: { unit: "Bytes", verb: "zu haben" },
    set: { unit: "Elemente", verb: "zu haben" },
    string: { unit: "Zeichen", verb: "zu haben" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "Base64-codierter String",
    base64url: "Base64-URL-codierter String",
    cidrv4: "IPv4-Bereich",
    cidrv6: "IPv6-Bereich",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO-Datum",
    datetime: "ISO-Datum und -Uhrzeit",
    duration: "ISO-Dauer",
    e164: "E.164-Nummer",
    email: "E-Mail-Adresse",
    emoji: "Emoji",
    guid: "GUID",
    ipv4: "IPv4-Adresse",
    ipv6: "IPv6-Adresse",
    json_string: "JSON-String",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "Eingabe",
    template_literal: "Eingabe",
    time: "ISO-Uhrzeit",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "Array",
    nan: "NaN",
    number: "Zahl",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ung\xFCltige Eingabe: erwartet instanceof ${issue2.expected}, erhalten ${received}`;
        }
        return `Ung\xFCltige Eingabe: erwartet ${expected}, erhalten ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Ung\xFCltige Eingabe: erwartet ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Ung\xFCltige Option: erwartet eine von ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "Elemente"} hat`;
        }
        return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ist`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} hat`;
        }
        return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ist`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ung\xFCltiger String: muss mit "${_issue.prefix}" beginnen`;
        }
        if (_issue.format === "ends_with") {
          return `Ung\xFCltiger String: muss mit "${_issue.suffix}" enden`;
        }
        if (_issue.format === "includes") {
          return `Ung\xFCltiger String: muss "${_issue.includes}" enthalten`;
        }
        if (_issue.format === "regex") {
          return `Ung\xFCltiger String: muss dem Muster ${_issue.pattern} entsprechen`;
        }
        return `Ung\xFCltig: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Ung\xFCltige Zahl: muss ein Vielfaches von ${issue2.divisor} sein`;
      }
      case "unrecognized_keys": {
        return `${issue2.keys.length > 1 ? "Unbekannte Schl\xFCssel" : "Unbekannter Schl\xFCssel"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Ung\xFCltiger Schl\xFCssel in ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Ung\xFCltige Eingabe";
      }
      case "invalid_element": {
        return `Ung\xFCltiger Wert in ${issue2.origin}`;
      }
      default: {
        return `Ung\xFCltige Eingabe`;
      }
    }
  };
}, "error");
function de_default() {
  return {
    localeError: error8(),
  };
}
__name(de_default, "default");

// node_modules/zod/v4/locales/el.js
var error9 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1",
      verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9",
    },
    file: { unit: "bytes", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    map: {
      unit: "\u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03C3\u03B5\u03B9\u03C2",
      verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9",
    },
    set: {
      unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1",
      verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9",
    },
    string: {
      unit: "\u03C7\u03B1\u03C1\u03B1\u03BA\u03C4\u03AE\u03C1\u03B5\u03C2",
      verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64",
    base64url:
      "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64url",
    cidrv4: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv4",
    cidrv6: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1",
    datetime:
      "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1 \u03BA\u03B1\u03B9 \u03CE\u03C1\u03B1",
    duration: "ISO \u03B4\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1",
    e164: "\u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 E.164",
    email: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 email",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv4",
    ipv6: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv6",
    json_string:
      "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    mac: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 MAC",
    nanoid: "nanoid",
    regex: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2",
    template_literal: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2",
    time: "ISO \u03CE\u03C1\u03B1",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (
          typeof issue2.expected === "string" &&
          /^[A-Z]/.test(issue2.expected)
        ) {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD instanceof ${issue2.expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
        }
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD \u03AD\u03BD\u03B1 \u03B1\u03C0\u03CC ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1"}`;
        }
        return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03BE\u03B5\u03BA\u03B9\u03BD\u03AC \u03BC\u03B5 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B5\u03BB\u03B5\u03B9\u03CE\u03BD\u03B5\u03B9 \u03BC\u03B5 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C0\u03B5\u03C1\u03B9\u03AD\u03C7\u03B5\u03B9 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B1\u03B9\u03C1\u03B9\u03AC\u03B6\u03B5\u03B9 \u03BC\u03B5 \u03C4\u03BF \u03BC\u03BF\u03C4\u03AF\u03B2\u03BF ${_issue.pattern}`;
        }
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03BF \u03C4\u03BF\u03C5 ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u0386\u03B3\u03BD\u03C9\u03C3\u03C4${issue2.keys.length > 1 ? "\u03B1" : "\u03BF"} \u03BA\u03BB\u03B5\u03B9\u03B4${issue2.keys.length > 1 ? "\u03B9\u03AC" : "\u03AF"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03BA\u03BB\u03B5\u03B9\u03B4\u03AF \u03C3\u03C4\u03BF ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2";
      }
      case "invalid_element": {
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C4\u03B9\u03BC\u03AE \u03C3\u03C4\u03BF ${issue2.origin}`;
      }
      default: {
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2`;
      }
    }
  };
}, "error");
function el_default() {
  return {
    localeError: error9(),
  };
}
__name(el_default, "default");

// node_modules/zod/v4/locales/en.js
var error10 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "items", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    map: { unit: "entries", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    string: { unit: "characters", verb: "to have" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO date",
    datetime: "ISO datetime",
    duration: "ISO duration",
    e164: "E.164 number",
    email: "email address",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    json_string: "JSON string",
    jwt: "JWT",
    ksuid: "KSUID",
    mac: "MAC address",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "ISO time",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN",
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        }
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Invalid string: must end with "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Invalid string: must include "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Invalid string: must match pattern ${_issue.pattern}`;
        }
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Invalid key in ${issue2.origin}`;
      }
      case "invalid_union": {
        if (
          issue2.options &&
          Array.isArray(issue2.options) &&
          issue2.options.length > 0
        ) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        return "Invalid input";
      }
      case "invalid_element": {
        return `Invalid value in ${issue2.origin}`;
      }
      default: {
        return `Invalid input`;
      }
    }
  };
}, "error");
function en_default() {
  return {
    localeError: error10(),
  };
}
__name(en_default, "default");

// node_modules/zod/v4/locales/eo.js
var error11 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementojn", verb: "havi" },
    file: { unit: "bajtojn", verb: "havi" },
    set: { unit: "elementojn", verb: "havi" },
    string: { unit: "karaktrojn", verb: "havi" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "64-ume kodita karaktraro",
    base64url: "URL-64-ume kodita karaktraro",
    cidrv4: "IPv4-rango",
    cidrv6: "IPv6-rango",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO-dato",
    datetime: "ISO-datotempo",
    duration: "ISO-da\u016Dro",
    e164: "E.164-nombro",
    email: "retadreso",
    emoji: "emo\u011Dio",
    guid: "GUID",
    ipv4: "IPv4-adreso",
    ipv6: "IPv6-adreso",
    json_string: "JSON-karaktraro",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "enigo",
    template_literal: "enigo",
    time: "ISO-tempo",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "tabelo",
    nan: "NaN",
    null: "senvalora",
    number: "nombro",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Nevalida enigo: atendi\u011Dis instanceof ${issue2.expected}, ricevi\u011Dis ${received}`;
        }
        return `Nevalida enigo: atendi\u011Dis ${expected}, ricevi\u011Dis ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Nevalida enigo: atendi\u011Dis ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Nevalida opcio: atendi\u011Dis unu el ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementojn"}`;
        }
        return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} havu ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} estu ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Nevalida karaktraro: devas komenci\u011Di per "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Nevalida karaktraro: devas fini\u011Di per "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Nevalida karaktraro: devas inkluzivi "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Nevalida karaktraro: devas kongrui kun la modelo ${_issue.pattern}`;
        }
        return `Nevalida ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Nevalida nombro: devas esti oblo de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Nekonata${issue2.keys.length > 1 ? "j" : ""} \u015Dlosilo${issue2.keys.length > 1 ? "j" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Nevalida \u015Dlosilo en ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Nevalida enigo";
      }
      case "invalid_element": {
        return `Nevalida valoro en ${issue2.origin}`;
      }
      default: {
        return `Nevalida enigo`;
      }
    }
  };
}, "error");
function eo_default() {
  return {
    localeError: error11(),
  };
}
__name(eo_default, "default");

// node_modules/zod/v4/locales/es.js
var error12 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementos", verb: "tener" },
    file: { unit: "bytes", verb: "tener" },
    set: { unit: "elementos", verb: "tener" },
    string: { unit: "caracteres", verb: "tener" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "cadena codificada en base64",
    base64url: "URL codificada en base64",
    cidrv4: "rango IPv4",
    cidrv6: "rango IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "fecha ISO",
    datetime: "fecha y hora ISO",
    duration: "duraci\xF3n ISO",
    e164: "n\xFAmero E.164",
    email: "direcci\xF3n de correo electr\xF3nico",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "direcci\xF3n IPv4",
    ipv6: "direcci\xF3n IPv6",
    json_string: "cadena JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "entrada",
    template_literal: "entrada",
    time: "hora ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    any: "cualquiera",
    array: "arreglo",
    bigint: "n\xFAmero grande",
    boolean: "booleano",
    date: "fecha",
    enum: "enumeraci\xF3n",
    file: "archivo",
    function: "funci\xF3n",
    literal: "literal",
    map: "mapa",
    nan: "NaN",
    never: "nunca",
    null: "nulo",
    number: "n\xFAmero",
    object: "objeto",
    promise: "promesa",
    record: "registro",
    set: "conjunto",
    string: "texto",
    symbol: "s\xEDmbolo",
    tuple: "tupla",
    undefined: "indefinido",
    union: "uni\xF3n",
    unknown: "desconocido",
    void: "vac\xEDo",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entrada inv\xE1lida: se esperaba instanceof ${issue2.expected}, recibido ${received}`;
        }
        return `Entrada inv\xE1lida: se esperaba ${expected}, recibido ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Entrada inv\xE1lida: se esperaba ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Opci\xF3n inv\xE1lida: se esperaba una de ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Demasiado grande: se esperaba que ${origin ?? "valor"} tuviera ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        }
        return `Demasiado grande: se esperaba que ${origin ?? "valor"} fuera ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Demasiado peque\xF1o: se esperaba que ${origin} tuviera ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Demasiado peque\xF1o: se esperaba que ${origin} fuera ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Cadena inv\xE1lida: debe comenzar con "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Cadena inv\xE1lida: debe terminar en "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Cadena inv\xE1lida: debe incluir "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Cadena inv\xE1lida: debe coincidir con el patr\xF3n ${_issue.pattern}`;
        }
        return `Inv\xE1lido ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `N\xFAmero inv\xE1lido: debe ser m\xFAltiplo de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Llave${issue2.keys.length > 1 ? "s" : ""} desconocida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Llave inv\xE1lida en ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      }
      case "invalid_union": {
        return "Entrada inv\xE1lida";
      }
      case "invalid_element": {
        return `Valor inv\xE1lido en ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      }
      default: {
        return `Entrada inv\xE1lida`;
      }
    }
  };
}, "error");
function es_default() {
  return {
    localeError: error12(),
  };
}
__name(es_default, "default");

// node_modules/zod/v4/locales/fa.js
var error13 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0622\u06CC\u062A\u0645",
      verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F",
    },
    file: {
      unit: "\u0628\u0627\u06CC\u062A",
      verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F",
    },
    set: {
      unit: "\u0622\u06CC\u062A\u0645",
      verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F",
    },
    string: {
      unit: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631",
      verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-encoded \u0631\u0634\u062A\u0647",
    base64url: "base64url-encoded \u0631\u0634\u062A\u0647",
    cidrv4: "IPv4 \u062F\u0627\u0645\u0646\u0647",
    cidrv6: "IPv6 \u062F\u0627\u0645\u0646\u0647",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u062A\u0627\u0631\u06CC\u062E \u0627\u06CC\u0632\u0648",
    datetime:
      "\u062A\u0627\u0631\u06CC\u062E \u0648 \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    duration:
      "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    e164: "E.164 \u0639\u062F\u062F",
    email: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
    guid: "GUID",
    ipv4: "IPv4 \u0622\u062F\u0631\u0633",
    ipv6: "IPv6 \u0622\u062F\u0631\u0633",
    json_string: "JSON \u0631\u0634\u062A\u0647",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0648\u0631\u0648\u062F\u06CC",
    template_literal: "\u0648\u0631\u0648\u062F\u06CC",
    time: "\u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u0622\u0631\u0627\u06CC\u0647",
    nan: "NaN",
    number: "\u0639\u062F\u062F",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A instanceof ${issue2.expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
        }
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${stringifyPrimitive(issue2.values[0])} \u0645\u06CC\u200C\u0628\u0648\u062F`;
        }
        return `\u06AF\u0632\u06CC\u0646\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A \u06CC\u06A9\u06CC \u0627\u0632 ${joinValues(issue2.values, "|")} \u0645\u06CC\u200C\u0628\u0648\u062F`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"} \u0628\u0627\u0634\u062F`;
        }
        return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0628\u0627\u0634\u062F`;
        }
        return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.prefix}" \u0634\u0631\u0648\u0639 \u0634\u0648\u062F`;
        }
        if (_issue.format === "ends_with") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.suffix}" \u062A\u0645\u0627\u0645 \u0634\u0648\u062F`;
        }
        if (_issue.format === "includes") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0634\u0627\u0645\u0644 "${_issue.includes}" \u0628\u0627\u0634\u062F`;
        }
        if (_issue.format === "regex") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 \u0627\u0644\u06AF\u0648\u06CC ${_issue.pattern} \u0645\u0637\u0627\u0628\u0642\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      }
      case "not_multiple_of": {
        return `\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0645\u0636\u0631\u0628 ${issue2.divisor} \u0628\u0627\u0634\u062F`;
      }
      case "unrecognized_keys": {
        return `\u06A9\u0644\u06CC\u062F${issue2.keys.length > 1 ? "\u0647\u0627\u06CC" : ""} \u0646\u0627\u0634\u0646\u0627\u0633: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u06A9\u0644\u06CC\u062F \u0646\u0627\u0634\u0646\u0627\u0633 \u062F\u0631 ${issue2.origin}`;
      }
      case "invalid_union": {
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      }
      case "invalid_element": {
        return `\u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u062F\u0631 ${issue2.origin}`;
      }
      default: {
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      }
    }
  };
}, "error");
function fa_default() {
  return {
    localeError: error13(),
  };
}
__name(fa_default, "default");

// node_modules/zod/v4/locales/fi.js
var error14 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { subject: "listan", unit: "alkiota" },
    bigint: { subject: "suuren kokonaisluvun", unit: "" },
    date: { subject: "p\xE4iv\xE4m\xE4\xE4r\xE4n", unit: "" },
    file: { subject: "tiedoston", unit: "tavua" },
    int: { subject: "kokonaisluvun", unit: "" },
    number: { subject: "luvun", unit: "" },
    set: { subject: "joukon", unit: "alkiota" },
    string: { subject: "merkkijonon", unit: "merkki\xE4" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-koodattu merkkijono",
    base64url: "base64url-koodattu merkkijono",
    cidrv4: "IPv4-alue",
    cidrv6: "IPv6-alue",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO-p\xE4iv\xE4m\xE4\xE4r\xE4",
    datetime: "ISO-aikaleima",
    duration: "ISO-kesto",
    e164: "E.164-luku",
    email: "s\xE4hk\xF6postiosoite",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4-osoite",
    ipv6: "IPv6-osoite",
    json_string: "JSON-merkkijono",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "s\xE4\xE4nn\xF6llinen lauseke",
    template_literal: "templaattimerkkijono",
    time: "ISO-aika",
    ulid: "ULID",
    url: "URL-osoite",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Virheellinen tyyppi: odotettiin instanceof ${issue2.expected}, oli ${received}`;
        }
        return `Virheellinen tyyppi: odotettiin ${expected}, oli ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Virheellinen sy\xF6te: t\xE4ytyy olla ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Virheellinen valinta: t\xE4ytyy olla yksi seuraavista: ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Liian suuri: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.maximum.toString()} ${sizing.unit}`.trim();
        }
        return `Liian suuri: arvon t\xE4ytyy olla ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Liian pieni: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.minimum.toString()} ${sizing.unit}`.trim();
        }
        return `Liian pieni: arvon t\xE4ytyy olla ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Virheellinen sy\xF6te: t\xE4ytyy alkaa "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Virheellinen sy\xF6te: t\xE4ytyy loppua "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Virheellinen sy\xF6te: t\xE4ytyy sis\xE4lt\xE4\xE4 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Virheellinen sy\xF6te: t\xE4ytyy vastata s\xE4\xE4nn\xF6llist\xE4 lauseketta ${_issue.pattern}`;
        }
        return `Virheellinen ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Virheellinen luku: t\xE4ytyy olla luvun ${issue2.divisor} monikerta`;
      }
      case "unrecognized_keys": {
        return `${issue2.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return "Virheellinen avain tietueessa";
      }
      case "invalid_union": {
        return "Virheellinen unioni";
      }
      case "invalid_element": {
        return "Virheellinen arvo joukossa";
      }
      default: {
        return `Virheellinen sy\xF6te`;
      }
    }
  };
}, "error");
function fi_default() {
  return {
    localeError: error14(),
  };
}
__name(fi_default, "default");

// node_modules/zod/v4/locales/fr.js
var error15 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\xE9l\xE9ments", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    set: { unit: "\xE9l\xE9ments", verb: "avoir" },
    string: { unit: "caract\xE8res", verb: "avoir" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "cha\xEEne encod\xE9e en base64",
    base64url: "cha\xEEne encod\xE9e en base64url",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "date ISO",
    datetime: "date et heure ISO",
    duration: "dur\xE9e ISO",
    e164: "num\xE9ro E.164",
    email: "adresse e-mail",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    json_string: "cha\xEEne JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "entr\xE9e",
    template_literal: "entr\xE9e",
    time: "heure ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "tableau",
    bigint: "grand entier",
    boolean: "bool\xE9en",
    date: "date",
    file: "fichier",
    function: "fonction",
    int: "entier",
    map: "carte",
    nan: "NaN",
    never: "jamais",
    nonoptional: "non-optionnel",
    null: "null",
    number: "nombre",
    object: "objet",
    record: "enregistrement",
    set: "ensemble",
    string: "cha\xEEne",
    symbol: "symbole",
    tuple: "tuple",
    undefined: "ind\xE9fini",
    void: "vide",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entr\xE9e invalide : instanceof ${issue2.expected} attendu, ${received} re\xE7u`;
        }
        return `Entr\xE9e invalide : ${expected} attendu, ${received} re\xE7u`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Entr\xE9e invalide : ${stringifyPrimitive(issue2.values[0])} attendu`;
        }
        return `Option invalide : une valeur parmi ${joinValues(issue2.values, "|")} attendue`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Trop grand : ${TypeDictionary[issue2.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xE9l\xE9ment(s)"}`;
        }
        return `Trop grand : ${TypeDictionary[issue2.origin] ?? "valeur"} doit \xEAtre ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Trop petit : ${TypeDictionary[issue2.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Trop petit : ${TypeDictionary[issue2.origin] ?? "valeur"} doit \xEAtre ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Cha\xEEne invalide : doit correspondre au mod\xE8le ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} invalide`;
      }
      case "not_multiple_of": {
        return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Cl\xE9 invalide dans ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Entr\xE9e invalide";
      }
      case "invalid_element": {
        return `Valeur invalide dans ${issue2.origin}`;
      }
      default: {
        return `Entr\xE9e invalide`;
      }
    }
  };
}, "error");
function fr_default() {
  return {
    localeError: error15(),
  };
}
__name(fr_default, "default");

// node_modules/zod/v4/locales/fr-CA.js
var error16 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\xE9l\xE9ments", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    set: { unit: "\xE9l\xE9ments", verb: "avoir" },
    string: { unit: "caract\xE8res", verb: "avoir" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "cha\xEEne encod\xE9e en base64",
    base64url: "cha\xEEne encod\xE9e en base64url",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "date ISO",
    datetime: "date-heure ISO",
    duration: "dur\xE9e ISO",
    e164: "num\xE9ro E.164",
    email: "adresse courriel",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    json_string: "cha\xEEne JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "entr\xE9e",
    template_literal: "entr\xE9e",
    time: "heure ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entr\xE9e invalide : attendu instanceof ${issue2.expected}, re\xE7u ${received}`;
        }
        return `Entr\xE9e invalide : attendu ${expected}, re\xE7u ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Entr\xE9e invalide : attendu ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Option invalide : attendu l'une des valeurs suivantes ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "\u2264" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} ait ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        }
        return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} soit ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u2265" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Trop petit : attendu que ${issue2.origin} ait ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Trop petit : attendu que ${issue2.origin} soit ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Cha\xEEne invalide : doit correspondre au motif ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} invalide`;
      }
      case "not_multiple_of": {
        return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Cl\xE9 invalide dans ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Entr\xE9e invalide";
      }
      case "invalid_element": {
        return `Valeur invalide dans ${issue2.origin}`;
      }
      default: {
        return `Entr\xE9e invalide`;
      }
    }
  };
}, "error");
function fr_CA_default() {
  return {
    localeError: error16(),
  };
}
__name(fr_CA_default, "default");

// node_modules/zod/v4/locales/he.js
var error17 = /* @__PURE__ */ __name(() => {
  const TypeNames = {
    NaN: { gender: "m", label: "NaN" },
    array: { gender: "m", label: "\u05DE\u05E2\u05E8\u05DA" },
    bigint: { gender: "m", label: "BigInt" },
    boolean: {
      gender: "m",
      label: "\u05E2\u05E8\u05DA \u05D1\u05D5\u05DC\u05D9\u05D0\u05E0\u05D9",
    },
    date: { gender: "m", label: "\u05EA\u05D0\u05E8\u05D9\u05DA" },
    file: { gender: "m", label: "\u05E7\u05D5\u05D1\u05E5" },
    function: {
      gender: "f",
      label: "\u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4",
    },
    map: { gender: "f", label: "\u05DE\u05E4\u05D4 (Map)" },
    null: {
      gender: "m",
      label: "\u05E2\u05E8\u05DA \u05E8\u05D9\u05E7 (null)",
    },
    number: { gender: "m", label: "\u05DE\u05E1\u05E4\u05E8" },
    object: {
      gender: "m",
      label: "\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8",
    },
    promise: { gender: "m", label: "Promise" },
    set: { gender: "f", label: "\u05E7\u05D1\u05D5\u05E6\u05D4 (Set)" },
    string: { gender: "f", label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA" },
    symbol: {
      gender: "m",
      label: "\u05E1\u05D9\u05DE\u05D1\u05D5\u05DC (Symbol)",
    },
    undefined: {
      gender: "m",
      label:
        "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05DE\u05D5\u05D2\u05D3\u05E8 (undefined)",
    },
    unknown: {
      gender: "m",
      label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2",
    },
    value: { gender: "m", label: "\u05E2\u05E8\u05DA" },
  };
  const Sizable = {
    array: {
      longLabel: "\u05D2\u05D3\u05D5\u05DC",
      shortLabel: "\u05E7\u05D8\u05DF",
      unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD",
    },
    file: {
      longLabel: "\u05D2\u05D3\u05D5\u05DC",
      shortLabel: "\u05E7\u05D8\u05DF",
      unit: "\u05D1\u05D9\u05D9\u05D8\u05D9\u05DD",
    },
    number: {
      longLabel: "\u05D2\u05D3\u05D5\u05DC",
      shortLabel: "\u05E7\u05D8\u05DF",
      unit: "",
    },
    // no unit
    set: {
      longLabel: "\u05D2\u05D3\u05D5\u05DC",
      shortLabel: "\u05E7\u05D8\u05DF",
      unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD",
    },
    string: {
      longLabel: "\u05D0\u05E8\u05D5\u05DA",
      shortLabel: "\u05E7\u05E6\u05E8",
      unit: "\u05EA\u05D5\u05D5\u05D9\u05DD",
    },
  };
  const typeEntry = /* @__PURE__ */ __name(
    (t) => (t ? TypeNames[t] : void 0),
    "typeEntry"
  );
  const typeLabel = /* @__PURE__ */ __name((t) => {
    const e = typeEntry(t);
    if (e) {
      return e.label;
    }
    return t ?? TypeNames.unknown.label;
  }, "typeLabel");
  const withDefinite = /* @__PURE__ */ __name(
    (t) => `\u05D4${typeLabel(t)}`,
    "withDefinite"
  );
  const verbFor = /* @__PURE__ */ __name((t) => {
    const e = typeEntry(t);
    const gender = e?.gender ?? "m";
    return gender === "f"
      ? "\u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA"
      : "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA";
  }, "verbFor");
  const getSizing = /* @__PURE__ */ __name((origin) => {
    if (!origin) {
      return null;
    }
    return Sizable[origin] ?? null;
  }, "getSizing");
  const FormatDictionary = {
    base64: {
      gender: "f",
      label:
        "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64",
    },
    base64url: {
      gender: "f",
      label:
        "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64 \u05DC\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA \u05E8\u05E9\u05EA",
    },
    cidrv4: { gender: "m", label: "\u05D8\u05D5\u05D5\u05D7 IPv4" },
    cidrv6: { gender: "m", label: "\u05D8\u05D5\u05D5\u05D7 IPv6" },
    cuid: { gender: "m", label: "cuid" },
    cuid2: { gender: "m", label: "cuid2" },
    date: { gender: "m", label: "\u05EA\u05D0\u05E8\u05D9\u05DA ISO" },
    datetime: {
      gender: "m",
      label: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05D6\u05DE\u05DF ISO",
    },
    duration: {
      gender: "m",
      label: "\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF ISO",
    },
    e164: { gender: "m", label: "\u05DE\u05E1\u05E4\u05E8 E.164" },
    email: {
      gender: "f",
      label:
        "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC",
    },
    emoji: { gender: "m", label: "\u05D0\u05D9\u05DE\u05D5\u05D2'\u05D9" },
    ends_with: { gender: "m", label: "\u05E7\u05DC\u05D8" },
    guid: { gender: "m", label: "GUID" },
    includes: { gender: "m", label: "\u05E7\u05DC\u05D8" },
    ipv4: { gender: "f", label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv4" },
    ipv6: { gender: "f", label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv6" },
    json_string: {
      gender: "f",
      label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA JSON",
    },
    jwt: { gender: "m", label: "JWT" },
    ksuid: { gender: "m", label: "KSUID" },
    lowercase: { gender: "m", label: "\u05E7\u05DC\u05D8" },
    nanoid: { gender: "m", label: "nanoid" },
    regex: { gender: "m", label: "\u05E7\u05DC\u05D8" },
    starts_with: { gender: "m", label: "\u05E7\u05DC\u05D8" },
    time: { gender: "m", label: "\u05D6\u05DE\u05DF ISO" },
    ulid: { gender: "m", label: "ULID" },
    uppercase: { gender: "m", label: "\u05E7\u05DC\u05D8" },
    url: {
      gender: "f",
      label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05E8\u05E9\u05EA",
    },
    uuid: { gender: "m", label: "UUID" },
    xid: { gender: "m", label: "XID" },
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expectedKey = issue2.expected;
        const expected =
          TypeDictionary[expectedKey ?? ""] ?? typeLabel(expectedKey);
        const receivedType = parsedType(issue2.input);
        const received =
          TypeDictionary[receivedType] ??
          TypeNames[receivedType]?.label ??
          receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA instanceof ${issue2.expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
        }
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05E2\u05E8\u05DA \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA ${stringifyPrimitive(issue2.values[0])}`;
        }
        const stringified = issue2.values.map((v) => stringifyPrimitive(v));
        if (issue2.values.length === 2) {
          return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${stringified[0]} \u05D0\u05D5 ${stringified[1]}`;
        }
        const lastValue = stringified.at(-1);
        const restValues = stringified.slice(0, -1).join(", ");
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${restValues} \u05D0\u05D5 ${lastValue}`;
      }
      case "too_big": {
        const sizing = getSizing(issue2.origin);
        const subject = withDefinite(issue2.origin ?? "value");
        if (issue2.origin === "string") {
          return `${sizing?.longLabel ?? "\u05D0\u05E8\u05D5\u05DA"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue2.maximum.toString()} ${sizing?.unit ?? ""} ${issue2.inclusive ? "\u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA" : "\u05DC\u05DB\u05DC \u05D4\u05D9\u05D5\u05EA\u05E8"}`.trim();
        }
        if (issue2.origin === "number") {
          const comparison = issue2.inclusive
            ? `\u05E7\u05D8\u05DF \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue2.maximum}`
            : `\u05E7\u05D8\u05DF \u05DE-${issue2.maximum}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
        }
        if (issue2.origin === "array" || issue2.origin === "set") {
          const verb =
            issue2.origin === "set"
              ? "\u05E6\u05E8\u05D9\u05DB\u05D4"
              : "\u05E6\u05E8\u05D9\u05DA";
          const comparison = issue2.inclusive
            ? `${issue2.maximum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA`
            : `\u05E4\u05D7\u05D5\u05EA \u05DE-${issue2.maximum} ${sizing?.unit ?? ""}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
        }
        const adj = issue2.inclusive ? "<=" : "<";
        const be = verbFor(issue2.origin ?? "value");
        if (sizing?.unit) {
          return `${sizing.longLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        }
        return `${sizing?.longLabel ?? "\u05D2\u05D3\u05D5\u05DC"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const sizing = getSizing(issue2.origin);
        const subject = withDefinite(issue2.origin ?? "value");
        if (issue2.origin === "string") {
          return `${sizing?.shortLabel ?? "\u05E7\u05E6\u05E8"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue2.minimum.toString()} ${sizing?.unit ?? ""} ${issue2.inclusive ? "\u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8" : "\u05DC\u05E4\u05D7\u05D5\u05EA"}`.trim();
        }
        if (issue2.origin === "number") {
          const comparison = issue2.inclusive
            ? `\u05D2\u05D3\u05D5\u05DC \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue2.minimum}`
            : `\u05D2\u05D3\u05D5\u05DC \u05DE-${issue2.minimum}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
        }
        if (issue2.origin === "array" || issue2.origin === "set") {
          const verb =
            issue2.origin === "set"
              ? "\u05E6\u05E8\u05D9\u05DB\u05D4"
              : "\u05E6\u05E8\u05D9\u05DA";
          if (issue2.minimum === 1 && issue2.inclusive) {
            const singularPhrase =
              issue2.origin === "set"
                ? "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3"
                : "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3";
            return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${singularPhrase}`;
          }
          const comparison = issue2.inclusive
            ? `${issue2.minimum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8`
            : `\u05D9\u05D5\u05EA\u05E8 \u05DE-${issue2.minimum} ${sizing?.unit ?? ""}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
        }
        const adj = issue2.inclusive ? ">=" : ">";
        const be = verbFor(issue2.origin ?? "value");
        if (sizing?.unit) {
          return `${sizing.shortLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `${sizing?.shortLabel ?? "\u05E7\u05D8\u05DF"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05D1 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05DC\u05EA\u05D1\u05E0\u05D9\u05EA ${_issue.pattern}`;
        }
        const nounEntry = FormatDictionary[_issue.format];
        const noun = nounEntry?.label ?? _issue.format;
        const gender = nounEntry?.gender ?? "m";
        const adjective =
          gender === "f"
            ? "\u05EA\u05E7\u05D9\u05E0\u05D4"
            : "\u05EA\u05E7\u05D9\u05DF";
        return `${noun} \u05DC\u05D0 ${adjective}`;
      }
      case "not_multiple_of": {
        return `\u05DE\u05E1\u05E4\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05DB\u05E4\u05DC\u05D4 \u05E9\u05DC ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u05DE\u05E4\u05EA\u05D7${issue2.keys.length > 1 ? "\u05D5\u05EA" : ""} \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4${issue2.keys.length > 1 ? "\u05D9\u05DD" : "\u05D4"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u05E9\u05D3\u05D4 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8`;
      }
      case "invalid_union": {
        return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
      }
      case "invalid_element": {
        const place = withDefinite(issue2.origin ?? "array");
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${place}`;
      }
      default: {
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF`;
      }
    }
  };
}, "error");
function he_default() {
  return {
    localeError: error17(),
  };
}
__name(he_default, "default");

// node_modules/zod/v4/locales/hr.js
var error18 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "stavki", verb: "imati" },
    file: { unit: "bajtova", verb: "imati" },
    set: { unit: "stavki", verb: "imati" },
    string: { unit: "znakova", verb: "imati" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 kodirani tekst",
    base64url: "base64url kodirani tekst",
    cidrv4: "IPv4 raspon",
    cidrv6: "IPv6 raspon",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO datum",
    datetime: "ISO datum i vrijeme",
    duration: "ISO trajanje",
    e164: "E.164 broj",
    email: "email adresa",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    json_string: "JSON tekst",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "unos",
    template_literal: "unos",
    time: "ISO vrijeme",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "niz",
    bigint: "bigint",
    boolean: "boolean",
    date: "datum",
    file: "datoteka",
    function: "funkcija",
    map: "mapa",
    nan: "NaN",
    null: "null",
    number: "broj",
    object: "objekt",
    set: "skup",
    string: "tekst",
    symbol: "simbol",
    undefined: "undefined",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neispravan unos: o\u010Dekuje se instanceof ${issue2.expected}, a primljeno je ${received}`;
        }
        return `Neispravan unos: o\u010Dekuje se ${expected}, a primljeno je ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Neispravna vrijednost: o\u010Dekivano ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Neispravna opcija: o\u010Dekivano jedno od ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} ima ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemenata"}`;
        }
        return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} bude ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Premalo: o\u010Dekivano da ${origin} ima ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Premalo: o\u010Dekivano da ${origin} bude ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Neispravan tekst: mora zapo\u010Dinjati s "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Neispravan tekst: mora zavr\u0161avati s "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Neispravan tekst: mora sadr\u017Eavati "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Neispravan tekst: mora odgovarati uzorku ${_issue.pattern}`;
        }
        return `Neispravna ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Neispravan broj: mora biti vi\u0161ekratnik od ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Neprepoznat${issue2.keys.length > 1 ? "i klju\u010Devi" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Neispravan klju\u010D u ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      }
      case "invalid_union": {
        return "Neispravan unos";
      }
      case "invalid_element": {
        return `Neispravna vrijednost u ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      }
      default: {
        return `Neispravan unos`;
      }
    }
  };
}, "error");
function hr_default() {
  return {
    localeError: error18(),
  };
}
__name(hr_default, "default");

// node_modules/zod/v4/locales/hu.js
var error19 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elem", verb: "legyen" },
    file: { unit: "byte", verb: "legyen" },
    set: { unit: "elem", verb: "legyen" },
    string: { unit: "karakter", verb: "legyen" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-k\xF3dolt string",
    base64url: "base64url-k\xF3dolt string",
    cidrv4: "IPv4 tartom\xE1ny",
    cidrv6: "IPv6 tartom\xE1ny",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO d\xE1tum",
    datetime: "ISO id\u0151b\xE9lyeg",
    duration: "ISO id\u0151intervallum",
    e164: "E.164 sz\xE1m",
    email: "email c\xEDm",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 c\xEDm",
    ipv6: "IPv6 c\xEDm",
    json_string: "JSON string",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "bemenet",
    template_literal: "bemenet",
    time: "ISO id\u0151",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "t\xF6mb",
    nan: "NaN",
    number: "sz\xE1m",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k instanceof ${issue2.expected}, a kapott \xE9rt\xE9k ${received}`;
        }
        return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${expected}, a kapott \xE9rt\xE9k ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\xC9rv\xE9nytelen opci\xF3: valamelyik \xE9rt\xE9k v\xE1rt ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `T\xFAl nagy: ${issue2.origin ?? "\xE9rt\xE9k"} m\xE9rete t\xFAl nagy ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elem"}`;
        }
        return `T\xFAl nagy: a bemeneti \xE9rt\xE9k ${issue2.origin ?? "\xE9rt\xE9k"} t\xFAl nagy: ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} m\xE9rete t\xFAl kicsi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} t\xFAl kicsi ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\xC9rv\xE9nytelen string: "${_issue.prefix}" \xE9rt\xE9kkel kell kezd\u0151dnie`;
        }
        if (_issue.format === "ends_with") {
          return `\xC9rv\xE9nytelen string: "${_issue.suffix}" \xE9rt\xE9kkel kell v\xE9gz\u0151dnie`;
        }
        if (_issue.format === "includes") {
          return `\xC9rv\xE9nytelen string: "${_issue.includes}" \xE9rt\xE9ket kell tartalmaznia`;
        }
        if (_issue.format === "regex") {
          return `\xC9rv\xE9nytelen string: ${_issue.pattern} mint\xE1nak kell megfelelnie`;
        }
        return `\xC9rv\xE9nytelen ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\xC9rv\xE9nytelen sz\xE1m: ${issue2.divisor} t\xF6bbsz\xF6r\xF6s\xE9nek kell lennie`;
      }
      case "unrecognized_keys": {
        return `Ismeretlen kulcs${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\xC9rv\xE9nytelen kulcs ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\xC9rv\xE9nytelen bemenet";
      }
      case "invalid_element": {
        return `\xC9rv\xE9nytelen \xE9rt\xE9k: ${issue2.origin}`;
      }
      default: {
        return `\xC9rv\xE9nytelen bemenet`;
      }
    }
  };
}, "error");
function hu_default() {
  return {
    localeError: error19(),
  };
}
__name(hu_default, "default");

// node_modules/zod/v4/locales/hy.js
function getArmenianPlural(count, one, many) {
  return Math.abs(count) === 1 ? one : many;
}
__name(getArmenianPlural, "getArmenianPlural");
function withDefiniteArticle(word) {
  if (!word) {
    return "";
  }
  const vowels = [
    "\u0561",
    "\u0565",
    "\u0568",
    "\u056B",
    "\u0578",
    "\u0578\u0582",
    "\u0585",
  ];
  const lastChar = word.at(-1);
  return word + (vowels.includes(lastChar) ? "\u0576" : "\u0568");
}
__name(withDefiniteArticle, "withDefiniteArticle");
var error20 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: {
        many: "\u057F\u0561\u0580\u0580\u0565\u0580",
        one: "\u057F\u0561\u0580\u0580",
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C",
    },
    file: {
      unit: {
        many: "\u0562\u0561\u0575\u0569\u0565\u0580",
        one: "\u0562\u0561\u0575\u0569",
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C",
    },
    set: {
      unit: {
        many: "\u057F\u0561\u0580\u0580\u0565\u0580",
        one: "\u057F\u0561\u0580\u0580",
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C",
    },
    string: {
      unit: {
        many: "\u0576\u0577\u0561\u0576\u0576\u0565\u0580",
        one: "\u0576\u0577\u0561\u0576",
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "base64 \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
    base64url:
      "base64url \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
    cidrv4: "IPv4 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
    cidrv6: "IPv6 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E",
    datetime:
      "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E \u0587 \u056A\u0561\u0574",
    duration:
      "ISO \u057F\u0587\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
    e164: "E.164 \u0570\u0561\u0574\u0561\u0580",
    email: "\u0567\u056C. \u0570\u0561\u057D\u0581\u0565",
    emoji: "\u0567\u0574\u0578\u057B\u056B",
    guid: "GUID",
    ipv4: "IPv4 \u0570\u0561\u057D\u0581\u0565",
    ipv6: "IPv6 \u0570\u0561\u057D\u0581\u0565",
    json_string: "JSON \u057F\u0578\u0572",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0574\u0578\u0582\u057F\u0584",
    template_literal: "\u0574\u0578\u0582\u057F\u0584",
    time: "ISO \u056A\u0561\u0574",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u0566\u0561\u0576\u0563\u057E\u0561\u056E",
    nan: "NaN",
    number: "\u0569\u056B\u057E",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 instanceof ${issue2.expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
        }
        return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${stringifyPrimitive(issue2.values[1])}`;
        }
        return `\u054D\u056D\u0561\u056C \u057F\u0561\u0580\u0562\u0565\u0580\u0561\u056F\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 \u0570\u0565\u057F\u0587\u0575\u0561\u056C\u0576\u0565\u0580\u056B\u0581 \u0574\u0565\u056F\u0568\u055D ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getArmenianPlural(
            maxValue,
            sizing.unit.one,
            sizing.unit.many
          );
          return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056C\u056B\u0576\u056B ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getArmenianPlural(
            minValue,
            sizing.unit.one,
            sizing.unit.many
          );
          return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin)} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin)} \u056C\u056B\u0576\u056B ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057D\u056F\u057D\u057E\u056B "${_issue.prefix}"-\u0578\u057E`;
        }
        if (_issue.format === "ends_with") {
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0561\u057E\u0561\u0580\u057F\u057E\u056B "${_issue.suffix}"-\u0578\u057E`;
        }
        if (_issue.format === "includes") {
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057A\u0561\u0580\u0578\u0582\u0576\u0561\u056F\u056B "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0570\u0561\u0574\u0561\u057A\u0561\u057F\u0561\u057D\u056D\u0561\u0576\u056B ${_issue.pattern} \u0571\u0587\u0561\u0579\u0561\u0583\u056B\u0576`;
        }
        return `\u054D\u056D\u0561\u056C ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u054D\u056D\u0561\u056C \u0569\u056B\u057E\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0562\u0561\u0566\u0574\u0561\u057A\u0561\u057F\u056B\u056F \u056C\u056B\u0576\u056B ${issue2.divisor}-\u056B`;
      }
      case "unrecognized_keys": {
        return `\u0549\u0573\u0561\u0576\u0561\u0579\u057E\u0561\u056E \u0562\u0561\u0576\u0561\u056C\u056B${issue2.keys.length > 1 ? "\u0576\u0565\u0580" : ""}. ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u054D\u056D\u0561\u056C \u0562\u0561\u0576\u0561\u056C\u056B ${withDefiniteArticle(issue2.origin)}-\u0578\u0582\u0574`;
      }
      case "invalid_union": {
        return "\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574";
      }
      case "invalid_element": {
        return `\u054D\u056D\u0561\u056C \u0561\u0580\u056A\u0565\u0584 ${withDefiniteArticle(issue2.origin)}-\u0578\u0582\u0574`;
      }
      default: {
        return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574`;
      }
    }
  };
}, "error");
function hy_default() {
  return {
    localeError: error20(),
  };
}
__name(hy_default, "default");

// node_modules/zod/v4/locales/id.js
var error21 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "item", verb: "memiliki" },
    file: { unit: "byte", verb: "memiliki" },
    set: { unit: "item", verb: "memiliki" },
    string: { unit: "karakter", verb: "memiliki" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "string dengan enkode base64",
    base64url: "string dengan enkode base64url",
    cidrv4: "rentang alamat IPv4",
    cidrv6: "rentang alamat IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "tanggal format ISO",
    datetime: "tanggal dan waktu format ISO",
    duration: "durasi format ISO",
    e164: "angka E.164",
    email: "alamat email",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    json_string: "string JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "jam format ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input tidak valid: diharapkan instanceof ${issue2.expected}, diterima ${received}`;
        }
        return `Input tidak valid: diharapkan ${expected}, diterima ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Input tidak valid: diharapkan ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Pilihan tidak valid: diharapkan salah satu dari ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} memiliki ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
        }
        return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} menjadi ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu kecil: diharapkan ${issue2.origin} memiliki ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Terlalu kecil: diharapkan ${issue2.origin} menjadi ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `String tidak valid: harus dimulai dengan "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `String tidak valid: harus berakhir dengan "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `String tidak valid: harus menyertakan "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `String tidak valid: harus sesuai pola ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} tidak valid`;
      }
      case "not_multiple_of": {
        return `Angka tidak valid: harus kelipatan dari ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Kunci tidak dikenali ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Kunci tidak valid di ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Input tidak valid";
      }
      case "invalid_element": {
        return `Nilai tidak valid di ${issue2.origin}`;
      }
      default: {
        return `Input tidak valid`;
      }
    }
  };
}, "error");
function id_default() {
  return {
    localeError: error21(),
  };
}
__name(id_default, "default");

// node_modules/zod/v4/locales/is.js
var error22 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "hluti", verb: "a\xF0 hafa" },
    file: { unit: "b\xE6ti", verb: "a\xF0 hafa" },
    set: { unit: "hluti", verb: "a\xF0 hafa" },
    string: { unit: "stafi", verb: "a\xF0 hafa" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-encoded strengur",
    base64url: "base64url-encoded strengur",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO dagsetning",
    datetime: "ISO dagsetning og t\xEDmi",
    duration: "ISO t\xEDmalengd",
    e164: "E.164 t\xF6lugildi",
    email: "netfang",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    json_string: "JSON strengur",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "gildi",
    template_literal: "gildi",
    time: "ISO t\xEDmi",
    ulid: "ULID",
    url: "vefsl\xF3\xF0",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "fylki",
    nan: "NaN",
    number: "n\xFAmer",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera instanceof ${issue2.expected}`;
        }
        return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera ${expected}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Rangt gildi: gert r\xE1\xF0 fyrir ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\xD3gilt val: m\xE1 vera eitt af eftirfarandi ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin ?? "gildi"} hafi ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "hluti"}`;
        }
        return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin ?? "gildi"} s\xE9 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin} hafi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin} s\xE9 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\xD3gildur strengur: ver\xF0ur a\xF0 byrja \xE1 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\xD3gildur strengur: ver\xF0ur a\xF0 enda \xE1 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\xD3gildur strengur: ver\xF0ur a\xF0 innihalda "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\xD3gildur strengur: ver\xF0ur a\xF0 fylgja mynstri ${_issue.pattern}`;
        }
        return `Rangt ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `R\xF6ng tala: ver\xF0ur a\xF0 vera margfeldi af ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\xD3\xFEekkt ${issue2.keys.length > 1 ? "ir lyklar" : "ur lykill"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Rangur lykill \xED ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Rangt gildi";
      }
      case "invalid_element": {
        return `Rangt gildi \xED ${issue2.origin}`;
      }
      default: {
        return `Rangt gildi`;
      }
    }
  };
}, "error");
function is_default() {
  return {
    localeError: error22(),
  };
}
__name(is_default, "default");

// node_modules/zod/v4/locales/it.js
var error23 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementi", verb: "avere" },
    file: { unit: "byte", verb: "avere" },
    set: { unit: "elementi", verb: "avere" },
    string: { unit: "caratteri", verb: "avere" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "stringa codificata in base64",
    base64url: "URL codificata in base64",
    cidrv4: "intervallo IPv4",
    cidrv6: "intervallo IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "data ISO",
    datetime: "data e ora ISO",
    duration: "durata ISO",
    e164: "numero E.164",
    email: "indirizzo email",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "indirizzo IPv4",
    ipv6: "indirizzo IPv6",
    json_string: "stringa JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "ora ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "vettore",
    nan: "NaN",
    number: "numero",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input non valido: atteso instanceof ${issue2.expected}, ricevuto ${received}`;
        }
        return `Input non valido: atteso ${expected}, ricevuto ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Input non valido: atteso ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Opzione non valida: atteso uno tra ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Troppo grande: ${issue2.origin ?? "valore"} deve avere ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementi"}`;
        }
        return `Troppo grande: ${issue2.origin ?? "valore"} deve essere ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Troppo piccolo: ${issue2.origin} deve avere ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Troppo piccolo: ${issue2.origin} deve essere ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Stringa non valida: deve iniziare con "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Stringa non valida: deve terminare con "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Stringa non valida: deve includere "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Stringa non valida: deve corrispondere al pattern ${_issue.pattern}`;
        }
        return `Input non valido: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Numero non valido: deve essere un multiplo di ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Chiav${issue2.keys.length > 1 ? "i" : "e"} non riconosciut${issue2.keys.length > 1 ? "e" : "a"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Chiave non valida in ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Input non valido";
      }
      case "invalid_element": {
        return `Valore non valido in ${issue2.origin}`;
      }
      default: {
        return `Input non valido`;
      }
    }
  };
}, "error");
function it_default() {
  return {
    localeError: error23(),
  };
}
__name(it_default, "default");

// node_modules/zod/v4/locales/ja.js
var error24 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
    file: { unit: "\u30D0\u30A4\u30C8", verb: "\u3067\u3042\u308B" },
    set: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
    string: { unit: "\u6587\u5B57", verb: "\u3067\u3042\u308B" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
    base64url: "base64url\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
    cidrv4: "IPv4\u7BC4\u56F2",
    cidrv6: "IPv6\u7BC4\u56F2",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO\u65E5\u4ED8",
    datetime: "ISO\u65E5\u6642",
    duration: "ISO\u671F\u9593",
    e164: "E.164\u756A\u53F7",
    email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
    emoji: "\u7D75\u6587\u5B57",
    guid: "GUID",
    ipv4: "IPv4\u30A2\u30C9\u30EC\u30B9",
    ipv6: "IPv6\u30A2\u30C9\u30EC\u30B9",
    json_string: "JSON\u6587\u5B57\u5217",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u5165\u529B\u5024",
    template_literal: "\u5165\u529B\u5024",
    time: "ISO\u6642\u523B",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u914D\u5217",
    nan: "NaN",
    number: "\u6570\u5024",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u7121\u52B9\u306A\u5165\u529B: instanceof ${issue2.expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
        }
        return `\u7121\u52B9\u306A\u5165\u529B: ${expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u7121\u52B9\u306A\u5165\u529B: ${stringifyPrimitive(issue2.values[0])}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F`;
        }
        return `\u7121\u52B9\u306A\u9078\u629E: ${joinValues(issue2.values, "\u3001")}\u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "too_big": {
        const adj = issue2.inclusive
          ? "\u4EE5\u4E0B\u3067\u3042\u308B"
          : "\u3088\u308A\u5C0F\u3055\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${sizing.unit ?? "\u8981\u7D20"}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        }
        return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "too_small": {
        const adj = issue2.inclusive
          ? "\u4EE5\u4E0A\u3067\u3042\u308B"
          : "\u3088\u308A\u5927\u304D\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${sizing.unit}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        }
        return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.prefix}"\u3067\u59CB\u307E\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        }
        if (_issue.format === "ends_with") {
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.suffix}"\u3067\u7D42\u308F\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        }
        if (_issue.format === "includes") {
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.includes}"\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        }
        if (_issue.format === "regex") {
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: \u30D1\u30BF\u30FC\u30F3${_issue.pattern}\u306B\u4E00\u81F4\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        }
        return `\u7121\u52B9\u306A${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u7121\u52B9\u306A\u6570\u5024: ${issue2.divisor}\u306E\u500D\u6570\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "unrecognized_keys": {
        return `\u8A8D\u8B58\u3055\u308C\u3066\u3044\u306A\u3044\u30AD\u30FC${issue2.keys.length > 1 ? "\u7FA4" : ""}: ${joinValues(issue2.keys, "\u3001")}`;
      }
      case "invalid_key": {
        return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u30AD\u30FC`;
      }
      case "invalid_union": {
        return "\u7121\u52B9\u306A\u5165\u529B";
      }
      case "invalid_element": {
        return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u5024`;
      }
      default: {
        return `\u7121\u52B9\u306A\u5165\u529B`;
      }
    }
  };
}, "error");
function ja_default() {
  return {
    localeError: error24(),
  };
}
__name(ja_default, "default");

// node_modules/zod/v4/locales/ka.js
var error25 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8",
      verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1",
    },
    file: {
      unit: "\u10D1\u10D0\u10D8\u10E2\u10D8",
      verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1",
    },
    set: {
      unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8",
      verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1",
    },
    string: {
      unit: "\u10E1\u10D8\u10DB\u10D1\u10DD\u10DA\u10DD",
      verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "base64-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
    base64url:
      "base64url-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
    cidrv4: "IPv4 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
    cidrv6: "IPv6 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8",
    datetime: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8-\u10D3\u10E0\u10DD",
    duration:
      "\u10EE\u10D0\u10DC\u10D2\u10E0\u10EB\u10DA\u10D8\u10D5\u10DD\u10D1\u10D0",
    e164: "E.164 \u10DC\u10DD\u10DB\u10D4\u10E0\u10D8",
    email:
      "\u10D4\u10DA-\u10E4\u10DD\u10E1\u10E2\u10D8\u10E1 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    emoji: "\u10D4\u10DB\u10DD\u10EF\u10D8",
    guid: "GUID",
    ipv4: "IPv4 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    ipv6: "IPv6 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    json_string: "JSON \u10D5\u10D4\u10DA\u10D8",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0",
    template_literal: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0",
    time: "\u10D3\u10E0\u10DD",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u10DB\u10D0\u10E1\u10D8\u10D5\u10D8",
    boolean: "\u10D1\u10E3\u10DA\u10D4\u10D0\u10DC\u10D8",
    function: "\u10E4\u10E3\u10DC\u10E5\u10EA\u10D8\u10D0",
    nan: "NaN",
    number: "\u10E0\u10D8\u10EA\u10EE\u10D5\u10D8",
    string: "\u10D5\u10D4\u10DA\u10D8",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 instanceof ${issue2.expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
        }
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D0\u10E0\u10D8\u10D0\u10DC\u10E2\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8\u10D0 \u10D4\u10E0\u10D7-\u10D4\u10E0\u10D7\u10D8 ${joinValues(issue2.values, "|")}-\u10D3\u10D0\u10DC`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        }
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10EC\u10E7\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.prefix}"-\u10D8\u10D7`;
        }
        if (_issue.format === "ends_with") {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10DB\u10D7\u10D0\u10D5\u10E0\u10D3\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.suffix}"-\u10D8\u10D7`;
        }
        if (_issue.format === "includes") {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1 "${_issue.includes}"-\u10E1`;
        }
        if (_issue.format === "regex") {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D4\u10E1\u10D0\u10D1\u10D0\u10DB\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 \u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10E1 ${_issue.pattern}`;
        }
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E0\u10D8\u10EA\u10EE\u10D5\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10E7\u10DD\u10E1 ${issue2.divisor}-\u10D8\u10E1 \u10EF\u10D4\u10E0\u10D0\u10D3\u10D8`;
      }
      case "unrecognized_keys": {
        return `\u10E3\u10EA\u10DC\u10DD\u10D1\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1${issue2.keys.length > 1 ? "\u10D4\u10D1\u10D8" : "\u10D8"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1\u10D8 ${issue2.origin}-\u10E8\u10D8`;
      }
      case "invalid_union": {
        return "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0";
      }
      case "invalid_element": {
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0 ${issue2.origin}-\u10E8\u10D8`;
      }
      default: {
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0`;
      }
    }
  };
}, "error");
function ka_default() {
  return {
    localeError: error25(),
  };
}
__name(ka_default, "default");

// node_modules/zod/v4/locales/km.js
var error26 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u1792\u17B6\u178F\u17BB",
      verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793",
    },
    file: {
      unit: "\u1794\u17C3",
      verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793",
    },
    set: {
      unit: "\u1792\u17B6\u178F\u17BB",
      verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793",
    },
    string: {
      unit: "\u178F\u17BD\u17A2\u1780\u17D2\u179F\u179A",
      verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64",
    base64url:
      "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64url",
    cidrv4:
      "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
    cidrv6:
      "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 ISO",
    datetime:
      "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 \u1793\u17B7\u1784\u1798\u17C9\u17C4\u1784 ISO",
    duration: "\u179A\u1799\u17C8\u1796\u17C1\u179B ISO",
    e164: "\u179B\u17C1\u1781 E.164",
    email:
      "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793\u17A2\u17CA\u17B8\u1798\u17C2\u179B",
    emoji:
      "\u179F\u1789\u17D2\u1789\u17B6\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD",
    guid: "GUID",
    ipv4: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
    ipv6: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
    json_string: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex:
      "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B",
    template_literal:
      "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B",
    time: "\u1798\u17C9\u17C4\u1784 ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u17A2\u17B6\u179A\u17C1 (Array)",
    nan: "NaN",
    null: "\u1782\u17D2\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3 (null)",
    number: "\u179B\u17C1\u1781",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A instanceof ${issue2.expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
        }
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u1787\u1798\u17D2\u179A\u17BE\u179F\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1787\u17B6\u1798\u17BD\u1799\u1780\u17D2\u1793\u17BB\u1784\u1785\u17C6\u178E\u17C4\u1798 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u1792\u17B6\u178F\u17BB"}`;
        }
        return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C4\u1799 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1794\u1789\u17D2\u1785\u1794\u17CB\u178A\u17C4\u1799 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1798\u17B6\u1793 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1795\u17D2\u1782\u17BC\u1795\u17D2\u1782\u1784\u1793\u17B9\u1784\u1791\u1798\u17D2\u179A\u1784\u17CB\u178A\u17C2\u179B\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB ${_issue.pattern}`;
        }
        return `\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u179B\u17C1\u1781\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1787\u17B6\u1796\u17A0\u17BB\u1782\u17BB\u178E\u1793\u17C3 ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u179A\u1780\u1783\u17BE\u1789\u179F\u17C4\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB\u17D6 ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u179F\u17C4\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
      }
      case "invalid_union": {
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
      }
      case "invalid_element": {
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
      }
      default: {
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
      }
    }
  };
}, "error");
function km_default() {
  return {
    localeError: error26(),
  };
}
__name(km_default, "default");

// node_modules/zod/v4/locales/kh.js
function kh_default() {
  return km_default();
}
__name(kh_default, "default");

// node_modules/zod/v4/locales/ko.js
var error27 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\uAC1C", verb: "to have" },
    file: { unit: "\uBC14\uC774\uD2B8", verb: "to have" },
    set: { unit: "\uAC1C", verb: "to have" },
    string: { unit: "\uBB38\uC790", verb: "to have" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
    base64url: "base64url \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
    cidrv4: "IPv4 \uBC94\uC704",
    cidrv6: "IPv6 \uBC94\uC704",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \uB0A0\uC9DC",
    datetime: "ISO \uB0A0\uC9DC\uC2DC\uAC04",
    duration: "ISO \uAE30\uAC04",
    e164: "E.164 \uBC88\uD638",
    email: "\uC774\uBA54\uC77C \uC8FC\uC18C",
    emoji: "\uC774\uBAA8\uC9C0",
    guid: "GUID",
    ipv4: "IPv4 \uC8FC\uC18C",
    ipv6: "IPv6 \uC8FC\uC18C",
    json_string: "JSON \uBB38\uC790\uC5F4",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\uC785\uB825",
    template_literal: "\uC785\uB825",
    time: "ISO \uC2DC\uAC04",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 instanceof ${issue2.expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
        }
        return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 ${expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\uC798\uBABB\uB41C \uC785\uB825: \uAC12\uC740 ${stringifyPrimitive(issue2.values[0])} \uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4`;
        }
        return `\uC798\uBABB\uB41C \uC635\uC158: ${joinValues(issue2.values, "\uB610\uB294 ")} \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "\uC774\uD558" : "\uBBF8\uB9CC";
        const suffix =
          adj === "\uBBF8\uB9CC"
            ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4"
            : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\uC694\uC18C";
        if (sizing) {
          return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()}${unit} ${adj}${suffix}`;
        }
        return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()} ${adj}${suffix}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\uC774\uC0C1" : "\uCD08\uACFC";
        const suffix =
          adj === "\uC774\uC0C1"
            ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4"
            : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\uC694\uC18C";
        if (sizing) {
          return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()}${unit} ${adj}${suffix}`;
        }
        return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()} ${adj}${suffix}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.prefix}"(\uC73C)\uB85C \uC2DC\uC791\uD574\uC57C \uD569\uB2C8\uB2E4`;
        }
        if (_issue.format === "ends_with") {
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.suffix}"(\uC73C)\uB85C \uB05D\uB098\uC57C \uD569\uB2C8\uB2E4`;
        }
        if (_issue.format === "includes") {
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.includes}"\uC744(\uB97C) \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4`;
        }
        if (_issue.format === "regex") {
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: \uC815\uADDC\uC2DD ${_issue.pattern} \uD328\uD134\uACFC \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4`;
        }
        return `\uC798\uBABB\uB41C ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\uC798\uBABB\uB41C \uC22B\uC790: ${issue2.divisor}\uC758 \uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      }
      case "unrecognized_keys": {
        return `\uC778\uC2DD\uD560 \uC218 \uC5C6\uB294 \uD0A4: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\uC798\uBABB\uB41C \uD0A4: ${issue2.origin}`;
      }
      case "invalid_union": {
        return `\uC798\uBABB\uB41C \uC785\uB825`;
      }
      case "invalid_element": {
        return `\uC798\uBABB\uB41C \uAC12: ${issue2.origin}`;
      }
      default: {
        return `\uC798\uBABB\uB41C \uC785\uB825`;
      }
    }
  };
}, "error");
function ko_default() {
  return {
    localeError: error27(),
  };
}
__name(ko_default, "default");

// node_modules/zod/v4/locales/lt.js
var capitalizeFirstCharacter = /* @__PURE__ */ __name(
  (text) => text.charAt(0).toUpperCase() + text.slice(1),
  "capitalizeFirstCharacter"
);
function getUnitTypeFromNumber(number4) {
  const abs = Math.abs(number4);
  const last = abs % 10;
  const last2 = abs % 100;
  if ((last2 >= 11 && last2 <= 19) || last === 0) {
    return "many";
  }
  if (last === 1) {
    return "one";
  }
  return "few";
}
__name(getUnitTypeFromNumber, "getUnitTypeFromNumber");
var error28 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: {
        few: "elementus",
        many: "element\u0173",
        one: "element\u0105",
      },
      verb: {
        bigger: {
          inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
          notInclusive: "turi tur\u0117ti daugiau kaip",
        },
        smaller: {
          inclusive: "turi tur\u0117ti ne daugiau kaip",
          notInclusive: "turi tur\u0117ti ma\u017Eiau kaip",
        },
      },
    },
    file: {
      unit: {
        few: "baitai",
        many: "bait\u0173",
        one: "baitas",
      },
      verb: {
        bigger: {
          inclusive: "turi b\u016Bti ne ma\u017Eesnis kaip",
          notInclusive: "turi b\u016Bti didesnis kaip",
        },
        smaller: {
          inclusive: "turi b\u016Bti ne didesnis kaip",
          notInclusive: "turi b\u016Bti ma\u017Eesnis kaip",
        },
      },
    },
    set: {
      unit: {
        few: "elementus",
        many: "element\u0173",
        one: "element\u0105",
      },
      verb: {
        bigger: {
          inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
          notInclusive: "turi tur\u0117ti daugiau kaip",
        },
        smaller: {
          inclusive: "turi tur\u0117ti ne daugiau kaip",
          notInclusive: "turi tur\u0117ti ma\u017Eiau kaip",
        },
      },
    },
    string: {
      unit: {
        few: "simboliai",
        many: "simboli\u0173",
        one: "simbolis",
      },
      verb: {
        bigger: {
          inclusive: "turi b\u016Bti ne trumpesn\u0117 kaip",
          notInclusive: "turi b\u016Bti ilgesn\u0117 kaip",
        },
        smaller: {
          inclusive: "turi b\u016Bti ne ilgesn\u0117 kaip",
          notInclusive: "turi b\u016Bti trumpesn\u0117 kaip",
        },
      },
    },
  };
  function getSizing(origin, unitType, inclusive, targetShouldBe) {
    const result = Sizable[origin] ?? null;
    if (result === null) {
      return result;
    }
    return {
      unit: result.unit[unitType],
      verb: result.verb[targetShouldBe][
        inclusive ? "inclusive" : "notInclusive"
      ],
    };
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 u\u017Ekoduota eilut\u0117",
    base64url: "base64url u\u017Ekoduota eilut\u0117",
    cidrv4: "IPv4 tinklo prefiksas (CIDR)",
    cidrv6: "IPv6 tinklo prefiksas (CIDR)",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO data",
    datetime: "ISO data ir laikas",
    duration: "ISO trukm\u0117",
    e164: "E.164 numeris",
    email: "el. pa\u0161to adresas",
    emoji: "jaustukas",
    guid: "GUID",
    ipv4: "IPv4 adresas",
    ipv6: "IPv6 adresas",
    json_string: "JSON eilut\u0117",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u012Fvestis",
    template_literal: "\u012Fvestis",
    time: "ISO laikas",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "masyvas",
    bigint: "sveikasis skai\u010Dius",
    boolean: "login\u0117 reik\u0161m\u0117",
    function: "funkcija",
    nan: "NaN",
    null: "nulin\u0117 reik\u0161m\u0117",
    number: "skai\u010Dius",
    object: "objektas",
    string: "eilut\u0117",
    symbol: "simbolis",
    undefined: "neapibr\u0117\u017Eta reik\u0161m\u0117",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Gautas tipas ${received}, o tik\u0117tasi - instanceof ${issue2.expected}`;
        }
        return `Gautas tipas ${received}, o tik\u0117tasi - ${expected}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Privalo b\u016Bti ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Privalo b\u016Bti vienas i\u0161 ${joinValues(issue2.values, "|")} pasirinkim\u0173`;
      }
      case "too_big": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        const sizing = getSizing(
          issue2.origin,
          getUnitTypeFromNumber(Number(issue2.maximum)),
          issue2.inclusive ?? false,
          "smaller"
        );
        if (sizing?.verb) {
          return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue2.maximum.toString()} ${sizing.unit ?? "element\u0173"}`;
        }
        const adj = issue2.inclusive
          ? "ne didesnis kaip"
          : "ma\u017Eesnis kaip";
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue2.maximum.toString()} ${sizing?.unit}`;
      }
      case "too_small": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        const sizing = getSizing(
          issue2.origin,
          getUnitTypeFromNumber(Number(issue2.minimum)),
          issue2.inclusive ?? false,
          "bigger"
        );
        if (sizing?.verb) {
          return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue2.minimum.toString()} ${sizing.unit ?? "element\u0173"}`;
        }
        const adj = issue2.inclusive
          ? "ne ma\u017Eesnis kaip"
          : "didesnis kaip";
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue2.minimum.toString()} ${sizing?.unit}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Eilut\u0117 privalo prasid\u0117ti "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Eilut\u0117 privalo pasibaigti "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Eilut\u0117 privalo \u012Ftraukti "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Eilut\u0117 privalo atitikti ${_issue.pattern}`;
        }
        return `Neteisingas ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Skai\u010Dius privalo b\u016Bti ${issue2.divisor} kartotinis.`;
      }
      case "unrecognized_keys": {
        return `Neatpa\u017Eint${issue2.keys.length > 1 ? "i" : "as"} rakt${issue2.keys.length > 1 ? "ai" : "as"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return "Rastas klaidingas raktas";
      }
      case "invalid_union": {
        return "Klaidinga \u012Fvestis";
      }
      case "invalid_element": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi klaiding\u0105 \u012Fvest\u012F`;
      }
      default: {
        return "Klaidinga \u012Fvestis";
      }
    }
  };
}, "error");
function lt_default() {
  return {
    localeError: error28(),
  };
}
__name(lt_default, "default");

// node_modules/zod/v4/locales/mk.js
var error29 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0441\u0442\u0430\u0432\u043A\u0438",
      verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442",
    },
    file: {
      unit: "\u0431\u0430\u0458\u0442\u0438",
      verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442",
    },
    set: {
      unit: "\u0441\u0442\u0430\u0432\u043A\u0438",
      verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442",
    },
    string: {
      unit: "\u0437\u043D\u0430\u0446\u0438",
      verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "base64-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
    base64url:
      "base64url-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
    cidrv4: "IPv4 \u043E\u043F\u0441\u0435\u0433",
    cidrv6: "IPv6 \u043E\u043F\u0441\u0435\u0433",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u0434\u0430\u0442\u0443\u043C",
    datetime:
      "ISO \u0434\u0430\u0442\u0443\u043C \u0438 \u0432\u0440\u0435\u043C\u0435",
    duration:
      "ISO \u0432\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435",
    e164: "E.164 \u0431\u0440\u043E\u0458",
    email:
      "\u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0430 \u0435-\u043F\u043E\u0448\u0442\u0430",
    emoji: "\u0435\u043C\u043E\u045F\u0438",
    guid: "GUID",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441\u0430",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441\u0430",
    json_string: "JSON \u043D\u0438\u0437\u0430",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0432\u043D\u0435\u0441",
    template_literal: "\u0432\u043D\u0435\u0441",
    time: "ISO \u0432\u0440\u0435\u043C\u0435",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u043D\u0438\u0437\u0430",
    nan: "NaN",
    number: "\u0431\u0440\u043E\u0458",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 instanceof ${issue2.expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
        }
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u0413\u0440\u0435\u0448\u0430\u043D\u0430 \u043E\u043F\u0446\u0438\u0458\u0430: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 \u0435\u0434\u043D\u0430 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438"}`;
        }
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u043D\u0443\u0432\u0430 \u0441\u043E "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u0432\u0440\u0448\u0443\u0432\u0430 \u0441\u043E "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u043E\u0434\u0433\u043E\u0430\u0440\u0430 \u043D\u0430 \u043F\u0430\u0442\u0435\u0440\u043D\u043E\u0442 ${_issue.pattern}`;
        }
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0431\u0440\u043E\u0458: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0431\u0438\u0434\u0435 \u0434\u0435\u043B\u0438\u0432 \u0441\u043E ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `${issue2.keys.length > 1 ? "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D\u0438 \u043A\u043B\u0443\u0447\u0435\u0432\u0438" : "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D \u043A\u043B\u0443\u0447"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043B\u0443\u0447 \u0432\u043E ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
      }
      case "invalid_element": {
        return `\u0413\u0440\u0435\u0448\u043D\u0430 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u043E ${issue2.origin}`;
      }
      default: {
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441`;
      }
    }
  };
}, "error");
function mk_default() {
  return {
    localeError: error29(),
  };
}
__name(mk_default, "default");

// node_modules/zod/v4/locales/ms.js
var error30 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elemen", verb: "mempunyai" },
    file: { unit: "bait", verb: "mempunyai" },
    set: { unit: "elemen", verb: "mempunyai" },
    string: { unit: "aksara", verb: "mempunyai" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "string dikodkan base64",
    base64url: "string dikodkan base64url",
    cidrv4: "julat IPv4",
    cidrv6: "julat IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "tarikh ISO",
    datetime: "tarikh masa ISO",
    duration: "tempoh ISO",
    e164: "nombor E.164",
    email: "alamat e-mel",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    json_string: "string JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "masa ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "nombor",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input tidak sah: dijangka instanceof ${issue2.expected}, diterima ${received}`;
        }
        return `Input tidak sah: dijangka ${expected}, diterima ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Input tidak sah: dijangka ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Pilihan tidak sah: dijangka salah satu daripada ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
        }
        return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} adalah ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu kecil: dijangka ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Terlalu kecil: dijangka ${issue2.origin} adalah ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `String tidak sah: mesti bermula dengan "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `String tidak sah: mesti berakhir dengan "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `String tidak sah: mesti mengandungi "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `String tidak sah: mesti sepadan dengan corak ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} tidak sah`;
      }
      case "not_multiple_of": {
        return `Nombor tidak sah: perlu gandaan ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Kunci tidak dikenali: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Kunci tidak sah dalam ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Input tidak sah";
      }
      case "invalid_element": {
        return `Nilai tidak sah dalam ${issue2.origin}`;
      }
      default: {
        return `Input tidak sah`;
      }
    }
  };
}, "error");
function ms_default() {
  return {
    localeError: error30(),
  };
}
__name(ms_default, "default");

// node_modules/zod/v4/locales/nl.js
var error31 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementen", verb: "heeft" },
    file: { unit: "bytes", verb: "heeft" },
    set: { unit: "elementen", verb: "heeft" },
    string: { unit: "tekens", verb: "heeft" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-gecodeerde tekst",
    base64url: "base64 URL-gecodeerde tekst",
    cidrv4: "IPv4-bereik",
    cidrv6: "IPv6-bereik",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO datum",
    datetime: "ISO datum en tijd",
    duration: "ISO duur",
    e164: "E.164-nummer",
    email: "emailadres",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4-adres",
    ipv6: "IPv6-adres",
    json_string: "JSON string",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "invoer",
    template_literal: "invoer",
    time: "ISO tijd",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "getal",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ongeldige invoer: verwacht instanceof ${issue2.expected}, ontving ${received}`;
        }
        return `Ongeldige invoer: verwacht ${expected}, ontving ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Ongeldige invoer: verwacht ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Ongeldige optie: verwacht \xE9\xE9n van ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const longName =
          issue2.origin === "date"
            ? "laat"
            : issue2.origin === "string"
              ? "lang"
              : "groot";
        if (sizing) {
          return `Te ${longName}: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementen"} ${sizing.verb}`;
        }
        return `Te ${longName}: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} is`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const shortName =
          issue2.origin === "date"
            ? "vroeg"
            : issue2.origin === "string"
              ? "kort"
              : "klein";
        if (sizing) {
          return `Te ${shortName}: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Te ${shortName}: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} is`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ongeldige tekst: moet met "${_issue.prefix}" beginnen`;
        }
        if (_issue.format === "ends_with") {
          return `Ongeldige tekst: moet op "${_issue.suffix}" eindigen`;
        }
        if (_issue.format === "includes") {
          return `Ongeldige tekst: moet "${_issue.includes}" bevatten`;
        }
        if (_issue.format === "regex") {
          return `Ongeldige tekst: moet overeenkomen met patroon ${_issue.pattern}`;
        }
        return `Ongeldig: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Ongeldig getal: moet een veelvoud van ${issue2.divisor} zijn`;
      }
      case "unrecognized_keys": {
        return `Onbekende key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Ongeldige key in ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Ongeldige invoer";
      }
      case "invalid_element": {
        return `Ongeldige waarde in ${issue2.origin}`;
      }
      default: {
        return `Ongeldige invoer`;
      }
    }
  };
}, "error");
function nl_default() {
  return {
    localeError: error31(),
  };
}
__name(nl_default, "default");

// node_modules/zod/v4/locales/no.js
var error32 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementer", verb: "\xE5 inneholde" },
    file: { unit: "bytes", verb: "\xE5 ha" },
    set: { unit: "elementer", verb: "\xE5 inneholde" },
    string: { unit: "tegn", verb: "\xE5 ha" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-enkodet streng",
    base64url: "base64url-enkodet streng",
    cidrv4: "IPv4-spekter",
    cidrv6: "IPv6-spekter",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO-dato",
    datetime: "ISO dato- og klokkeslett",
    duration: "ISO-varighet",
    e164: "E.164-nummer",
    email: "e-postadresse",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4-omr\xE5de",
    ipv6: "IPv6-omr\xE5de",
    json_string: "JSON-streng",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "input",
    template_literal: "input",
    time: "ISO-klokkeslett",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "liste",
    nan: "NaN",
    number: "tall",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldig input: forventet instanceof ${issue2.expected}, fikk ${received}`;
        }
        return `Ugyldig input: forventet ${expected}, fikk ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Ugyldig verdi: forventet ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Ugyldig valg: forventet en av ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
        }
        return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ugyldig streng: m\xE5 starte med "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Ugyldig streng: m\xE5 ende med "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Ugyldig streng: m\xE5 inneholde "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${_issue.pattern}`;
        }
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Ugyldig tall: m\xE5 v\xE6re et multiplum av ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `${issue2.keys.length > 1 ? "Ukjente n\xF8kler" : "Ukjent n\xF8kkel"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Ugyldig n\xF8kkel i ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Ugyldig input";
      }
      case "invalid_element": {
        return `Ugyldig verdi i ${issue2.origin}`;
      }
      default: {
        return `Ugyldig input`;
      }
    }
  };
}, "error");
function no_default() {
  return {
    localeError: error32(),
  };
}
__name(no_default, "default");

// node_modules/zod/v4/locales/ota.js
var error33 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
    file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
    set: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
    string: { unit: "harf", verb: "olmal\u0131d\u0131r" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-\u015Fifreli metin",
    base64url: "base64url-\u015Fifreli metin",
    cidrv4: "IPv4 menzili",
    cidrv6: "IPv6 menzili",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO tarihi",
    datetime: "ISO heng\xE2m\u0131",
    duration: "ISO m\xFCddeti",
    e164: "E.164 say\u0131s\u0131",
    email: "epostag\xE2h",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 ni\u015F\xE2n\u0131",
    ipv6: "IPv6 ni\u015F\xE2n\u0131",
    json_string: "JSON metin",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "giren",
    template_literal: "giren",
    time: "ISO zaman\u0131",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "saf",
    nan: "NaN",
    null: "gayb",
    number: "numara",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `F\xE2sit giren: umulan instanceof ${issue2.expected}, al\u0131nan ${received}`;
        }
        return `F\xE2sit giren: umulan ${expected}, al\u0131nan ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `F\xE2sit giren: umulan ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `F\xE2sit tercih: m\xFBteberler ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"} sahip olmal\u0131yd\u0131.`;
        }
        return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} olmal\u0131yd\u0131.`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} ${sizing.unit} sahip olmal\u0131yd\u0131.`;
        }
        return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} olmal\u0131yd\u0131.`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `F\xE2sit metin: "${_issue.prefix}" ile ba\u015Flamal\u0131.`;
        }
        if (_issue.format === "ends_with") {
          return `F\xE2sit metin: "${_issue.suffix}" ile bitmeli.`;
        }
        if (_issue.format === "includes") {
          return `F\xE2sit metin: "${_issue.includes}" ihtiv\xE2 etmeli.`;
        }
        if (_issue.format === "regex") {
          return `F\xE2sit metin: ${_issue.pattern} nak\u015F\u0131na uymal\u0131.`;
        }
        return `F\xE2sit ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `F\xE2sit say\u0131: ${issue2.divisor} kat\u0131 olmal\u0131yd\u0131.`;
      }
      case "unrecognized_keys": {
        return `Tan\u0131nmayan anahtar ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} i\xE7in tan\u0131nmayan anahtar var.`;
      }
      case "invalid_union": {
        return "Giren tan\u0131namad\u0131.";
      }
      case "invalid_element": {
        return `${issue2.origin} i\xE7in tan\u0131nmayan k\u0131ymet var.`;
      }
      default: {
        return `K\u0131ymet tan\u0131namad\u0131.`;
      }
    }
  };
}, "error");
function ota_default() {
  return {
    localeError: error33(),
  };
}
__name(ota_default, "default");

// node_modules/zod/v4/locales/ps.js
var error34 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u062A\u0648\u06A9\u064A",
      verb: "\u0648\u0644\u0631\u064A",
    },
    file: {
      unit: "\u0628\u0627\u06CC\u067C\u0633",
      verb: "\u0648\u0644\u0631\u064A",
    },
    set: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
    string: {
      unit: "\u062A\u0648\u06A9\u064A",
      verb: "\u0648\u0644\u0631\u064A",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-encoded \u0645\u062A\u0646",
    base64url: "base64url-encoded \u0645\u062A\u0646",
    cidrv4: "\u062F IPv4 \u0633\u0627\u062D\u0647",
    cidrv6: "\u062F IPv6 \u0633\u0627\u062D\u0647",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u0646\u06D0\u067C\u0647",
    datetime: "\u0646\u06CC\u067C\u0647 \u0627\u0648 \u0648\u062E\u062A",
    duration: "\u0645\u0648\u062F\u0647",
    e164: "\u062F E.164 \u0634\u0645\u06D0\u0631\u0647",
    email: "\u0628\u0631\u06CC\u069A\u0646\u0627\u0644\u06CC\u06A9",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u064A",
    guid: "GUID",
    ipv4: "\u062F IPv4 \u067E\u062A\u0647",
    ipv6: "\u062F IPv6 \u067E\u062A\u0647",
    json_string: "JSON \u0645\u062A\u0646",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0648\u0631\u0648\u062F\u064A",
    template_literal: "\u0648\u0631\u0648\u062F\u064A",
    time: "\u0648\u062E\u062A",
    ulid: "ULID",
    url: "\u06CC\u0648 \u0622\u0631 \u0627\u0644",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u0627\u0631\u06D0",
    nan: "NaN",
    number: "\u0639\u062F\u062F",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F instanceof ${issue2.expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
        }
        return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${stringifyPrimitive(issue2.values[0])} \u0648\u0627\u06CC`;
        }
        return `\u0646\u0627\u0633\u0645 \u0627\u0646\u062A\u062E\u0627\u0628: \u0628\u0627\u06CC\u062F \u06CC\u0648 \u0644\u0647 ${joinValues(issue2.values, "|")} \u0685\u062E\u0647 \u0648\u0627\u06CC`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631\u0648\u0646\u0647"} \u0648\u0644\u0631\u064A`;
        }
        return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0648\u064A`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0648\u0644\u0631\u064A`;
        }
        return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0648\u064A`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.prefix}" \u0633\u0631\u0647 \u067E\u06CC\u0644 \u0634\u064A`;
        }
        if (_issue.format === "ends_with") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.suffix}" \u0633\u0631\u0647 \u067E\u0627\u06CC \u062A\u0647 \u0648\u0631\u0633\u064A\u0696\u064A`;
        }
        if (_issue.format === "includes") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F "${_issue.includes}" \u0648\u0644\u0631\u064A`;
        }
        if (_issue.format === "regex") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F ${_issue.pattern} \u0633\u0631\u0647 \u0645\u0637\u0627\u0628\u0642\u062A \u0648\u0644\u0631\u064A`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u0633\u0645 \u062F\u06CC`;
      }
      case "not_multiple_of": {
        return `\u0646\u0627\u0633\u0645 \u0639\u062F\u062F: \u0628\u0627\u06CC\u062F \u062F ${issue2.divisor} \u0645\u0636\u0631\u0628 \u0648\u064A`;
      }
      case "unrecognized_keys": {
        return `\u0646\u0627\u0633\u0645 ${issue2.keys.length > 1 ? "\u06A9\u0644\u06CC\u0689\u0648\u0646\u0647" : "\u06A9\u0644\u06CC\u0689"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u0646\u0627\u0633\u0645 \u06A9\u0644\u06CC\u0689 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
      }
      case "invalid_union": {
        return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
      }
      case "invalid_element": {
        return `\u0646\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
      }
      default: {
        return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
      }
    }
  };
}, "error");
function ps_default() {
  return {
    localeError: error34(),
  };
}
__name(ps_default, "default");

// node_modules/zod/v4/locales/pl.js
var error35 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "element\xF3w", verb: "mie\u0107" },
    file: { unit: "bajt\xF3w", verb: "mie\u0107" },
    set: { unit: "element\xF3w", verb: "mie\u0107" },
    string: { unit: "znak\xF3w", verb: "mie\u0107" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "ci\u0105g znak\xF3w zakodowany w formacie base64",
    base64url: "ci\u0105g znak\xF3w zakodowany w formacie base64url",
    cidrv4: "zakres IPv4",
    cidrv6: "zakres IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "data w formacie ISO",
    datetime: "data i godzina w formacie ISO",
    duration: "czas trwania ISO",
    e164: "liczba E.164",
    email: "adres email",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "adres IPv4",
    ipv6: "adres IPv6",
    json_string: "ci\u0105g znak\xF3w w formacie JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "wyra\u017Cenie",
    template_literal: "wej\u015Bcie",
    time: "godzina w formacie ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "tablica",
    nan: "NaN",
    number: "liczba",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano instanceof ${issue2.expected}, otrzymano ${received}`;
        }
        return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${expected}, otrzymano ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Nieprawid\u0142owa opcja: oczekiwano jednej z warto\u015Bci ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Za du\u017Ca warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element\xF3w"}`;
        }
        return `Zbyt du\u017C(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Za ma\u0142a warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "element\xF3w"}`;
        }
        return `Zbyt ma\u0142(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zaczyna\u0107 si\u0119 od "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi ko\u0144czy\u0107 si\u0119 na "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zawiera\u0107 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi odpowiada\u0107 wzorcowi ${_issue.pattern}`;
        }
        return `Nieprawid\u0142ow(y/a/e) ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Nieprawid\u0142owa liczba: musi by\u0107 wielokrotno\u015Bci\u0105 ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Nierozpoznane klucze${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Nieprawid\u0142owy klucz w ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Nieprawid\u0142owe dane wej\u015Bciowe";
      }
      case "invalid_element": {
        return `Nieprawid\u0142owa warto\u015B\u0107 w ${issue2.origin}`;
      }
      default: {
        return `Nieprawid\u0142owe dane wej\u015Bciowe`;
      }
    }
  };
}, "error");
function pl_default() {
  return {
    localeError: error35(),
  };
}
__name(pl_default, "default");

// node_modules/zod/v4/locales/pt.js
var error36 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "itens", verb: "ter" },
    file: { unit: "bytes", verb: "ter" },
    set: { unit: "itens", verb: "ter" },
    string: { unit: "caracteres", verb: "ter" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "texto codificado em base64",
    base64url: "URL codificada em base64",
    cidrv4: "faixa de IPv4",
    cidrv6: "faixa de IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "data ISO",
    datetime: "data e hora ISO",
    duration: "dura\xE7\xE3o ISO",
    e164: "n\xFAmero E.164",
    email: "endere\xE7o de e-mail",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "endere\xE7o IPv4",
    ipv6: "endere\xE7o IPv6",
    json_string: "texto JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "padr\xE3o",
    template_literal: "entrada",
    time: "hora ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
    null: "nulo",
    number: "n\xFAmero",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Tipo inv\xE1lido: esperado instanceof ${issue2.expected}, recebido ${received}`;
        }
        return `Tipo inv\xE1lido: esperado ${expected}, recebido ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Entrada inv\xE1lida: esperado ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Op\xE7\xE3o inv\xE1lida: esperada uma das ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Muito grande: esperado que ${issue2.origin ?? "valor"} tivesse ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        }
        return `Muito grande: esperado que ${issue2.origin ?? "valor"} fosse ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Muito pequeno: esperado que ${issue2.origin} tivesse ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Muito pequeno: esperado que ${issue2.origin} fosse ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Texto inv\xE1lido: deve come\xE7ar com "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Texto inv\xE1lido: deve terminar com "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Texto inv\xE1lido: deve incluir "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} inv\xE1lido`;
      }
      case "not_multiple_of": {
        return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Chave${issue2.keys.length > 1 ? "s" : ""} desconhecida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Chave inv\xE1lida em ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Entrada inv\xE1lida";
      }
      case "invalid_element": {
        return `Valor inv\xE1lido em ${issue2.origin}`;
      }
      default: {
        return `Campo inv\xE1lido`;
      }
    }
  };
}, "error");
function pt_default() {
  return {
    localeError: error36(),
  };
}
__name(pt_default, "default");

// node_modules/zod/v4/locales/ro.js
var error37 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elemente", verb: "s\u0103 aib\u0103" },
    file: { unit: "octe\u021Bi", verb: "s\u0103 aib\u0103" },
    map: { unit: "intr\u0103ri", verb: "s\u0103 aib\u0103" },
    set: { unit: "elemente", verb: "s\u0103 aib\u0103" },
    string: { unit: "caractere", verb: "s\u0103 aib\u0103" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "\u0219ir codat base64",
    base64url: "\u0219ir codat base64url",
    cidrv4: "interval IPv4",
    cidrv6: "interval IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "dat\u0103 ISO",
    datetime: "dat\u0103 \u0219i or\u0103 ISO",
    duration: "durat\u0103 ISO",
    e164: "num\u0103r E.164",
    email: "adres\u0103 de email",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "adres\u0103 IPv4",
    ipv6: "adres\u0103 IPv6",
    json_string: "\u0219ir JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    mac: "adres\u0103 MAC",
    nanoid: "nanoid",
    regex: "intrare",
    template_literal: "intrare",
    time: "or\u0103 ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "matrice",
    bigint: "num\u0103r mare",
    boolean: "boolean",
    function: "func\u021Bie",
    map: "hart\u0103",
    nan: "NaN",
    never: "never",
    number: "num\u0103r",
    object: "obiect",
    set: "set",
    string: "\u0219ir",
    symbol: "simbol",
    undefined: "nedefinit",
    void: "void",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `Intrare invalid\u0103: a\u0219teptat ${expected}, primit ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Intrare invalid\u0103: a\u0219teptat ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Op\u021Biune invalid\u0103: a\u0219teptat una dintre ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Prea mare: a\u0219teptat ca ${issue2.origin ?? "valoarea"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemente"}`;
        }
        return `Prea mare: a\u0219teptat ca ${issue2.origin ?? "valoarea"} s\u0103 fie ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Prea mic: a\u0219teptat ca ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Prea mic: a\u0219teptat ca ${issue2.origin} s\u0103 fie ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0218ir invalid: trebuie s\u0103 \xEEnceap\u0103 cu "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u0218ir invalid: trebuie s\u0103 se termine cu "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u0218ir invalid: trebuie s\u0103 includ\u0103 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u0218ir invalid: trebuie s\u0103 se potriveasc\u0103 cu modelul ${_issue.pattern}`;
        }
        return `Format invalid: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Num\u0103r invalid: trebuie s\u0103 fie multiplu de ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Chei nerecunoscute: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Cheie invalid\u0103 \xEEn ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Intrare invalid\u0103";
      }
      case "invalid_element": {
        return `Valoare invalid\u0103 \xEEn ${issue2.origin}`;
      }
      default: {
        return `Intrare invalid\u0103`;
      }
    }
  };
}, "error");
function ro_default() {
  return {
    localeError: error37(),
  };
}
__name(ro_default, "default");

// node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
__name(getRussianPlural, "getRussianPlural");
var error38 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: {
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432",
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
      },
      verb: "\u0438\u043C\u0435\u0442\u044C",
    },
    file: {
      unit: {
        few: "\u0431\u0430\u0439\u0442\u0430",
        many: "\u0431\u0430\u0439\u0442",
        one: "\u0431\u0430\u0439\u0442",
      },
      verb: "\u0438\u043C\u0435\u0442\u044C",
    },
    set: {
      unit: {
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432",
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
      },
      verb: "\u0438\u043C\u0435\u0442\u044C",
    },
    string: {
      unit: {
        few: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430",
        many: "\u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432",
        one: "\u0441\u0438\u043C\u0432\u043E\u043B",
      },
      verb: "\u0438\u043C\u0435\u0442\u044C",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64",
    base64url:
      "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64url",
    cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u0434\u0430\u0442\u0430",
    datetime:
      "ISO \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F",
    duration:
      "ISO \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
    email: "email \u0430\u0434\u0440\u0435\u0441",
    emoji: "\u044D\u043C\u043E\u0434\u0437\u0438",
    guid: "GUID",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
    json_string: "JSON \u0441\u0442\u0440\u043E\u043A\u0430",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0432\u0432\u043E\u0434",
    template_literal: "\u0432\u0432\u043E\u0434",
    time: "ISO \u0432\u0440\u0435\u043C\u044F",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u043C\u0430\u0441\u0441\u0438\u0432",
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C instanceof ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
        }
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E \u0438\u0437 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getRussianPlural(
            maxValue,
            sizing.unit.one,
            sizing.unit.few,
            sizing.unit.many
          );
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getRussianPlural(
            minValue,
            sizing.unit.one,
            sizing.unit.few,
            sizing.unit.many
          );
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C\u0441\u044F \u0441 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        }
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E: \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D${issue2.keys.length > 1 ? "\u044B\u0435" : "\u044B\u0439"} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0438" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
      }
      case "invalid_element": {
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432 ${issue2.origin}`;
      }
      default: {
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435`;
      }
    }
  };
}, "error");
function ru_default() {
  return {
    localeError: error38(),
  };
}
__name(ru_default, "default");

// node_modules/zod/v4/locales/sl.js
var error39 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "elementov", verb: "imeti" },
    file: { unit: "bajtov", verb: "imeti" },
    set: { unit: "elementov", verb: "imeti" },
    string: { unit: "znakov", verb: "imeti" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 kodiran niz",
    base64url: "base64url kodiran niz",
    cidrv4: "obseg IPv4",
    cidrv6: "obseg IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO datum",
    datetime: "ISO datum in \u010Das",
    duration: "ISO trajanje",
    e164: "E.164 \u0161tevilka",
    email: "e-po\u0161tni naslov",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 naslov",
    ipv6: "IPv6 naslov",
    json_string: "JSON niz",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "vnos",
    template_literal: "vnos",
    time: "ISO \u010Das",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "tabela",
    nan: "NaN",
    number: "\u0161tevilo",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neveljaven vnos: pri\u010Dakovano instanceof ${issue2.expected}, prejeto ${received}`;
        }
        return `Neveljaven vnos: pri\u010Dakovano ${expected}, prejeto ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Neveljaven vnos: pri\u010Dakovano ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Neveljavna mo\u017Enost: pri\u010Dakovano eno izmed ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} imelo ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementov"}`;
        }
        return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} imelo ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Neveljaven niz: mora se za\u010Deti z "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Neveljaven niz: mora se kon\u010Dati z "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Neveljaven niz: mora vsebovati "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Neveljaven niz: mora ustrezati vzorcu ${_issue.pattern}`;
        }
        return `Neveljaven ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Neveljavno \u0161tevilo: mora biti ve\u010Dkratnik ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Neprepoznan${issue2.keys.length > 1 ? "i klju\u010Di" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Neveljaven klju\u010D v ${issue2.origin}`;
      }
      case "invalid_union": {
        return "Neveljaven vnos";
      }
      case "invalid_element": {
        return `Neveljavna vrednost v ${issue2.origin}`;
      }
      default: {
        return "Neveljaven vnos";
      }
    }
  };
}, "error");
function sl_default() {
  return {
    localeError: error39(),
  };
}
__name(sl_default, "default");

// node_modules/zod/v4/locales/sv.js
var error40 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "objekt", verb: "att inneh\xE5lla" },
    file: { unit: "bytes", verb: "att ha" },
    set: { unit: "objekt", verb: "att inneh\xE5lla" },
    string: { unit: "tecken", verb: "att ha" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-kodad str\xE4ng",
    base64url: "base64url-kodad str\xE4ng",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO-datum",
    datetime: "ISO-datum och tid",
    duration: "ISO-varaktighet",
    e164: "E.164-nummer",
    email: "e-postadress",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4-intervall",
    ipv6: "IPv6-intervall",
    json_string: "JSON-str\xE4ng",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "regulj\xE4rt uttryck",
    template_literal: "mall-literal",
    time: "ISO-tid",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "lista",
    nan: "NaN",
    number: "antal",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ogiltig inmatning: f\xF6rv\xE4ntat instanceof ${issue2.expected}, fick ${received}`;
        }
        return `Ogiltig inmatning: f\xF6rv\xE4ntat ${expected}, fick ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Ogiltig inmatning: f\xF6rv\xE4ntat ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Ogiltigt val: f\xF6rv\xE4ntade en av ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `F\xF6r stor(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        }
        return `F\xF6r stor(t): f\xF6rv\xE4ntat ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ogiltig str\xE4ng: m\xE5ste b\xF6rja med "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Ogiltig str\xE4ng: m\xE5ste sluta med "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Ogiltig str\xE4ng: m\xE5ste inneh\xE5lla "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Ogiltig str\xE4ng: m\xE5ste matcha m\xF6nstret "${_issue.pattern}"`;
        }
        return `Ogiltig(t) ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Ogiltigt tal: m\xE5ste vara en multipel av ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `${issue2.keys.length > 1 ? "Ok\xE4nda nycklar" : "Ok\xE4nd nyckel"}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Ogiltig nyckel i ${issue2.origin ?? "v\xE4rdet"}`;
      }
      case "invalid_union": {
        return "Ogiltig input";
      }
      case "invalid_element": {
        return `Ogiltigt v\xE4rde i ${issue2.origin ?? "v\xE4rdet"}`;
      }
      default: {
        return `Ogiltig input`;
      }
    }
  };
}, "error");
function sv_default() {
  return {
    localeError: error40(),
  };
}
__name(sv_default, "default");

// node_modules/zod/v4/locales/ta.js
var error41 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD",
      verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD",
    },
    file: {
      unit: "\u0BAA\u0BC8\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD",
      verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD",
    },
    set: {
      unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD",
      verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD",
    },
    string: {
      unit: "\u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BB3\u0BCD",
      verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
    base64url: "base64url-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
    cidrv4: "IPv4 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
    cidrv6: "IPv6 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u0BA4\u0BC7\u0BA4\u0BBF",
    datetime: "ISO \u0BA4\u0BC7\u0BA4\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
    duration: "ISO \u0B95\u0BBE\u0BB2 \u0B85\u0BB3\u0BB5\u0BC1",
    e164: "E.164 \u0B8E\u0BA3\u0BCD",
    email:
      "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    ipv6: "IPv6 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    json_string: "JSON \u0B9A\u0BB0\u0BAE\u0BCD",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1",
    template_literal: "input",
    time: "ISO \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u0B85\u0BA3\u0BBF",
    nan: "NaN",
    null: "\u0BB5\u0BC6\u0BB1\u0BC1\u0BAE\u0BC8",
    number: "\u0B8E\u0BA3\u0BCD",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 instanceof ${issue2.expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
        }
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${joinValues(issue2.values, "|")} \u0B87\u0BB2\u0BCD \u0B92\u0BA9\u0BCD\u0BB1\u0BC1`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD"} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.prefix}" \u0B87\u0BB2\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        if (_issue.format === "ends_with") {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.suffix}" \u0B87\u0BB2\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0B9F\u0BC8\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        if (_issue.format === "includes") {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.includes}" \u0B90 \u0B89\u0BB3\u0BCD\u0BB3\u0B9F\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        if (_issue.format === "regex") {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: ${_issue.pattern} \u0BAE\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B9F\u0BA9\u0BCD \u0BAA\u0BCA\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B8E\u0BA3\u0BCD: ${issue2.divisor} \u0B87\u0BA9\u0BCD \u0BAA\u0BB2\u0BAE\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "unrecognized_keys": {
        return `\u0B85\u0B9F\u0BC8\u0BAF\u0BBE\u0BB3\u0BAE\u0BCD \u0BA4\u0BC6\u0BB0\u0BBF\u0BAF\u0BBE\u0BA4 \u0BB5\u0BBF\u0B9A\u0BC8${issue2.keys.length > 1 ? "\u0B95\u0BB3\u0BCD" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0B9A\u0BC8`;
      }
      case "invalid_union": {
        return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
      }
      case "invalid_element": {
        return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1`;
      }
      default: {
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1`;
      }
    }
  };
}, "error");
function ta_default() {
  return {
    localeError: error41(),
  };
}
__name(ta_default, "default");

// node_modules/zod/v4/locales/th.js
var error42 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
      verb: "\u0E04\u0E27\u0E23\u0E21\u0E35",
    },
    file: {
      unit: "\u0E44\u0E1A\u0E15\u0E4C",
      verb: "\u0E04\u0E27\u0E23\u0E21\u0E35",
    },
    set: {
      unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
      verb: "\u0E04\u0E27\u0E23\u0E21\u0E35",
    },
    string: {
      unit: "\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23",
      verb: "\u0E04\u0E27\u0E23\u0E21\u0E35",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64",
    base64url:
      "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A URL",
    cidrv4: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv4",
    cidrv6: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A ISO",
    datetime:
      "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    duration:
      "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    e164: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 (E.164)",
    email:
      "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25",
    emoji: "\u0E2D\u0E34\u0E42\u0E21\u0E08\u0E34",
    guid: "GUID",
    ipv4: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv4",
    ipv6: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv6",
    json_string:
      "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A JSON",
    jwt: "\u0E42\u0E17\u0E40\u0E04\u0E19 JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex:
      "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19",
    template_literal:
      "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19",
    time: "\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C (Array)",
    nan: "NaN",
    null: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 (null)",
    number: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 instanceof ${issue2.expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
        }
        return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E19 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive
          ? "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19"
          : "\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}`;
        }
        return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive
          ? "\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22"
          : "\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E17\u0E49\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 "${_issue.includes}" \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`;
        }
        if (_issue.format === "regex") {
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14 ${_issue.pattern}`;
        }
        return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22 ${issue2.divisor} \u0E44\u0E14\u0E49\u0E25\u0E07\u0E15\u0E31\u0E27`;
      }
      case "unrecognized_keys": {
        return `\u0E1E\u0E1A\u0E04\u0E35\u0E22\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u0E04\u0E35\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E22\u0E39\u0E40\u0E19\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49";
      }
      case "invalid_element": {
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
      }
      default: {
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`;
      }
    }
  };
}, "error");
function th_default() {
  return {
    localeError: error42(),
  };
}
__name(th_default, "default");

// node_modules/zod/v4/locales/tr.js
var error43 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
    file: { unit: "bayt", verb: "olmal\u0131" },
    set: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
    string: { unit: "karakter", verb: "olmal\u0131" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 ile \u015Fifrelenmi\u015F metin",
    base64url: "base64url ile \u015Fifrelenmi\u015F metin",
    cidrv4: "IPv4 aral\u0131\u011F\u0131",
    cidrv6: "IPv6 aral\u0131\u011F\u0131",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO tarih",
    datetime: "ISO tarih ve saat",
    duration: "ISO s\xFCre",
    e164: "E.164 say\u0131s\u0131",
    email: "e-posta adresi",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 adresi",
    ipv6: "IPv6 adresi",
    json_string: "JSON dizesi",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "girdi",
    template_literal: "\u015Eablon dizesi",
    time: "ISO saat",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ge\xE7ersiz de\u011Fer: beklenen instanceof ${issue2.expected}, al\u0131nan ${received}`;
        }
        return `Ge\xE7ersiz de\u011Fer: beklenen ${expected}, al\u0131nan ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Ge\xE7ersiz de\u011Fer: beklenen ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Ge\xE7ersiz se\xE7enek: a\u015Fa\u011F\u0131dakilerden biri olmal\u0131: ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xF6\u011Fe"}`;
        }
        return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ge\xE7ersiz metin: "${_issue.prefix}" ile ba\u015Flamal\u0131`;
        }
        if (_issue.format === "ends_with") {
          return `Ge\xE7ersiz metin: "${_issue.suffix}" ile bitmeli`;
        }
        if (_issue.format === "includes") {
          return `Ge\xE7ersiz metin: "${_issue.includes}" i\xE7ermeli`;
        }
        if (_issue.format === "regex") {
          return `Ge\xE7ersiz metin: ${_issue.pattern} desenine uymal\u0131`;
        }
        return `Ge\xE7ersiz ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Ge\xE7ersiz say\u0131: ${issue2.divisor} ile tam b\xF6l\xFCnebilmeli`;
      }
      case "unrecognized_keys": {
        return `Tan\u0131nmayan anahtar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} i\xE7inde ge\xE7ersiz anahtar`;
      }
      case "invalid_union": {
        return "Ge\xE7ersiz de\u011Fer";
      }
      case "invalid_element": {
        return `${issue2.origin} i\xE7inde ge\xE7ersiz de\u011Fer`;
      }
      default: {
        return `Ge\xE7ersiz de\u011Fer`;
      }
    }
  };
}, "error");
function tr_default() {
  return {
    localeError: error43(),
  };
}
__name(tr_default, "default");

// node_modules/zod/v4/locales/uk.js
var error44 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432",
      verb: "\u043C\u0430\u0442\u0438\u043C\u0435",
    },
    file: {
      unit: "\u0431\u0430\u0439\u0442\u0456\u0432",
      verb: "\u043C\u0430\u0442\u0438\u043C\u0435",
    },
    set: {
      unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432",
      verb: "\u043C\u0430\u0442\u0438\u043C\u0435",
    },
    string: {
      unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432",
      verb: "\u043C\u0430\u0442\u0438\u043C\u0435",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64",
    base64url:
      "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64url",
    cidrv4: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv4",
    cidrv6: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u0434\u0430\u0442\u0430 ISO",
    datetime: "\u0434\u0430\u0442\u0430 \u0442\u0430 \u0447\u0430\u0441 ISO",
    duration:
      "\u0442\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C ISO",
    e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
    email:
      "\u0430\u0434\u0440\u0435\u0441\u0430 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u043F\u043E\u0448\u0442\u0438",
    emoji: "\u0435\u043C\u043E\u0434\u0437\u0456",
    guid: "GUID",
    ipv4: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv4",
    ipv6: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv6",
    json_string: "\u0440\u044F\u0434\u043E\u043A JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456",
    template_literal:
      "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456",
    time: "\u0447\u0430\u0441 ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u043C\u0430\u0441\u0438\u0432",
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F instanceof ${issue2.expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
        }
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430 \u043E\u043F\u0446\u0456\u044F: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u043D\u0435 \u0437 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432"}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} \u0431\u0443\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} \u0431\u0443\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0447\u0438\u043D\u0430\u0442\u0438\u0441\u044F \u0437 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0437\u0430\u043A\u0456\u043D\u0447\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        }
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0447\u0438\u0441\u043B\u043E: \u043F\u043E\u0432\u0438\u043D\u043D\u043E \u0431\u0443\u0442\u0438 \u043A\u0440\u0430\u0442\u043D\u0438\u043C ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `\u041D\u0435\u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u0438\u0439 \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0456" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
      }
      case "invalid_element": {
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0443 ${issue2.origin}`;
      }
      default: {
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456`;
      }
    }
  };
}, "error");
function uk_default() {
  return {
    localeError: error44(),
  };
}
__name(uk_default, "default");

// node_modules/zod/v4/locales/ua.js
function ua_default() {
  return uk_default();
}
__name(ua_default, "default");

// node_modules/zod/v4/locales/ur.js
var error45 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: {
      unit: "\u0622\u0626\u0679\u0645\u0632",
      verb: "\u06C1\u0648\u0646\u0627",
    },
    file: {
      unit: "\u0628\u0627\u0626\u0679\u0633",
      verb: "\u06C1\u0648\u0646\u0627",
    },
    set: {
      unit: "\u0622\u0626\u0679\u0645\u0632",
      verb: "\u06C1\u0648\u0646\u0627",
    },
    string: {
      unit: "\u062D\u0631\u0648\u0641",
      verb: "\u06C1\u0648\u0646\u0627",
    },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64:
      "\u0628\u06CC\u0633 64 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
    base64url:
      "\u0628\u06CC\u0633 64 \u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
    cidrv4:
      "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0631\u06CC\u0646\u062C",
    cidrv6:
      "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0631\u06CC\u0646\u062C",
    cuid: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    cuid2: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC 2",
    date: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u062A\u0627\u0631\u06CC\u062E",
    datetime:
      "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0688\u06CC\u0679 \u0679\u0627\u0626\u0645",
    duration:
      "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0645\u062F\u062A",
    e164: "\u0627\u06CC 164 \u0646\u0645\u0628\u0631",
    email:
      "\u0627\u06CC \u0645\u06CC\u0644 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
    guid: "\u062C\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    ipv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    ipv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    json_string:
      "\u062C\u06D2 \u0627\u06CC\u0633 \u0627\u0648 \u0627\u06CC\u0646 \u0633\u0679\u0631\u0646\u06AF",
    jwt: "\u062C\u06D2 \u0688\u0628\u0644\u06CC\u0648 \u0679\u06CC",
    ksuid:
      "\u06A9\u06D2 \u0627\u06CC\u0633 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    nanoid: "\u0646\u06CC\u0646\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    regex: "\u0627\u0646 \u067E\u0679",
    template_literal: "\u0627\u0646 \u067E\u0679",
    time: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0648\u0642\u062A",
    ulid: "\u06CC\u0648 \u0627\u06CC\u0644 \u0622\u0626\u06CC \u0688\u06CC",
    url: "\u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644",
    uuid: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    uuidv4:
      "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 4",
    uuidv6:
      "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 6",
    xid: "\u0627\u06CC\u06A9\u0633 \u0622\u0626\u06CC \u0688\u06CC",
  };
  const TypeDictionary = {
    array: "\u0622\u0631\u06D2",
    nan: "NaN",
    null: "\u0646\u0644",
    number: "\u0646\u0645\u0628\u0631",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: instanceof ${issue2.expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
        }
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${stringifyPrimitive(issue2.values[0])} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
        }
        return `\u063A\u0644\u0637 \u0622\u067E\u0634\u0646: ${joinValues(issue2.values, "|")} \u0645\u06CC\u06BA \u0633\u06D2 \u0627\u06CC\u06A9 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u06D2 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0627\u0635\u0631"} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        }
        return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u0627 ${adj}${issue2.maximum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u06D2 ${adj}${issue2.minimum.toString()} ${sizing.unit} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        }
        return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u0627 ${adj}${issue2.minimum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.prefix}" \u0633\u06D2 \u0634\u0631\u0648\u0639 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        }
        if (_issue.format === "ends_with") {
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.suffix}" \u067E\u0631 \u062E\u062A\u0645 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        }
        if (_issue.format === "includes") {
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.includes}" \u0634\u0627\u0645\u0644 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        }
        if (_issue.format === "regex") {
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: \u067E\u06CC\u0679\u0631\u0646 ${_issue.pattern} \u0633\u06D2 \u0645\u06CC\u0686 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        }
        return `\u063A\u0644\u0637 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u063A\u0644\u0637 \u0646\u0645\u0628\u0631: ${issue2.divisor} \u06A9\u0627 \u0645\u0636\u0627\u0639\u0641 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
      }
      case "unrecognized_keys": {
        return `\u063A\u06CC\u0631 \u062A\u0633\u0644\u06CC\u0645 \u0634\u062F\u06C1 \u06A9\u06CC${issue2.keys.length > 1 ? "\u0632" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u06A9\u06CC`;
      }
      case "invalid_union": {
        return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
      }
      case "invalid_element": {
        return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u0648\u06CC\u0644\u06CC\u0648`;
      }
      default: {
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679`;
      }
    }
  };
}, "error");
function ur_default() {
  return {
    localeError: error45(),
  };
}
__name(ur_default, "default");

// node_modules/zod/v4/locales/uz.js
var error46 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "element", verb: "bo\u2018lishi kerak" },
    file: { unit: "bayt", verb: "bo\u2018lishi kerak" },
    map: { unit: "yozuv", verb: "bo\u2018lishi kerak" },
    set: { unit: "element", verb: "bo\u2018lishi kerak" },
    string: { unit: "belgi", verb: "bo\u2018lishi kerak" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 kodlangan satr",
    base64url: "base64url kodlangan satr",
    cidrv4: "IPv4 diapazon",
    cidrv6: "IPv6 diapazon",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO sana",
    datetime: "ISO sana va vaqti",
    duration: "ISO davomiylik",
    e164: "E.164 raqam",
    email: "elektron pochta manzili",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 manzil",
    ipv6: "IPv6 manzil",
    json_string: "JSON satr",
    jwt: "JWT",
    ksuid: "KSUID",
    mac: "MAC manzil",
    nanoid: "nanoid",
    regex: "kirish",
    template_literal: "kirish",
    time: "ISO vaqt",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "massiv",
    nan: "NaN",
    number: "raqam",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Noto\u2018g\u2018ri kirish: kutilgan instanceof ${issue2.expected}, qabul qilingan ${received}`;
        }
        return `Noto\u2018g\u2018ri kirish: kutilgan ${expected}, qabul qilingan ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `Noto\u2018g\u2018ri kirish: kutilgan ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `Noto\u2018g\u2018ri variant: quyidagilardan biri kutilgan ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Juda katta: kutilgan ${issue2.origin ?? "qiymat"} ${adj}${issue2.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Juda katta: kutilgan ${issue2.origin ?? "qiymat"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Juda kichik: kutilgan ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Juda kichik: kutilgan ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Noto\u2018g\u2018ri satr: "${_issue.prefix}" bilan boshlanishi kerak`;
        }
        if (_issue.format === "ends_with") {
          return `Noto\u2018g\u2018ri satr: "${_issue.suffix}" bilan tugashi kerak`;
        }
        if (_issue.format === "includes") {
          return `Noto\u2018g\u2018ri satr: "${_issue.includes}" ni o\u2018z ichiga olishi kerak`;
        }
        if (_issue.format === "regex") {
          return `Noto\u2018g\u2018ri satr: ${_issue.pattern} shabloniga mos kelishi kerak`;
        }
        return `Noto\u2018g\u2018ri ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `Noto\u2018g\u2018ri raqam: ${issue2.divisor} ning karralisi bo\u2018lishi kerak`;
      }
      case "unrecognized_keys": {
        return `Noma\u2019lum kalit${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} dagi kalit noto\u2018g\u2018ri`;
      }
      case "invalid_union": {
        return "Noto\u2018g\u2018ri kirish";
      }
      case "invalid_element": {
        return `${issue2.origin} da noto\u2018g\u2018ri qiymat`;
      }
      default: {
        return `Noto\u2018g\u2018ri kirish`;
      }
    }
  };
}, "error");
function uz_default() {
  return {
    localeError: error46(),
  };
}
__name(uz_default, "default");

// node_modules/zod/v4/locales/vi.js
var error47 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
    file: { unit: "byte", verb: "c\xF3" },
    set: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
    string: { unit: "k\xFD t\u1EF1", verb: "c\xF3" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "chu\u1ED7i m\xE3 h\xF3a base64",
    base64url: "chu\u1ED7i m\xE3 h\xF3a base64url",
    cidrv4: "d\u1EA3i IPv4",
    cidrv6: "d\u1EA3i IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ng\xE0y ISO",
    datetime: "ng\xE0y gi\u1EDD ISO",
    duration: "kho\u1EA3ng th\u1EDDi gian ISO",
    e164: "s\u1ED1 E.164",
    email: "\u0111\u1ECBa ch\u1EC9 email",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "\u0111\u1ECBa ch\u1EC9 IPv4",
    ipv6: "\u0111\u1ECBa ch\u1EC9 IPv6",
    json_string: "chu\u1ED7i JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u0111\u1EA7u v\xE0o",
    template_literal: "\u0111\u1EA7u v\xE0o",
    time: "gi\u1EDD ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "m\u1EA3ng",
    nan: "NaN",
    number: "s\u1ED1",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i instanceof ${issue2.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
        }
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `T\xF9y ch\u1ECDn kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i m\u1ED9t trong c\xE1c gi\xE1 tr\u1ECB ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "ph\u1EA7n t\u1EED"}`;
        }
        return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i k\u1EBFt th\xFAc b\u1EB1ng "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i bao g\u1ED3m "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i kh\u1EDBp v\u1EDBi m\u1EABu ${_issue.pattern}`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} kh\xF4ng h\u1EE3p l\u1EC7`;
      }
      case "not_multiple_of": {
        return `S\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i l\xE0 b\u1ED9i s\u1ED1 c\u1EE7a ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `Kh\xF3a kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EADn d\u1EA1ng: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `Kh\xF3a kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
      }
      case "invalid_element": {
        return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
      }
      default: {
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7`;
      }
    }
  };
}, "error");
function vi_default() {
  return {
    localeError: error47(),
  };
}
__name(vi_default, "default");

// node_modules/zod/v4/locales/zh-CN.js
var error48 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\u9879", verb: "\u5305\u542B" },
    file: { unit: "\u5B57\u8282", verb: "\u5305\u542B" },
    set: { unit: "\u9879", verb: "\u5305\u542B" },
    string: { unit: "\u5B57\u7B26", verb: "\u5305\u542B" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64\u7F16\u7801\u5B57\u7B26\u4E32",
    base64url: "base64url\u7F16\u7801\u5B57\u7B26\u4E32",
    cidrv4: "IPv4\u7F51\u6BB5",
    cidrv6: "IPv6\u7F51\u6BB5",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO\u65E5\u671F",
    datetime: "ISO\u65E5\u671F\u65F6\u95F4",
    duration: "ISO\u65F6\u957F",
    e164: "E.164\u53F7\u7801",
    email: "\u7535\u5B50\u90AE\u4EF6",
    emoji: "\u8868\u60C5\u7B26\u53F7",
    guid: "GUID",
    ipv4: "IPv4\u5730\u5740",
    ipv6: "IPv6\u5730\u5740",
    json_string: "JSON\u5B57\u7B26\u4E32",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u8F93\u5165",
    template_literal: "\u8F93\u5165",
    time: "ISO\u65F6\u95F4",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "\u6570\u7EC4",
    nan: "NaN",
    null: "\u7A7A\u503C(null)",
    number: "\u6570\u5B57",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B instanceof ${issue2.expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
        }
        return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u65E0\u6548\u9009\u9879\uFF1A\u671F\u671B\u4EE5\u4E0B\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u4E2A\u5143\u7D20"}`;
        }
        return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.prefix}" \u5F00\u5934`;
        }
        if (_issue.format === "ends_with") {
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.suffix}" \u7ED3\u5C3E`;
        }
        if (_issue.format === "includes") {
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u5305\u542B "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u6EE1\u8DB3\u6B63\u5219\u8868\u8FBE\u5F0F ${_issue.pattern}`;
        }
        return `\u65E0\u6548${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u65E0\u6548\u6570\u5B57\uFF1A\u5FC5\u987B\u662F ${issue2.divisor} \u7684\u500D\u6570`;
      }
      case "unrecognized_keys": {
        return `\u51FA\u73B0\u672A\u77E5\u7684\u952E(key): ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} \u4E2D\u7684\u952E(key)\u65E0\u6548`;
      }
      case "invalid_union": {
        return "\u65E0\u6548\u8F93\u5165";
      }
      case "invalid_element": {
        return `${issue2.origin} \u4E2D\u5305\u542B\u65E0\u6548\u503C(value)`;
      }
      default: {
        return `\u65E0\u6548\u8F93\u5165`;
      }
    }
  };
}, "error");
function zh_CN_default() {
  return {
    localeError: error48(),
  };
}
__name(zh_CN_default, "default");

// node_modules/zod/v4/locales/zh-TW.js
var error49 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
    file: { unit: "\u4F4D\u5143\u7D44", verb: "\u64C1\u6709" },
    set: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
    string: { unit: "\u5B57\u5143", verb: "\u64C1\u6709" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "base64 \u7DE8\u78BC\u5B57\u4E32",
    base64url: "base64url \u7DE8\u78BC\u5B57\u4E32",
    cidrv4: "IPv4 \u7BC4\u570D",
    cidrv6: "IPv6 \u7BC4\u570D",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "ISO \u65E5\u671F",
    datetime: "ISO \u65E5\u671F\u6642\u9593",
    duration: "ISO \u671F\u9593",
    e164: "E.164 \u6578\u503C",
    email: "\u90F5\u4EF6\u5730\u5740",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "IPv4 \u4F4D\u5740",
    ipv6: "IPv6 \u4F4D\u5740",
    json_string: "JSON \u5B57\u4E32",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u8F38\u5165",
    template_literal: "\u8F38\u5165",
    time: "ISO \u6642\u9593",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    nan: "NaN",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA instanceof ${issue2.expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
        }
        return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\u7121\u6548\u7684\u9078\u9805\uFF1A\u9810\u671F\u70BA\u4EE5\u4E0B\u5176\u4E2D\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u500B\u5143\u7D20"}`;
        }
        return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.prefix}" \u958B\u982D`;
        }
        if (_issue.format === "ends_with") {
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.suffix}" \u7D50\u5C3E`;
        }
        if (_issue.format === "includes") {
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u5305\u542B "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u7B26\u5408\u683C\u5F0F ${_issue.pattern}`;
        }
        return `\u7121\u6548\u7684 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `\u7121\u6548\u7684\u6578\u5B57\uFF1A\u5FC5\u9808\u70BA ${issue2.divisor} \u7684\u500D\u6578`;
      }
      case "unrecognized_keys": {
        return `\u7121\u6CD5\u8B58\u5225\u7684\u9375\u503C${issue2.keys.length > 1 ? "\u5011" : ""}\uFF1A${joinValues(issue2.keys, "\u3001")}`;
      }
      case "invalid_key": {
        return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u9375\u503C`;
      }
      case "invalid_union": {
        return "\u7121\u6548\u7684\u8F38\u5165\u503C";
      }
      case "invalid_element": {
        return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u503C`;
      }
      default: {
        return `\u7121\u6548\u7684\u8F38\u5165\u503C`;
      }
    }
  };
}, "error");
function zh_TW_default() {
  return {
    localeError: error49(),
  };
}
__name(zh_TW_default, "default");

// node_modules/zod/v4/locales/yo.js
var error50 = /* @__PURE__ */ __name(() => {
  const Sizable = {
    array: { unit: "nkan", verb: "n\xED" },
    file: { unit: "bytes", verb: "n\xED" },
    set: { unit: "nkan", verb: "n\xED" },
    string: { unit: "\xE0mi", verb: "n\xED" },
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    base64: "\u1ECD\u0300r\u1ECD\u0300 t\xED a k\u1ECD\u0301 n\xED base64",
    base64url: "\u1ECD\u0300r\u1ECD\u0300 base64url",
    cidrv4: "\xE0gb\xE8gb\xE8 IPv4",
    cidrv6: "\xE0gb\xE8gb\xE8 IPv6",
    cuid: "cuid",
    cuid2: "cuid2",
    date: "\u1ECDj\u1ECD\u0301 ISO",
    datetime: "\xE0k\xF3k\xF2 ISO",
    duration: "\xE0k\xF3k\xF2 t\xF3 p\xE9 ISO",
    e164: "n\u1ECD\u0301mb\xE0 E.164",
    email: "\xE0d\xEDr\u1EB9\u0301s\xEC \xECm\u1EB9\u0301l\xEC",
    emoji: "emoji",
    guid: "GUID",
    ipv4: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv4",
    ipv6: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv6",
    json_string: "\u1ECD\u0300r\u1ECD\u0300 JSON",
    jwt: "JWT",
    ksuid: "KSUID",
    nanoid: "nanoid",
    regex: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9",
    template_literal: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9",
    time: "\xE0k\xF3k\xF2 ISO",
    ulid: "ULID",
    url: "URL",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    xid: "XID",
  };
  const TypeDictionary = {
    array: "akop\u1ECD",
    nan: "NaN",
    number: "n\u1ECD\u0301mb\xE0",
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi instanceof ${issue2.expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
        }
        return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${stringifyPrimitive(issue2.values[0])}`;
        }
        return `\xC0\u1E63\xE0y\xE0n a\u1E63\xEC\u1E63e: yan \u1ECD\u0300kan l\xE1ra ${joinValues(issue2.values, "|")}`;
      }
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue2.origin ?? "iye"} ${sizing.verb} ${adj}${issue2.maximum} ${sizing.unit}`;
        }
        return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue2.maximum}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum} ${sizing.unit}`;
        }
        return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue2.minimum}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\u1EB9\u0300r\u1EB9\u0300 p\u1EB9\u0300l\xFA "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with") {
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 par\xED p\u1EB9\u0300l\xFA "${_issue.suffix}"`;
        }
        if (_issue.format === "includes") {
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 n\xED "${_issue.includes}"`;
        }
        if (_issue.format === "regex") {
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\xE1 \xE0p\u1EB9\u1EB9r\u1EB9 mu ${_issue.pattern}`;
        }
        return `A\u1E63\xEC\u1E63e: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of": {
        return `N\u1ECD\u0301mb\xE0 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 j\u1EB9\u0301 \xE8y\xE0 p\xEDp\xEDn ti ${issue2.divisor}`;
      }
      case "unrecognized_keys": {
        return `B\u1ECDt\xECn\xEC \xE0\xECm\u1ECD\u0300: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key": {
        return `B\u1ECDt\xECn\xEC a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue2.origin}`;
      }
      case "invalid_union": {
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
      }
      case "invalid_element": {
        return `Iye a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue2.origin}`;
      }
      default: {
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
      }
    }
  };
}, "error");
function yo_default() {
  return {
    localeError: error50(),
  };
}
__name(yo_default, "default");

// node_modules/zod/v4/core/registries.js
var _a2;
var $output = /* @__PURE__ */ Symbol("ZodOutput");
var $input = /* @__PURE__ */ Symbol("ZodInput");
var $ZodRegistry = class {
  static {
    __name(this, "$ZodRegistry");
  }
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta3 = _meta[0];
    this._map.set(schema, meta3);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.set(meta3.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta3 = this._map.get(schema);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.delete(meta3.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
__name(registry, "registry");
(_a2 = globalThis).__zod_globalRegistry ??
  (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_string, "_string");
// @__NO_SIDE_EFFECTS__
function _coercedString(Class2, params) {
  return new Class2({
    coerce: true,
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_coercedString, "_coercedString");
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "email",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_email, "_email");
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "guid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_guid, "_guid");
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "uuid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_uuid, "_uuid");
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "uuid",
    type: "string",
    version: "v4",
    ...normalizeParams(params),
  });
}
__name(_uuidv4, "_uuidv4");
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "uuid",
    type: "string",
    version: "v6",
    ...normalizeParams(params),
  });
}
__name(_uuidv6, "_uuidv6");
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "uuid",
    type: "string",
    version: "v7",
    ...normalizeParams(params),
  });
}
__name(_uuidv7, "_uuidv7");
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "url",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_url, "_url");
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "emoji",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_emoji2, "_emoji");
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "nanoid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_nanoid, "_nanoid");
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "cuid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_cuid, "_cuid");
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "cuid2",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_cuid2, "_cuid2");
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "ulid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_ulid, "_ulid");
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "xid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_xid, "_xid");
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "ksuid",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_ksuid, "_ksuid");
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "ipv4",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_ipv4, "_ipv4");
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "ipv6",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_ipv6, "_ipv6");
// @__NO_SIDE_EFFECTS__
function _mac(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "mac",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_mac, "_mac");
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "cidrv4",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_cidrv4, "_cidrv4");
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "cidrv6",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_cidrv6, "_cidrv6");
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "base64",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_base64, "_base64");
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "base64url",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_base64url, "_base64url");
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "e164",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_e164, "_e164");
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    abort: false,
    check: "string_format",
    format: "jwt",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_jwt, "_jwt");
var TimePrecision = {
  Any: null,
  Microsecond: 6,
  Millisecond: 3,
  Minute: -1,
  Second: 0,
};
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    check: "string_format",
    format: "datetime",
    local: false,
    offset: false,
    precision: null,
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_isoDateTime, "_isoDateTime");
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    check: "string_format",
    format: "date",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_isoDate, "_isoDate");
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    check: "string_format",
    format: "time",
    precision: null,
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_isoTime, "_isoTime");
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    check: "string_format",
    format: "duration",
    type: "string",
    ...normalizeParams(params),
  });
}
__name(_isoDuration, "_isoDuration");
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2({
    checks: [],
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_number, "_number");
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class2, params) {
  return new Class2({
    checks: [],
    coerce: true,
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_coercedNumber, "_coercedNumber");
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    abort: false,
    check: "number_format",
    format: "safeint",
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_int, "_int");
// @__NO_SIDE_EFFECTS__
function _float32(Class2, params) {
  return new Class2({
    abort: false,
    check: "number_format",
    format: "float32",
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_float32, "_float32");
// @__NO_SIDE_EFFECTS__
function _float64(Class2, params) {
  return new Class2({
    abort: false,
    check: "number_format",
    format: "float64",
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_float64, "_float64");
// @__NO_SIDE_EFFECTS__
function _int32(Class2, params) {
  return new Class2({
    abort: false,
    check: "number_format",
    format: "int32",
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_int32, "_int32");
// @__NO_SIDE_EFFECTS__
function _uint32(Class2, params) {
  return new Class2({
    abort: false,
    check: "number_format",
    format: "uint32",
    type: "number",
    ...normalizeParams(params),
  });
}
__name(_uint32, "_uint32");
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params),
  });
}
__name(_boolean, "_boolean");
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class2, params) {
  return new Class2({
    coerce: true,
    type: "boolean",
    ...normalizeParams(params),
  });
}
__name(_coercedBoolean, "_coercedBoolean");
// @__NO_SIDE_EFFECTS__
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params),
  });
}
__name(_bigint, "_bigint");
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class2, params) {
  return new Class2({
    coerce: true,
    type: "bigint",
    ...normalizeParams(params),
  });
}
__name(_coercedBigint, "_coercedBigint");
// @__NO_SIDE_EFFECTS__
function _int64(Class2, params) {
  return new Class2({
    abort: false,
    check: "bigint_format",
    format: "int64",
    type: "bigint",
    ...normalizeParams(params),
  });
}
__name(_int64, "_int64");
// @__NO_SIDE_EFFECTS__
function _uint64(Class2, params) {
  return new Class2({
    abort: false,
    check: "bigint_format",
    format: "uint64",
    type: "bigint",
    ...normalizeParams(params),
  });
}
__name(_uint64, "_uint64");
// @__NO_SIDE_EFFECTS__
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params),
  });
}
__name(_symbol, "_symbol");
// @__NO_SIDE_EFFECTS__
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params),
  });
}
__name(_undefined2, "_undefined");
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params),
  });
}
__name(_null2, "_null");
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any",
  });
}
__name(_any, "_any");
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown",
  });
}
__name(_unknown, "_unknown");
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params),
  });
}
__name(_never, "_never");
// @__NO_SIDE_EFFECTS__
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params),
  });
}
__name(_void, "_void");
// @__NO_SIDE_EFFECTS__
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params),
  });
}
__name(_date, "_date");
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class2, params) {
  return new Class2({
    coerce: true,
    type: "date",
    ...normalizeParams(params),
  });
}
__name(_coercedDate, "_coercedDate");
// @__NO_SIDE_EFFECTS__
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params),
  });
}
__name(_nan, "_nan");
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false,
  });
}
__name(_lt, "_lt");
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true,
  });
}
__name(_lte, "_lte");
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false,
  });
}
__name(_gt, "_gt");
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true,
  });
}
__name(_gte, "_gte");
// @__NO_SIDE_EFFECTS__
function _positive(params) {
  return /* @__PURE__ */ _gt(0, params);
}
__name(_positive, "_positive");
// @__NO_SIDE_EFFECTS__
function _negative(params) {
  return /* @__PURE__ */ _lt(0, params);
}
__name(_negative, "_negative");
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
  return /* @__PURE__ */ _lte(0, params);
}
__name(_nonpositive, "_nonpositive");
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
  return /* @__PURE__ */ _gte(0, params);
}
__name(_nonnegative, "_nonnegative");
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value,
  });
}
__name(_multipleOf, "_multipleOf");
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
  return new $ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum,
  });
}
__name(_maxSize, "_maxSize");
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
  return new $ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum,
  });
}
__name(_minSize, "_minSize");
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
  return new $ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size,
  });
}
__name(_size, "_size");
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum,
  });
  return ch;
}
__name(_maxLength, "_maxLength");
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum,
  });
}
__name(_minLength, "_minLength");
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length,
  });
}
__name(_length, "_length");
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern,
  });
}
__name(_regex, "_regex");
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params),
  });
}
__name(_lowercase, "_lowercase");
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params),
  });
}
__name(_uppercase, "_uppercase");
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes,
  });
}
__name(_includes, "_includes");
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix,
  });
}
__name(_startsWith, "_startsWith");
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix,
  });
}
__name(_endsWith, "_endsWith");
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
  return new $ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params),
  });
}
__name(_property, "_property");
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
  return new $ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params),
  });
}
__name(_mime, "_mime");
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx,
  });
}
__name(_overwrite, "_overwrite");
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
__name(_normalize, "_normalize");
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
__name(_trim, "_trim");
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
__name(_toLowerCase, "_toLowerCase");
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
__name(_toUpperCase, "_toUpperCase");
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
__name(_slugify, "_slugify");
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params),
  });
}
__name(_array, "_array");
// @__NO_SIDE_EFFECTS__
function _union(Class2, options, params) {
  return new Class2({
    options,
    type: "union",
    ...normalizeParams(params),
  });
}
__name(_union, "_union");
function _xor(Class2, options, params) {
  return new Class2({
    inclusive: false,
    options,
    type: "union",
    ...normalizeParams(params),
  });
}
__name(_xor, "_xor");
// @__NO_SIDE_EFFECTS__
function _discriminatedUnion(Class2, discriminator, options, params) {
  return new Class2({
    discriminator,
    options,
    type: "union",
    ...normalizeParams(params),
  });
}
__name(_discriminatedUnion, "_discriminatedUnion");
// @__NO_SIDE_EFFECTS__
function _intersection(Class2, left, right) {
  return new Class2({
    left,
    right,
    type: "intersection",
  });
}
__name(_intersection, "_intersection");
// @__NO_SIDE_EFFECTS__
function _tuple(Class2, items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class2({
    items,
    rest,
    type: "tuple",
    ...normalizeParams(params),
  });
}
__name(_tuple, "_tuple");
// @__NO_SIDE_EFFECTS__
function _record(Class2, keyType, valueType, params) {
  return new Class2({
    keyType,
    type: "record",
    valueType,
    ...normalizeParams(params),
  });
}
__name(_record, "_record");
// @__NO_SIDE_EFFECTS__
function _map(Class2, keyType, valueType, params) {
  return new Class2({
    keyType,
    type: "map",
    valueType,
    ...normalizeParams(params),
  });
}
__name(_map, "_map");
// @__NO_SIDE_EFFECTS__
function _set(Class2, valueType, params) {
  return new Class2({
    type: "set",
    valueType,
    ...normalizeParams(params),
  });
}
__name(_set, "_set");
// @__NO_SIDE_EFFECTS__
function _enum(Class2, values, params) {
  const entries = Array.isArray(values)
    ? Object.fromEntries(values.map((v) => [v, v]))
    : values;
  return new Class2({
    entries,
    type: "enum",
    ...normalizeParams(params),
  });
}
__name(_enum, "_enum");
// @__NO_SIDE_EFFECTS__
function _nativeEnum(Class2, entries, params) {
  return new Class2({
    entries,
    type: "enum",
    ...normalizeParams(params),
  });
}
__name(_nativeEnum, "_nativeEnum");
// @__NO_SIDE_EFFECTS__
function _literal(Class2, value, params) {
  return new Class2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params),
  });
}
__name(_literal, "_literal");
// @__NO_SIDE_EFFECTS__
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params),
  });
}
__name(_file, "_file");
// @__NO_SIDE_EFFECTS__
function _transform(Class2, fn) {
  return new Class2({
    transform: fn,
    type: "transform",
  });
}
__name(_transform, "_transform");
// @__NO_SIDE_EFFECTS__
function _optional(Class2, innerType) {
  return new Class2({
    innerType,
    type: "optional",
  });
}
__name(_optional, "_optional");
// @__NO_SIDE_EFFECTS__
function _nullable(Class2, innerType) {
  return new Class2({
    innerType,
    type: "nullable",
  });
}
__name(_nullable, "_nullable");
// @__NO_SIDE_EFFECTS__
function _default(Class2, innerType, defaultValue) {
  return new Class2({
    get defaultValue() {
      return typeof defaultValue === "function"
        ? defaultValue()
        : shallowClone(defaultValue);
    },
    innerType,
    type: "default",
  });
}
__name(_default, "_default");
// @__NO_SIDE_EFFECTS__
function _nonoptional(Class2, innerType, params) {
  return new Class2({
    innerType,
    type: "nonoptional",
    ...normalizeParams(params),
  });
}
__name(_nonoptional, "_nonoptional");
// @__NO_SIDE_EFFECTS__
function _success(Class2, innerType) {
  return new Class2({
    innerType,
    type: "success",
  });
}
__name(_success, "_success");
// @__NO_SIDE_EFFECTS__
function _catch(Class2, innerType, catchValue) {
  return new Class2({
    catchValue:
      typeof catchValue === "function" ? catchValue : () => catchValue,
    innerType,
    type: "catch",
  });
}
__name(_catch, "_catch");
// @__NO_SIDE_EFFECTS__
function _pipe(Class2, in_, out) {
  return new Class2({
    in: in_,
    out,
    type: "pipe",
  });
}
__name(_pipe, "_pipe");
// @__NO_SIDE_EFFECTS__
function _readonly(Class2, innerType) {
  return new Class2({
    innerType,
    type: "readonly",
  });
}
__name(_readonly, "_readonly");
// @__NO_SIDE_EFFECTS__
function _templateLiteral(Class2, parts, params) {
  return new Class2({
    parts,
    type: "template_literal",
    ...normalizeParams(params),
  });
}
__name(_templateLiteral, "_templateLiteral");
// @__NO_SIDE_EFFECTS__
function _lazy(Class2, getter) {
  return new Class2({
    getter,
    type: "lazy",
  });
}
__name(_lazy, "_lazy");
// @__NO_SIDE_EFFECTS__
function _promise(Class2, innerType) {
  return new Class2({
    innerType,
    type: "promise",
  });
}
__name(_promise, "_promise");
// @__NO_SIDE_EFFECTS__
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    check: "custom",
    fn,
    type: "custom",
    ...norm,
  });
  return schema;
}
__name(_custom, "_custom");
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    check: "custom",
    fn,
    type: "custom",
    ...normalizeParams(_params),
  });
  return schema;
}
__name(_refine, "_refine");
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal) {
          _issue.continue = false;
        }
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
__name(_superRefine, "_superRefine");
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
__name(_check, "_check");
// @__NO_SIDE_EFFECTS__
function describe(description) {
  const ch = new $ZodCheck({ check: "describe" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, description });
    },
  ];
  ch._zod.check = () => {};
  return ch;
}
__name(describe, "describe");
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
  const ch = new $ZodCheck({ check: "meta" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, ...metadata });
    },
  ];
  ch._zod.check = () => {};
  return ch;
}
__name(meta, "meta");
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) =>
      typeof v === "string" ? v.toLowerCase() : v
    );
    falsyArray = falsyArray.map((v) =>
      typeof v === "string" ? v.toLowerCase() : v
    );
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Codec = Classes.Codec ?? $ZodCodec;
  const _Boolean = Classes.Boolean ?? $ZodBoolean;
  const _String = Classes.String ?? $ZodString;
  const stringSchema = new _String({ error: params.error, type: "string" });
  const booleanSchema = new _Boolean({ error: params.error, type: "boolean" });
  const codec2 = new _Codec({
    error: params.error,
    in: stringSchema,
    out: booleanSchema,
    reverseTransform: /* @__PURE__ */ __name(
      (input, _payload) => {
        if (input === true) {
          return truthyArray[0] || "true";
        }
        return falsyArray[0] || "false";
      },
      "reverseTransform"
    ),
    transform: /* @__PURE__ */ __name(
      (input, payload) => {
        let data = input;
        if (params.case !== "sensitive") {
          data = data.toLowerCase();
        }
        if (truthySet.has(data)) {
          return true;
        } else if (falsySet.has(data)) {
          return false;
        }
        payload.issues.push({
          code: "invalid_value",
          continue: false,
          expected: "stringbool",
          input: payload.value,
          inst: codec2,
          values: [...truthySet, ...falsySet],
        });
        return {};
      },
      "transform"
    ),
    type: "pipe",
  });
  return codec2;
}
__name(_stringbool, "_stringbool");
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class2, format3, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    ...normalizeParams(_params),
    check: "string_format",
    fn:
      typeof fnOrRegex === "function"
        ? fnOrRegex
        : (val) => fnOrRegex.test(val),
    format: format3,
    type: "string",
    ...params,
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}
__name(_stringFormat, "_stringFormat");

// node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4") {
    target = "draft-04";
  }
  if (target === "draft-7") {
    target = "draft-07";
  }
  return {
    counter: 0,
    cycles: params?.cycles ?? "ref",
    external: params?.external ?? void 0,
    io: params?.io ?? "output",
    metadataRegistry: params?.metadata ?? globalRegistry,
    override: params?.override ?? (() => {}),
    processors: params.processors ?? {},
    reused: params?.reused ?? "inline",
    seen: /* @__PURE__ */ new Map(),
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
  };
}
__name(initializeContext, "initializeContext");
function process(schema, ctx, _params = { path: [], schemaPath: [] }) {
  let _a3;
  const { def } = schema._zod;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { count: 1, cycle: void 0, path: _params.path, schema: {} };
  ctx.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      path: _params.path,
      schemaPath: [..._params.schemaPath, schema],
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(
          `[toJSONSchema]: Non-representable type encountered: ${def.type}`
        );
      }
      processor(schema, ctx, _json, params);
    }
    const { parent } = schema._zod;
    if (parent) {
      if (!result.ref) {
        result.ref = parent;
      }
      process(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta3 = ctx.metadataRegistry.get(schema);
  if (meta3) {
    Object.assign(result.schema, meta3);
  }
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema) {
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  }
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
__name(process, "process");
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root) {
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  }
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(
          `Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`
        );
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = /* @__PURE__ */ __name((entry) => {
    const defsSegment =
      ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id =
        entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return {
        defId: id,
        ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`,
      };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  }, "makeURI");
  const extractToDef = /* @__PURE__ */ __name((entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref: ref2, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId) {
      seen.defId = defId;
    }
    const { schema: schema2 } = seen;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref2;
  }, "extractToDef");
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
__name(extractDefs, "extractDefs");
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root) {
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  }
  const flattenRef = /* @__PURE__ */ __name((zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null) {
      return;
    }
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const { ref: ref2 } = seen;
    seen.ref = null;
    if (ref2) {
      flattenRef(ref2);
      const refSeen = ctx.seen.get(ref2);
      const refSchema = refSeen.schema;
      if (
        refSchema.$ref &&
        (ctx.target === "draft-07" ||
          ctx.target === "draft-04" ||
          ctx.target === "openapi-3.0")
      ) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        Object.assign(schema2, refSchema);
      }
      Object.assign(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref2;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf") {
            continue;
          }
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf") {
            continue;
          }
          if (
            key in refSeen.def &&
            JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])
          ) {
            delete schema2[key];
          }
        }
      }
    }
    const { parent } = zodSchema._zod;
    if (parent && parent !== ref2) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf") {
              continue;
            }
            if (
              key in parentSeen.def &&
              JSON.stringify(schema2[key]) ===
                JSON.stringify(parentSeen.def[key])
            ) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      jsonSchema: schema2,
      path: seen.path ?? [],
      zodSchema,
    });
  }, "flattenRef");
  for (const entry of [...ctx.seen.entries()].toReversed()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id) {
      throw new Error("Schema is missing an `id` property");
    }
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId) {
    delete result.id;
  }
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId) {
        delete seen.def.id;
      }
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      enumerable: false,
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(
            schema,
            "input",
            ctx.processors
          ),
          output: createStandardJSONSchemaMethod(
            schema,
            "output",
            ctx.processors
          ),
        },
      },
      writable: false,
    });
    return finalized;
  } catch {
    throw new Error("Error converting schema to JSON.", { cause: _err });
  }
}
__name(finalize, "finalize");
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema)) {
    return false;
  }
  ctx.seen.add(_schema);
  const { def } = _schema._zod;
  if (def.type === "transform") {
    return true;
  }
  if (def.type === "array") {
    return isTransforming(def.element, ctx);
  }
  if (def.type === "set") {
    return isTransforming(def.valueType, ctx);
  }
  if (def.type === "lazy") {
    return isTransforming(def.getter(), ctx);
  }
  if (
    def.type === "promise" ||
    def.type === "optional" ||
    def.type === "nonoptional" ||
    def.type === "nullable" ||
    def.type === "readonly" ||
    def.type === "default" ||
    def.type === "prefault"
  ) {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return (
      isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx)
    );
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec")) {
      return true;
    }
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx)) {
        return true;
      }
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx)) {
        return true;
      }
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx)) {
        return true;
      }
    }
    if (def.rest && isTransforming(def.rest, ctx)) {
      return true;
    }
    return false;
  }
  return false;
}
__name(isTransforming, "isTransforming");
var createToJSONSchemaMethod = /* @__PURE__ */ __name(
  (schema, processors = {}) =>
    (params) => {
      const ctx = initializeContext({ ...params, processors });
      process(schema, ctx);
      extractDefs(ctx, schema);
      return finalize(ctx, schema);
    },
  "createToJSONSchemaMethod"
);
var createStandardJSONSchemaMethod = /* @__PURE__ */ __name(
  (schema, io, processors = {}) =>
    (params) => {
      const { libraryOptions, target } = params ?? {};
      const ctx = initializeContext({
        ...libraryOptions,
        io,
        processors,
        target,
      });
      process(schema, ctx);
      extractDefs(ctx, schema);
      return finalize(ctx, schema);
    },
  "createStandardJSONSchemaMethod"
);

// node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
  datetime: "date-time",
  guid: "uuid",
  json_string: "json-string",
  regex: "",
  // do not set
  url: "uri",
};
var stringProcessor = /* @__PURE__ */ __name((schema, ctx, _json, _params) => {
  const json2 = _json;
  json2.type = "string";
  const {
    minimum,
    maximum,
    format: format3,
    patterns: patterns3,
    contentEncoding,
  } = schema._zod.bag;
  if (typeof minimum === "number") {
    json2.minLength = minimum;
  }
  if (typeof maximum === "number") {
    json2.maxLength = maximum;
  }
  if (format3) {
    json2.format = formatMap[format3] ?? format3;
    if (json2.format === "") {
      delete json2.format;
    }
    if (format3 === "time") {
      delete json2.format;
    }
  }
  if (contentEncoding) {
    json2.contentEncoding = contentEncoding;
  }
  if (patterns3 && patterns3.size > 0) {
    const regexes = [...patterns3];
    if (regexes.length === 1) {
      json2.pattern = regexes[0].source;
    } else if (regexes.length > 1) {
      json2.allOf = regexes.map((regex) => ({
        ...(ctx.target === "draft-07" ||
        ctx.target === "draft-04" ||
        ctx.target === "openapi-3.0"
          ? { type: "string" }
          : {}),
        pattern: regex.source,
      }));
    }
  }
}, "stringProcessor");
var numberProcessor = /* @__PURE__ */ __name((schema, ctx, _json, _params) => {
  const json2 = _json;
  const {
    minimum,
    maximum,
    format: format3,
    multipleOf,
    exclusiveMaximum,
    exclusiveMinimum,
  } = schema._zod.bag;
  if (typeof format3 === "string" && format3.includes("int")) {
    json2.type = "integer";
  } else {
    json2.type = "number";
  }
  const exMin =
    typeof exclusiveMinimum === "number" &&
    exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax =
    typeof exclusiveMaximum === "number" &&
    exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json2.minimum = exclusiveMinimum;
      json2.exclusiveMinimum = true;
    } else {
      json2.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json2.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json2.maximum = exclusiveMaximum;
      json2.exclusiveMaximum = true;
    } else {
      json2.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json2.maximum = maximum;
  }
  if (typeof multipleOf === "number") {
    json2.multipleOf = multipleOf;
  }
}, "numberProcessor");
var booleanProcessor = /* @__PURE__ */ __name(
  (_schema, _ctx, json2, _params) => {
    json2.type = "boolean";
  },
  "booleanProcessor"
);
var bigintProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("BigInt cannot be represented in JSON Schema");
  }
}, "bigintProcessor");
var symbolProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Symbols cannot be represented in JSON Schema");
  }
}, "symbolProcessor");
var nullProcessor = /* @__PURE__ */ __name((_schema, ctx, json2, _params) => {
  if (ctx.target === "openapi-3.0") {
    json2.type = "string";
    json2.nullable = true;
    json2.enum = [null];
  } else {
    json2.type = "null";
  }
}, "nullProcessor");
var undefinedProcessor = /* @__PURE__ */ __name(
  (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
      throw new Error("Undefined cannot be represented in JSON Schema");
    }
  },
  "undefinedProcessor"
);
var voidProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Void cannot be represented in JSON Schema");
  }
}, "voidProcessor");
var neverProcessor = /* @__PURE__ */ __name((_schema, _ctx, json2, _params) => {
  json2.not = {};
}, "neverProcessor");
var anyProcessor = /* @__PURE__ */ __name(
  (_schema, _ctx, _json, _params) => {},
  "anyProcessor"
);
var unknownProcessor = /* @__PURE__ */ __name(
  (_schema, _ctx, _json, _params) => {},
  "unknownProcessor"
);
var dateProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Date cannot be represented in JSON Schema");
  }
}, "dateProcessor");
var enumProcessor = /* @__PURE__ */ __name((schema, _ctx, json2, _params) => {
  const { def } = schema._zod;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number")) {
    json2.type = "number";
  }
  if (values.every((v) => typeof v === "string")) {
    json2.type = "string";
  }
  json2.enum = values;
}, "enumProcessor");
var literalProcessor = /* @__PURE__ */ __name((schema, ctx, json2, _params) => {
  const { def } = schema._zod;
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (ctx.unrepresentable === "throw") {
        throw new Error(
          "Literal `undefined` cannot be represented in JSON Schema"
        );
      } else {
      }
    } else if (typeof val === "bigint") {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json2.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json2.enum = [val];
    } else {
      json2.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number")) {
      json2.type = "number";
    }
    if (vals.every((v) => typeof v === "string")) {
      json2.type = "string";
    }
    if (vals.every((v) => typeof v === "boolean")) {
      json2.type = "boolean";
    }
    if (vals.every((v) => v === null)) {
      json2.type = "null";
    }
    json2.enum = vals;
  }
}, "literalProcessor");
var nanProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("NaN cannot be represented in JSON Schema");
  }
}, "nanProcessor");
var templateLiteralProcessor = /* @__PURE__ */ __name(
  (schema, _ctx, json2, _params) => {
    const _json = json2;
    const { pattern } = schema._zod;
    if (!pattern) {
      throw new Error("Pattern not found in template literal");
    }
    _json.type = "string";
    _json.pattern = pattern.source;
  },
  "templateLiteralProcessor"
);
var fileProcessor = /* @__PURE__ */ __name((schema, _ctx, json2, _params) => {
  const _json = json2;
  const file2 = {
    contentEncoding: "binary",
    format: "binary",
    type: "string",
  };
  const { minimum, maximum, mime } = schema._zod.bag;
  if (minimum !== void 0) {
    file2.minLength = minimum;
  }
  if (maximum !== void 0) {
    file2.maxLength = maximum;
  }
  if (mime) {
    if (mime.length === 1) {
      file2.contentMediaType = mime[0];
      Object.assign(_json, file2);
    } else {
      Object.assign(_json, file2);
      _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
    }
  } else {
    Object.assign(_json, file2);
  }
}, "fileProcessor");
var successProcessor = /* @__PURE__ */ __name(
  (_schema, _ctx, json2, _params) => {
    json2.type = "boolean";
  },
  "successProcessor"
);
var customProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
}, "customProcessor");
var functionProcessor = /* @__PURE__ */ __name(
  (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
      throw new Error("Function types cannot be represented in JSON Schema");
    }
  },
  "functionProcessor"
);
var transformProcessor = /* @__PURE__ */ __name(
  (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
      throw new Error("Transforms cannot be represented in JSON Schema");
    }
  },
  "transformProcessor"
);
var mapProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Map cannot be represented in JSON Schema");
  }
}, "mapProcessor");
var setProcessor = /* @__PURE__ */ __name((_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Set cannot be represented in JSON Schema");
  }
}, "setProcessor");
var arrayProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json2 = _json;
  const { def } = schema._zod;
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number") {
    json2.minItems = minimum;
  }
  if (typeof maximum === "number") {
    json2.maxItems = maximum;
  }
  json2.type = "array";
  json2.items = process(def.element, ctx, {
    ...params,
    path: [...params.path, "items"],
  });
}, "arrayProcessor");
var objectProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json2 = _json;
  const { def } = schema._zod;
  json2.type = "object";
  json2.properties = {};
  const { shape } = def;
  for (const key in shape) {
    json2.properties[key] = process(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key],
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set(
    [...allKeys].filter((key) => {
      const v = def.shape[key]._zod;
      if (ctx.io === "input") {
        return v.optin === void 0;
      }
      return v.optout === void 0;
    })
  );
  if (requiredKeys.size > 0) {
    json2.required = [...requiredKeys];
  }
  if (def.catchall?._zod.def.type === "never") {
    json2.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output") {
      json2.additionalProperties = false;
    }
  } else if (def.catchall) {
    json2.additionalProperties = process(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"],
    });
  }
}, "objectProcessor");
var unionProcessor = /* @__PURE__ */ __name((schema, ctx, json2, params) => {
  const { def } = schema._zod;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) =>
    process(x, ctx, {
      ...params,
      path: [...params.path, isExclusive ? "oneOf" : "anyOf", i],
    })
  );
  if (isExclusive) {
    json2.oneOf = options;
  } else {
    json2.anyOf = options;
  }
}, "unionProcessor");
var intersectionProcessor = /* @__PURE__ */ __name(
  (schema, ctx, json2, params) => {
    const { def } = schema._zod;
    const a = process(def.left, ctx, {
      ...params,
      path: [...params.path, "allOf", 0],
    });
    const b = process(def.right, ctx, {
      ...params,
      path: [...params.path, "allOf", 1],
    });
    const isSimpleIntersection = /* @__PURE__ */ __name(
      (val) => "allOf" in val && Object.keys(val).length === 1,
      "isSimpleIntersection"
    );
    const allOf = [
      ...(isSimpleIntersection(a) ? a.allOf : [a]),
      ...(isSimpleIntersection(b) ? b.allOf : [b]),
    ];
    json2.allOf = allOf;
  },
  "intersectionProcessor"
);
var tupleProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json2 = _json;
  const { def } = schema._zod;
  json2.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath =
    ctx.target === "draft-2020-12"
      ? "items"
      : ctx.target === "openapi-3.0"
        ? "items"
        : "additionalItems";
  const prefixItems = def.items.map((x, i) =>
    process(x, ctx, {
      ...params,
      path: [...params.path, prefixPath, i],
    })
  );
  const rest = def.rest
    ? process(def.rest, ctx, {
        ...params,
        path: [
          ...params.path,
          restPath,
          ...(ctx.target === "openapi-3.0" ? [def.items.length] : []),
        ],
      })
    : null;
  if (ctx.target === "draft-2020-12") {
    json2.prefixItems = prefixItems;
    if (rest) {
      json2.items = rest;
    }
  } else if (ctx.target === "openapi-3.0") {
    json2.items = {
      anyOf: prefixItems,
    };
    if (rest) {
      json2.items.anyOf.push(rest);
    }
    json2.minItems = prefixItems.length;
    if (!rest) {
      json2.maxItems = prefixItems.length;
    }
  } else {
    json2.items = prefixItems;
    if (rest) {
      json2.additionalItems = rest;
    }
  }
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number") {
    json2.minItems = minimum;
  }
  if (typeof maximum === "number") {
    json2.maxItems = maximum;
  }
}, "tupleProcessor");
var recordProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json2 = _json;
  const { def } = schema._zod;
  json2.type = "object";
  const { keyType } = def;
  const keyBag = keyType._zod.bag;
  const patterns3 = keyBag?.patterns;
  if (def.mode === "loose" && patterns3 && patterns3.size > 0) {
    const valueSchema = process(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"],
    });
    json2.patternProperties = {};
    for (const pattern of patterns3) {
      json2.patternProperties[pattern.source] = valueSchema;
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json2.propertyNames = process(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"],
      });
    }
    json2.additionalProperties = process(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"],
    });
  }
  const keyValues = keyType._zod.values;
  if (keyValues) {
    const validKeyValues = [...keyValues].filter(
      (v) => typeof v === "string" || typeof v === "number"
    );
    if (validKeyValues.length > 0) {
      json2.required = validKeyValues;
    }
  }
}, "recordProcessor");
var nullableProcessor = /* @__PURE__ */ __name((schema, ctx, json2, params) => {
  const { def } = schema._zod;
  const inner = process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json2.nullable = true;
  } else {
    json2.anyOf = [inner, { type: "null" }];
  }
}, "nullableProcessor");
var nonoptionalProcessor = /* @__PURE__ */ __name(
  (schema, ctx, _json, params) => {
    const { def } = schema._zod;
    process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
  },
  "nonoptionalProcessor"
);
var defaultProcessor = /* @__PURE__ */ __name((schema, ctx, json2, params) => {
  const { def } = schema._zod;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json2.default = JSON.parse(JSON.stringify(def.defaultValue));
}, "defaultProcessor");
var prefaultProcessor = /* @__PURE__ */ __name((schema, ctx, json2, params) => {
  const { def } = schema._zod;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io === "input") {
    json2._prefault = JSON.parse(JSON.stringify(def.defaultValue));
  }
}, "prefaultProcessor");
var catchProcessor = /* @__PURE__ */ __name((schema, ctx, json2, params) => {
  const { def } = schema._zod;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue();
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json2.default = catchValue;
}, "catchProcessor");
var pipeProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const { def } = schema._zod;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType =
    ctx.io === "input" ? (inIsTransform ? def.out : def.in) : def.out;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
}, "pipeProcessor");
var readonlyProcessor = /* @__PURE__ */ __name((schema, ctx, json2, params) => {
  const { def } = schema._zod;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json2.readOnly = true;
}, "readonlyProcessor");
var promiseProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const { def } = schema._zod;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
}, "promiseProcessor");
var optionalProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const { def } = schema._zod;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
}, "optionalProcessor");
var lazyProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const { innerType } = schema._zod;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
}, "lazyProcessor");
var allProcessors = {
  any: anyProcessor,
  array: arrayProcessor,
  bigint: bigintProcessor,
  boolean: booleanProcessor,
  catch: catchProcessor,
  custom: customProcessor,
  date: dateProcessor,
  default: defaultProcessor,
  enum: enumProcessor,
  file: fileProcessor,
  function: functionProcessor,
  intersection: intersectionProcessor,
  lazy: lazyProcessor,
  literal: literalProcessor,
  map: mapProcessor,
  nan: nanProcessor,
  never: neverProcessor,
  nonoptional: nonoptionalProcessor,
  null: nullProcessor,
  nullable: nullableProcessor,
  number: numberProcessor,
  object: objectProcessor,
  optional: optionalProcessor,
  pipe: pipeProcessor,
  prefault: prefaultProcessor,
  promise: promiseProcessor,
  readonly: readonlyProcessor,
  record: recordProcessor,
  set: setProcessor,
  string: stringProcessor,
  success: successProcessor,
  symbol: symbolProcessor,
  template_literal: templateLiteralProcessor,
  transform: transformProcessor,
  tuple: tupleProcessor,
  undefined: undefinedProcessor,
  union: unionProcessor,
  unknown: unknownProcessor,
  void: voidProcessor,
};
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      process(schema, ctx2);
    }
    const schemas = {};
    const external = {
      defs,
      registry: registry2,
      uri: params?.uri,
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      schemas[key] = finalize(ctx2, schema);
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment =
        ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs,
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  process(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}
__name(toJSONSchema, "toJSONSchema");

// node_modules/zod/v4/core/json-schema-generator.js
var JSONSchemaGenerator = class {
  static {
    __name(this, "JSONSchemaGenerator");
  }
  /** @deprecated Access via ctx instead */
  get metadataRegistry() {
    return this.ctx.metadataRegistry;
  }
  /** @deprecated Access via ctx instead */
  get target() {
    return this.ctx.target;
  }
  /** @deprecated Access via ctx instead */
  get unrepresentable() {
    return this.ctx.unrepresentable;
  }
  /** @deprecated Access via ctx instead */
  get override() {
    return this.ctx.override;
  }
  /** @deprecated Access via ctx instead */
  get io() {
    return this.ctx.io;
  }
  /** @deprecated Access via ctx instead */
  get counter() {
    return this.ctx.counter;
  }
  set counter(value) {
    this.ctx.counter = value;
  }
  /** @deprecated Access via ctx instead */
  get seen() {
    return this.ctx.seen;
  }
  constructor(params) {
    let normalizedTarget = params?.target ?? "draft-2020-12";
    if (normalizedTarget === "draft-4") {
      normalizedTarget = "draft-04";
    }
    if (normalizedTarget === "draft-7") {
      normalizedTarget = "draft-07";
    }
    this.ctx = initializeContext({
      processors: allProcessors,
      target: normalizedTarget,
      ...(params?.metadata && { metadata: params.metadata }),
      ...(params?.unrepresentable && {
        unrepresentable: params.unrepresentable,
      }),
      ...(params?.override && { override: params.override }),
      ...(params?.io && { io: params.io }),
    });
  }
  /**
   * Process a schema to prepare it for JSON Schema generation.
   * This must be called before emit().
   */
  process(schema, _params = { path: [], schemaPath: [] }) {
    return process(schema, this.ctx, _params);
  }
  /**
   * Emit the final JSON Schema after processing.
   * Must call process() first.
   */
  emit(schema, _params) {
    if (_params) {
      if (_params.cycles) {
        this.ctx.cycles = _params.cycles;
      }
      if (_params.reused) {
        this.ctx.reused = _params.reused;
      }
      if (_params.external) {
        this.ctx.external = _params.external;
      }
    }
    extractDefs(this.ctx, schema);
    const result = finalize(this.ctx, schema);
    const { "~standard": _, ...plainResult } = result;
    return plainResult;
  }
};

// node_modules/zod/v4/core/json-schema.js
var json_schema_exports = {};

// node_modules/zod/v4/classic/schemas.js
var schemas_exports2 = {};
__export(schemas_exports2, {
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodIntersection: () => ZodIntersection,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint3,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  codec: () => codec,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  float32: () => float32,
  float64: () => float64,
  function: () => _function,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  literal: () => literal,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  mac: () => mac2,
  map: () => map,
  meta: () => meta2,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  never: () => never,
  nonoptional: () => nonoptional,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  prefault: () => prefault,
  preprocess: () => preprocess,
  promise: () => promise,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  set: () => set,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  transform: () => transform,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor,
});

// node_modules/zod/v4/classic/checks.js
var checks_exports2 = {};
__export(checks_exports2, {
  endsWith: () => _endsWith,
  gt: () => _gt,
  gte: () => _gte,
  includes: () => _includes,
  length: () => _length,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  negative: () => _negative,
  nonnegative: () => _nonnegative,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  overwrite: () => _overwrite,
  positive: () => _positive,
  property: () => _property,
  regex: () => _regex,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  trim: () => _trim,
  uppercase: () => _uppercase,
});

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2,
});
var ZodISODateTime = /* @__PURE__ */ $constructor(
  "ZodISODateTime",
  (inst, def) => {
    $ZodISODateTime.init(inst, def);
    ZodStringFormat.init(inst, def);
  }
);
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
__name(datetime2, "datetime");
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
__name(date2, "date");
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
__name(time2, "time");
var ZodISODuration = /* @__PURE__ */ $constructor(
  "ZodISODuration",
  (inst, def) => {
    $ZodISODuration.init(inst, def);
    ZodStringFormat.init(inst, def);
  }
);
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}
__name(duration2, "duration");

// node_modules/zod/v4/classic/errors.js
var initializer2 = /* @__PURE__ */ __name((inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    addIssue: {
      value: /* @__PURE__ */ __name((issue2) => {
        inst.issues.push(issue2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }, "value"),
      // enumerable: false,
    },
    addIssues: {
      value: /* @__PURE__ */ __name((issues2) => {
        inst.issues.push(...issues2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }, "value"),
      // enumerable: false,
    },
    flatten: {
      value: /* @__PURE__ */ __name(
        (mapper) => flattenError(inst, mapper),
        "value"
      ),
      // enumerable: false,
    },
    format: {
      value: /* @__PURE__ */ __name(
        (mapper) => formatError(inst, mapper),
        "value"
      ),
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      },
      // enumerable: false,
    },
  });
}, "initializer");
var ZodError = /* @__PURE__ */ $constructor("ZodError", initializer2);
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, {
  Parent: Error,
});

// node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode2 = /* @__PURE__ */ _encode(ZodRealError);
var decode2 = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync2 = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync2 = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode2 = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode2 = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync2 = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync2 = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = /* @__PURE__ */ new Set();
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group)) {
    return;
  }
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          enumerable: true,
          value: bound,
          writable: true,
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key, {
          configurable: true,
          enumerable: true,
          value: v,
          writable: true,
        });
      },
    });
  }
}
__name(_installLazyMethods, "_installLazyMethods");
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output"),
    },
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) =>
    parse2(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) =>
    parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) =>
    safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode2(inst, data, params);
  inst.decode = (data, params) => decode2(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync2(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync2(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode2(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode2(inst, data, params);
  inst.safeEncodeAsync = async (data, params) =>
    safeEncodeAsync2(inst, data, params);
  inst.safeDecodeAsync = async (data, params) =>
    safeDecodeAsync2(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    and(arg) {
      return intersection(this, arg);
    },
    apply(fn) {
      return fn(this);
    },
    array() {
      return array(this);
    },
    brand() {
      return this;
    },
    catch(params) {
      return _catch2(this, params);
    },
    check(...chks) {
      const { def: def2 } = this;
      return this.clone(
        util_exports.mergeDefs(def2, {
          checks: [
            ...(def2.checks ?? []),
            ...chks.map((ch) =>
              typeof ch === "function"
                ? {
                    _zod: { check: ch, def: { check: "custom" }, onattach: [] },
                  }
                : ch
            ),
          ],
        }),
        { parent: true }
      );
    },
    clone(def2, params) {
      return clone(this, def2, params);
    },
    default(d) {
      return _default2(this, d);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    exactOptional() {
      return exactOptional(this);
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    isOptional() {
      return this.safeParse().success;
    },
    meta(...args) {
      if (args.length === 0) {
        return globalRegistry.get(this);
      }
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    optional() {
      return optional(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    overwrite(fn) {
      return this.check(_overwrite(fn));
    },
    pipe(target) {
      return pipe(this, target);
    },
    prefault(d) {
      return prefault(this, d);
    },
    readonly() {
      return readonly(this);
    },
    refine(check2, params) {
      return this.check(refine(check2, params));
    },
    register(reg, meta3) {
      reg.add(this, meta3);
      return this;
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    with(...chks) {
      return this.check(...chks);
    },
  });
  Object.defineProperty(inst, "description", {
    configurable: true,
    get() {
      return globalRegistry.get(inst)?.description;
    },
  });
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    stringProcessor(inst, ctx, json2, params);
  const { bag } = inst._zod;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    regex(...args) {
      return this.check(_regex(...args));
    },
    slugify() {
      return this.check(_slugify());
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    trim() {
      return this.check(_trim());
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
  });
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
__name(string2, "string");
var ZodStringFormat = /* @__PURE__ */ $constructor(
  "ZodStringFormat",
  (inst, def) => {
    $ZodStringFormat.init(inst, def);
    _ZodString.init(inst, def);
  }
);
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return _email(ZodEmail, params);
}
__name(email2, "email");
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function guid2(params) {
  return _guid(ZodGUID, params);
}
__name(guid2, "guid");
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function uuid2(params) {
  return _uuid(ZodUUID, params);
}
__name(uuid2, "uuid");
function uuidv4(params) {
  return _uuidv4(ZodUUID, params);
}
__name(uuidv4, "uuidv4");
function uuidv6(params) {
  return _uuidv6(ZodUUID, params);
}
__name(uuidv6, "uuidv6");
function uuidv7(params) {
  return _uuidv7(ZodUUID, params);
}
__name(uuidv7, "uuidv7");
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
__name(url, "url");
function httpUrl(params) {
  return _url(ZodURL, {
    hostname: regexes_exports.domain,
    protocol: regexes_exports.httpProtocol,
    ...util_exports.normalizeParams(params),
  });
}
__name(httpUrl, "httpUrl");
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function emoji2(params) {
  return _emoji2(ZodEmoji, params);
}
__name(emoji2, "emoji");
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function nanoid2(params) {
  return _nanoid(ZodNanoID, params);
}
__name(nanoid2, "nanoid");
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid3(params) {
  return _cuid(ZodCUID, params);
}
__name(cuid3, "cuid");
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid22(params) {
  return _cuid2(ZodCUID2, params);
}
__name(cuid22, "cuid2");
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ulid2(params) {
  return _ulid(ZodULID, params);
}
__name(ulid2, "ulid");
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function xid2(params) {
  return _xid(ZodXID, params);
}
__name(xid2, "xid");
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ksuid2(params) {
  return _ksuid(ZodKSUID, params);
}
__name(ksuid2, "ksuid");
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv42(params) {
  return _ipv4(ZodIPv4, params);
}
__name(ipv42, "ipv4");
var ZodMAC = /* @__PURE__ */ $constructor("ZodMAC", (inst, def) => {
  $ZodMAC.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function mac2(params) {
  return _mac(ZodMAC, params);
}
__name(mac2, "mac");
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv62(params) {
  return _ipv6(ZodIPv6, params);
}
__name(ipv62, "ipv6");
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv42(params) {
  return _cidrv4(ZodCIDRv4, params);
}
__name(cidrv42, "cidrv4");
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv62(params) {
  return _cidrv6(ZodCIDRv6, params);
}
__name(cidrv62, "cidrv6");
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base642(params) {
  return _base64(ZodBase64, params);
}
__name(base642, "base64");
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base64url2(params) {
  return _base64url(ZodBase64URL, params);
}
__name(base64url2, "base64url");
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function e1642(params) {
  return _e164(ZodE164, params);
}
__name(e1642, "e164");
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function jwt(params) {
  return _jwt(ZodJWT, params);
}
__name(jwt, "jwt");
var ZodCustomStringFormat = /* @__PURE__ */ $constructor(
  "ZodCustomStringFormat",
  (inst, def) => {
    $ZodCustomStringFormat.init(inst, def);
    ZodStringFormat.init(inst, def);
  }
);
function stringFormat(format3, fnOrRegex, _params = {}) {
  return _stringFormat(ZodCustomStringFormat, format3, fnOrRegex, _params);
}
__name(stringFormat, "stringFormat");
function hostname2(_params) {
  return _stringFormat(
    ZodCustomStringFormat,
    "hostname",
    regexes_exports.hostname,
    _params
  );
}
__name(hostname2, "hostname");
function hex2(_params) {
  return _stringFormat(
    ZodCustomStringFormat,
    "hex",
    regexes_exports.hex,
    _params
  );
}
__name(hex2, "hex");
function hash(alg, params) {
  const enc = params?.enc ?? "hex";
  const format3 = `${alg}_${enc}`;
  const regex = regexes_exports[format3];
  if (!regex) {
    throw new Error(`Unrecognized hash format: ${format3}`);
  }
  return _stringFormat(ZodCustomStringFormat, format3, regex, params);
}
__name(hash, "hash");
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    numberProcessor(inst, ctx, json2, params);
  _installLazyMethods(inst, "ZodNumber", {
    finite() {
      return this;
    },
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    safe(params) {
      return this.check(int(params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
  });
  const { bag } = inst._zod;
  inst.minValue =
    Math.max(
      bag.minimum ?? Number.NEGATIVE_INFINITY,
      bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY
    ) ?? null;
  inst.maxValue =
    Math.min(
      bag.maximum ?? Number.POSITIVE_INFINITY,
      bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY
    ) ?? null;
  inst.isInt =
    (bag.format ?? "").includes("int") ||
    Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
__name(number2, "number");
var ZodNumberFormat = /* @__PURE__ */ $constructor(
  "ZodNumberFormat",
  (inst, def) => {
    $ZodNumberFormat.init(inst, def);
    ZodNumber.init(inst, def);
  }
);
function int(params) {
  return _int(ZodNumberFormat, params);
}
__name(int, "int");
function float32(params) {
  return _float32(ZodNumberFormat, params);
}
__name(float32, "float32");
function float64(params) {
  return _float64(ZodNumberFormat, params);
}
__name(float64, "float64");
function int32(params) {
  return _int32(ZodNumberFormat, params);
}
__name(int32, "int32");
function uint32(params) {
  return _uint32(ZodNumberFormat, params);
}
__name(uint32, "uint32");
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    booleanProcessor(inst, ctx, json2, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
__name(boolean2, "boolean");
var ZodBigInt = /* @__PURE__ */ $constructor("ZodBigInt", (inst, def) => {
  $ZodBigInt.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    bigintProcessor(inst, ctx, json2, params);
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.positive = (params) => inst.check(_gt(0n, params));
  inst.negative = (params) => inst.check(_lt(0n, params));
  inst.nonpositive = (params) => inst.check(_lte(0n, params));
  inst.nonnegative = (params) => inst.check(_gte(0n, params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  const { bag } = inst._zod;
  inst.minValue = bag.minimum ?? null;
  inst.maxValue = bag.maximum ?? null;
  inst.format = bag.format ?? null;
});
function bigint3(params) {
  return _bigint(ZodBigInt, params);
}
__name(bigint3, "bigint");
var ZodBigIntFormat = /* @__PURE__ */ $constructor(
  "ZodBigIntFormat",
  (inst, def) => {
    $ZodBigIntFormat.init(inst, def);
    ZodBigInt.init(inst, def);
  }
);
function int64(params) {
  return _int64(ZodBigIntFormat, params);
}
__name(int64, "int64");
function uint64(params) {
  return _uint64(ZodBigIntFormat, params);
}
__name(uint64, "uint64");
var ZodSymbol = /* @__PURE__ */ $constructor("ZodSymbol", (inst, def) => {
  $ZodSymbol.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    symbolProcessor(inst, ctx, json2, params);
});
function symbol(params) {
  return _symbol(ZodSymbol, params);
}
__name(symbol, "symbol");
var ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
  $ZodUndefined.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    undefinedProcessor(inst, ctx, json2, params);
});
function _undefined3(params) {
  return _undefined2(ZodUndefined, params);
}
__name(_undefined3, "_undefined");
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    nullProcessor(inst, ctx, json2, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
__name(_null3, "_null");
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    anyProcessor(inst, ctx, json2, params);
});
function any() {
  return _any(ZodAny);
}
__name(any, "any");
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    unknownProcessor(inst, ctx, json2, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
__name(unknown, "unknown");
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    neverProcessor(inst, ctx, json2, params);
});
function never(params) {
  return _never(ZodNever, params);
}
__name(never, "never");
var ZodVoid = /* @__PURE__ */ $constructor("ZodVoid", (inst, def) => {
  $ZodVoid.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    voidProcessor(inst, ctx, json2, params);
});
function _void2(params) {
  return _void(ZodVoid, params);
}
__name(_void2, "_void");
var ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
  $ZodDate.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    dateProcessor(inst, ctx, json2, params);
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  const c = inst._zod.bag;
  inst.minDate = c.minimum ? new Date(c.minimum) : null;
  inst.maxDate = c.maximum ? new Date(c.maximum) : null;
});
function date3(params) {
  return _date(ZodDate, params);
}
__name(date3, "date");
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    arrayProcessor(inst, ctx, json2, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    length(n, params) {
      return this.check(_length(n, params));
    },
    max(n, params) {
      return this.check(_maxLength(n, params));
    },
    min(n, params) {
      return this.check(_minLength(n, params));
    },
    nonempty(params) {
      return this.check(_minLength(1, params));
    },
    unwrap() {
      return this.element;
    },
  });
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
__name(array, "array");
function keyof(schema) {
  const { shape } = schema._zod.def;
  return _enum2(Object.keys(shape));
}
__name(keyof, "keyof");
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    objectProcessor(inst, ctx, json2, params);
  util_exports.defineLazy(inst, "shape", () => def.shape);
  _installLazyMethods(inst, "ZodObject", {
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    extend(incoming) {
      return util_exports.extend(this, incoming);
    },
    keyof() {
      return _enum2(Object.keys(this._zod.def.shape));
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    merge(other) {
      return util_exports.merge(this, other);
    },
    omit(mask) {
      return util_exports.omit(this, mask);
    },
    partial(...args) {
      return util_exports.partial(ZodOptional, this, args[0]);
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    pick(mask) {
      return util_exports.pick(this, mask);
    },
    required(...args) {
      return util_exports.required(ZodNonOptional, this, args[0]);
    },
    safeExtend(incoming) {
      return util_exports.safeExtend(this, incoming);
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: void 0 });
    },
  });
});
function object(shape, params) {
  const def = {
    shape: shape ?? {},
    type: "object",
    ...util_exports.normalizeParams(params),
  };
  return new ZodObject(def);
}
__name(object, "object");
function strictObject(shape, params) {
  return new ZodObject({
    catchall: never(),
    shape,
    type: "object",
    ...util_exports.normalizeParams(params),
  });
}
__name(strictObject, "strictObject");
function looseObject(shape, params) {
  return new ZodObject({
    catchall: unknown(),
    shape,
    type: "object",
    ...util_exports.normalizeParams(params),
  });
}
__name(looseObject, "looseObject");
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    options,
    type: "union",
    ...util_exports.normalizeParams(params),
  });
}
__name(union, "union");
var ZodXor = /* @__PURE__ */ $constructor("ZodXor", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodXor.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function xor(options, params) {
  return new ZodXor({
    inclusive: false,
    options,
    type: "union",
    ...util_exports.normalizeParams(params),
  });
}
__name(xor, "xor");
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor(
  "ZodDiscriminatedUnion",
  (inst, def) => {
    ZodUnion.init(inst, def);
    $ZodDiscriminatedUnion.init(inst, def);
  }
);
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    discriminator,
    options,
    type: "union",
    ...util_exports.normalizeParams(params),
  });
}
__name(discriminatedUnion, "discriminatedUnion");
var ZodIntersection = /* @__PURE__ */ $constructor(
  "ZodIntersection",
  (inst, def) => {
    $ZodIntersection.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) =>
      intersectionProcessor(inst, ctx, json2, params);
  }
);
function intersection(left, right) {
  return new ZodIntersection({
    left,
    right,
    type: "intersection",
  });
}
__name(intersection, "intersection");
var ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
  $ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    tupleProcessor(inst, ctx, json2, params);
  inst.rest = (rest) =>
    inst.clone({
      ...inst._zod.def,
      rest,
    });
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    items,
    rest,
    type: "tuple",
    ...util_exports.normalizeParams(params),
  });
}
__name(tuple, "tuple");
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    recordProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      keyType: string2(),
      type: "record",
      valueType: keyType,
      ...util_exports.normalizeParams(valueType),
    });
  }
  return new ZodRecord({
    keyType,
    type: "record",
    valueType,
    ...util_exports.normalizeParams(params),
  });
}
__name(record, "record");
function partialRecord(keyType, valueType, params) {
  const k = clone(keyType);
  k._zod.values = void 0;
  return new ZodRecord({
    keyType: k,
    type: "record",
    valueType,
    ...util_exports.normalizeParams(params),
  });
}
__name(partialRecord, "partialRecord");
function looseRecord(keyType, valueType, params) {
  return new ZodRecord({
    keyType,
    mode: "loose",
    type: "record",
    valueType,
    ...util_exports.normalizeParams(params),
  });
}
__name(looseRecord, "looseRecord");
var ZodMap = /* @__PURE__ */ $constructor("ZodMap", (inst, def) => {
  $ZodMap.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    mapProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function map(keyType, valueType, params) {
  return new ZodMap({
    keyType,
    type: "map",
    valueType,
    ...util_exports.normalizeParams(params),
  });
}
__name(map, "map");
var ZodSet = /* @__PURE__ */ $constructor("ZodSet", (inst, def) => {
  $ZodSet.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    setProcessor(inst, ctx, json2, params);
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function set(valueType, params) {
  return new ZodSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params),
  });
}
__name(set, "set");
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    enumProcessor(inst, ctx, json2, params);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else {
        throw new Error(`Key ${value} not found in enum`);
      }
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries,
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else {
        throw new Error(`Key ${value} not found in enum`);
      }
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries,
    });
  };
});
function _enum2(values, params) {
  const entries = Array.isArray(values)
    ? Object.fromEntries(values.map((v) => [v, v]))
    : values;
  return new ZodEnum({
    entries,
    type: "enum",
    ...util_exports.normalizeParams(params),
  });
}
__name(_enum2, "_enum");
function nativeEnum(entries, params) {
  return new ZodEnum({
    entries,
    type: "enum",
    ...util_exports.normalizeParams(params),
  });
}
__name(nativeEnum, "nativeEnum");
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    literalProcessor(inst, ctx, json2, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error(
          "This schema contains multiple valid literal values. Use `.values` instead."
        );
      }
      return def.values[0];
    },
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params),
  });
}
__name(literal, "literal");
var ZodFile = /* @__PURE__ */ $constructor("ZodFile", (inst, def) => {
  $ZodFile.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    fileProcessor(inst, ctx, json2, params);
  inst.min = (size, params) => inst.check(_minSize(size, params));
  inst.max = (size, params) => inst.check(_maxSize(size, params));
  inst.mime = (types, params) =>
    inst.check(_mime(Array.isArray(types) ? types : [types], params));
});
function file(params) {
  return _file(ZodFile, params);
}
__name(file, "file");
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    transformProcessor(inst, ctx, json2, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal) {
          _issue.continue = false;
        }
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    transform: fn,
    type: "transform",
  });
}
__name(transform, "transform");
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    innerType,
    type: "optional",
  });
}
__name(optional, "optional");
var ZodExactOptional = /* @__PURE__ */ $constructor(
  "ZodExactOptional",
  (inst, def) => {
    $ZodExactOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) =>
      optionalProcessor(inst, ctx, json2, params);
    inst.unwrap = () => inst._zod.def.innerType;
  }
);
function exactOptional(innerType) {
  return new ZodExactOptional({
    innerType,
    type: "optional",
  });
}
__name(exactOptional, "exactOptional");
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    nullableProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    innerType,
    type: "nullable",
  });
}
__name(nullable, "nullable");
function nullish2(innerType) {
  return optional(nullable(innerType));
}
__name(nullish2, "nullish");
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    defaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default2(innerType, defaultValue) {
  return new ZodDefault({
    get defaultValue() {
      return typeof defaultValue === "function"
        ? defaultValue()
        : util_exports.shallowClone(defaultValue);
    },
    innerType,
    type: "default",
  });
}
__name(_default2, "_default");
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    prefaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    get defaultValue() {
      return typeof defaultValue === "function"
        ? defaultValue()
        : util_exports.shallowClone(defaultValue);
    },
    innerType,
    type: "prefault",
  });
}
__name(prefault, "prefault");
var ZodNonOptional = /* @__PURE__ */ $constructor(
  "ZodNonOptional",
  (inst, def) => {
    $ZodNonOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) =>
      nonoptionalProcessor(inst, ctx, json2, params);
    inst.unwrap = () => inst._zod.def.innerType;
  }
);
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    innerType,
    type: "nonoptional",
    ...util_exports.normalizeParams(params),
  });
}
__name(nonoptional, "nonoptional");
var ZodSuccess = /* @__PURE__ */ $constructor("ZodSuccess", (inst, def) => {
  $ZodSuccess.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    successProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function success(innerType) {
  return new ZodSuccess({
    innerType,
    type: "success",
  });
}
__name(success, "success");
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    catchProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch2(innerType, catchValue) {
  return new ZodCatch({
    catchValue:
      typeof catchValue === "function" ? catchValue : () => catchValue,
    innerType,
    type: "catch",
  });
}
__name(_catch2, "_catch");
var ZodNaN = /* @__PURE__ */ $constructor("ZodNaN", (inst, def) => {
  $ZodNaN.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    nanProcessor(inst, ctx, json2, params);
});
function nan(params) {
  return _nan(ZodNaN, params);
}
__name(nan, "nan");
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    pipeProcessor(inst, ctx, json2, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out,
    // ...util.normalizeParams(params),
  });
}
__name(pipe, "pipe");
var ZodCodec = /* @__PURE__ */ $constructor("ZodCodec", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodCodec.init(inst, def);
});
function codec(in_, out, params) {
  return new ZodCodec({
    in: in_,
    out,
    reverseTransform: params.encode,
    transform: params.decode,
    type: "pipe",
  });
}
__name(codec, "codec");
function invertCodec(codec2) {
  const { def } = codec2._zod;
  return new ZodCodec({
    in: def.out,
    out: def.in,
    reverseTransform: def.transform,
    transform: def.reverseTransform,
    type: "pipe",
  });
}
__name(invertCodec, "invertCodec");
var ZodPreprocess = /* @__PURE__ */ $constructor(
  "ZodPreprocess",
  (inst, def) => {
    ZodPipe.init(inst, def);
    $ZodPreprocess.init(inst, def);
  }
);
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    readonlyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    innerType,
    type: "readonly",
  });
}
__name(readonly, "readonly");
var ZodTemplateLiteral = /* @__PURE__ */ $constructor(
  "ZodTemplateLiteral",
  (inst, def) => {
    $ZodTemplateLiteral.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) =>
      templateLiteralProcessor(inst, ctx, json2, params);
  }
);
function templateLiteral(parts, params) {
  return new ZodTemplateLiteral({
    parts,
    type: "template_literal",
    ...util_exports.normalizeParams(params),
  });
}
__name(templateLiteral, "templateLiteral");
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    lazyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    getter,
    type: "lazy",
  });
}
__name(lazy, "lazy");
var ZodPromise = /* @__PURE__ */ $constructor("ZodPromise", (inst, def) => {
  $ZodPromise.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    promiseProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function promise(innerType) {
  return new ZodPromise({
    innerType,
    type: "promise",
  });
}
__name(promise, "promise");
var ZodFunction = /* @__PURE__ */ $constructor("ZodFunction", (inst, def) => {
  $ZodFunction.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    functionProcessor(inst, ctx, json2, params);
});
function _function(params) {
  return new ZodFunction({
    input: Array.isArray(params?.input)
      ? tuple(params?.input)
      : (params?.input ?? array(unknown())),
    output: params?.output ?? unknown(),
    type: "function",
  });
}
__name(_function, "_function");
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) =>
    customProcessor(inst, ctx, json2, params);
});
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom",
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
__name(check, "check");
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
__name(custom, "custom");
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
__name(refine, "refine");
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
__name(superRefine, "superRefine");
var { describe: describe2 } = core_exports2;
var { meta: meta2 } = core_exports2;
function _instanceof(cls, params = {}) {
  const inst = new ZodCustom({
    abort: true,
    check: "custom",
    fn: /* @__PURE__ */ __name((data) => data instanceof cls, "fn"),
    type: "custom",
    ...util_exports.normalizeParams(params),
  });
  inst._zod.bag.Class = cls;
  inst._zod.check = (payload) => {
    if (!(payload.value instanceof cls)) {
      payload.issues.push({
        code: "invalid_type",
        expected: cls.name,
        input: payload.value,
        inst,
        path: [...(inst._zod.def.path ?? [])],
      });
    }
  };
  return inst;
}
__name(_instanceof, "_instanceof");
var stringbool = /* @__PURE__ */ __name(
  (...args) =>
    _stringbool(
      {
        Boolean: ZodBoolean,
        Codec: ZodCodec,
        String: ZodString,
      },
      ...args
    ),
  "stringbool"
);
function json(params) {
  const jsonSchema = lazy(() =>
    union([
      string2(params),
      number2(),
      boolean2(),
      _null3(),
      array(jsonSchema),
      record(string2(), jsonSchema),
    ])
  );
  return jsonSchema;
}
__name(json, "json");
function preprocess(fn, schema) {
  return new ZodPreprocess({
    in: transform(fn),
    out: schema,
    type: "pipe",
  });
}
__name(preprocess, "preprocess");

// node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  custom: "custom",
  invalid_element: "invalid_element",
  invalid_format: "invalid_format",
  invalid_key: "invalid_key",
  invalid_type: "invalid_type",
  invalid_union: "invalid_union",
  invalid_value: "invalid_value",
  not_multiple_of: "not_multiple_of",
  too_big: "too_big",
  too_small: "too_small",
  unrecognized_keys: "unrecognized_keys",
};
function setErrorMap(map2) {
  config2({
    customError: map2,
  });
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return config2().customError;
}
__name(getErrorMap, "getErrorMap");
var ZodFirstPartyTypeKind;
/* @__PURE__ */ (function (ZodFirstPartyTypeKind2) {})(
  ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {})
);

// node_modules/zod/v4/classic/from-json-schema.js
var z = {
  ...schemas_exports2,
  ...checks_exports2,
  iso: iso_exports,
};
var RECOGNIZED_KEYS = /* @__PURE__ */ new Set([
  // Schema identification
  "$schema",
  "$ref",
  "$defs",
  "definitions",
  // Core schema keywords
  "$id",
  "id",
  "$comment",
  "$anchor",
  "$vocabulary",
  "$dynamicRef",
  "$dynamicAnchor",
  // Type
  "type",
  "enum",
  "const",
  // Composition
  "anyOf",
  "oneOf",
  "allOf",
  "not",
  // Object
  "properties",
  "required",
  "additionalProperties",
  "patternProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  // Array
  "items",
  "prefixItems",
  "additionalItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "minContains",
  "maxContains",
  // String
  "minLength",
  "maxLength",
  "pattern",
  "format",
  // Number
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  // Already handled metadata
  "description",
  "default",
  // Content
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
  // Unsupported (error-throwing)
  "unevaluatedItems",
  "unevaluatedProperties",
  "if",
  "then",
  "else",
  "dependentSchemas",
  "dependentRequired",
  // OpenAPI
  "nullable",
  "readOnly",
]);
function detectVersion(schema, defaultTarget) {
  const { $schema } = schema;
  if ($schema === "https://json-schema.org/draft/2020-12/schema") {
    return "draft-2020-12";
  }
  if ($schema === "http://json-schema.org/draft-07/schema#") {
    return "draft-7";
  }
  if ($schema === "http://json-schema.org/draft-04/schema#") {
    return "draft-4";
  }
  return defaultTarget ?? "draft-2020-12";
}
__name(detectVersion, "detectVersion");
function resolveRef(ref2, ctx) {
  if (!ref2.startsWith("#")) {
    throw new Error(
      "External $ref is not supported, only local refs (#/...) are allowed"
    );
  }
  const path = ref2.slice(1).split("/").filter(Boolean);
  if (path.length === 0) {
    return ctx.rootSchema;
  }
  const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";
  if (path[0] === defsKey) {
    const key = path[1];
    if (!key || !ctx.defs[key]) {
      throw new Error(`Reference not found: ${ref2}`);
    }
    return ctx.defs[key];
  }
  throw new Error(`Reference not found: ${ref2}`);
}
__name(resolveRef, "resolveRef");
function convertBaseSchema(schema, ctx) {
  if (schema.not !== void 0) {
    if (
      typeof schema.not === "object" &&
      Object.keys(schema.not).length === 0
    ) {
      return z.never();
    }
    throw new Error(
      "not is not supported in Zod (except { not: {} } for never)"
    );
  }
  if (schema.unevaluatedItems !== void 0) {
    throw new Error("unevaluatedItems is not supported");
  }
  if (schema.unevaluatedProperties !== void 0) {
    throw new Error("unevaluatedProperties is not supported");
  }
  if (
    schema.if !== void 0 ||
    schema.then !== void 0 ||
    schema.else !== void 0
  ) {
    throw new Error("Conditional schemas (if/then/else) are not supported");
  }
  if (
    schema.dependentSchemas !== void 0 ||
    schema.dependentRequired !== void 0
  ) {
    throw new Error("dependentSchemas and dependentRequired are not supported");
  }
  if (schema.$ref) {
    const refPath = schema.$ref;
    if (ctx.refs.has(refPath)) {
      return ctx.refs.get(refPath);
    }
    if (ctx.processing.has(refPath)) {
      return z.lazy(() => {
        if (!ctx.refs.has(refPath)) {
          throw new Error(`Circular reference not resolved: ${refPath}`);
        }
        return ctx.refs.get(refPath);
      });
    }
    ctx.processing.add(refPath);
    const resolved = resolveRef(refPath, ctx);
    const zodSchema2 = convertSchema(resolved, ctx);
    ctx.refs.set(refPath, zodSchema2);
    ctx.processing.delete(refPath);
    return zodSchema2;
  }
  if (schema.enum !== void 0) {
    const enumValues = schema.enum;
    if (
      ctx.version === "openapi-3.0" &&
      schema.nullable === true &&
      enumValues.length === 1 &&
      enumValues[0] === null
    ) {
      return z.null();
    }
    if (enumValues.length === 0) {
      return z.never();
    }
    if (enumValues.length === 1) {
      return z.literal(enumValues[0]);
    }
    if (enumValues.every((v) => typeof v === "string")) {
      return z.enum(enumValues);
    }
    const literalSchemas = enumValues.map((v) => z.literal(v));
    if (literalSchemas.length < 2) {
      return literalSchemas[0];
    }
    return z.union([
      literalSchemas[0],
      literalSchemas[1],
      ...literalSchemas.slice(2),
    ]);
  }
  if (schema.const !== void 0) {
    return z.literal(schema.const);
  }
  const { type } = schema;
  if (Array.isArray(type)) {
    const typeSchemas = type.map((t) => {
      const typeSchema = { ...schema, type: t };
      return convertBaseSchema(typeSchema, ctx);
    });
    if (typeSchemas.length === 0) {
      return z.never();
    }
    if (typeSchemas.length === 1) {
      return typeSchemas[0];
    }
    return z.union(typeSchemas);
  }
  if (!type) {
    return z.any();
  }
  let zodSchema;
  switch (type) {
    case "string": {
      let stringSchema = z.string();
      if (schema.format) {
        const { format: format3 } = schema;
        if (format3 === "email") {
          stringSchema = stringSchema.check(z.email());
        } else if (format3 === "uri" || format3 === "uri-reference") {
          stringSchema = stringSchema.check(z.url());
        } else if (format3 === "uuid" || format3 === "guid") {
          stringSchema = stringSchema.check(z.uuid());
        } else if (format3 === "date-time") {
          stringSchema = stringSchema.check(z.iso.datetime());
        } else if (format3 === "date") {
          stringSchema = stringSchema.check(z.iso.date());
        } else if (format3 === "time") {
          stringSchema = stringSchema.check(z.iso.time());
        } else if (format3 === "duration") {
          stringSchema = stringSchema.check(z.iso.duration());
        } else if (format3 === "ipv4") {
          stringSchema = stringSchema.check(z.ipv4());
        } else if (format3 === "ipv6") {
          stringSchema = stringSchema.check(z.ipv6());
        } else if (format3 === "mac") {
          stringSchema = stringSchema.check(z.mac());
        } else if (format3 === "cidr") {
          stringSchema = stringSchema.check(z.cidrv4());
        } else if (format3 === "cidr-v6") {
          stringSchema = stringSchema.check(z.cidrv6());
        } else if (format3 === "base64") {
          stringSchema = stringSchema.check(z.base64());
        } else if (format3 === "base64url") {
          stringSchema = stringSchema.check(z.base64url());
        } else if (format3 === "e164") {
          stringSchema = stringSchema.check(z.e164());
        } else if (format3 === "jwt") {
          stringSchema = stringSchema.check(z.jwt());
        } else if (format3 === "emoji") {
          stringSchema = stringSchema.check(z.emoji());
        } else if (format3 === "nanoid") {
          stringSchema = stringSchema.check(z.nanoid());
        } else if (format3 === "cuid") {
          stringSchema = stringSchema.check(z.cuid());
        } else if (format3 === "cuid2") {
          stringSchema = stringSchema.check(z.cuid2());
        } else if (format3 === "ulid") {
          stringSchema = stringSchema.check(z.ulid());
        } else if (format3 === "xid") {
          stringSchema = stringSchema.check(z.xid());
        } else if (format3 === "ksuid") {
          stringSchema = stringSchema.check(z.ksuid());
        }
      }
      if (typeof schema.minLength === "number") {
        stringSchema = stringSchema.min(schema.minLength);
      }
      if (typeof schema.maxLength === "number") {
        stringSchema = stringSchema.max(schema.maxLength);
      }
      if (schema.pattern) {
        stringSchema = stringSchema.regex(new RegExp(schema.pattern));
      }
      zodSchema = stringSchema;
      break;
    }
    case "number":
    case "integer": {
      let numberSchema = type === "integer" ? z.number().int() : z.number();
      if (typeof schema.minimum === "number") {
        numberSchema = numberSchema.min(schema.minimum);
      }
      if (typeof schema.maximum === "number") {
        numberSchema = numberSchema.max(schema.maximum);
      }
      if (typeof schema.exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(schema.exclusiveMinimum);
      } else if (
        schema.exclusiveMinimum === true &&
        typeof schema.minimum === "number"
      ) {
        numberSchema = numberSchema.gt(schema.minimum);
      }
      if (typeof schema.exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(schema.exclusiveMaximum);
      } else if (
        schema.exclusiveMaximum === true &&
        typeof schema.maximum === "number"
      ) {
        numberSchema = numberSchema.lt(schema.maximum);
      }
      if (typeof schema.multipleOf === "number") {
        numberSchema = numberSchema.multipleOf(schema.multipleOf);
      }
      zodSchema = numberSchema;
      break;
    }
    case "boolean": {
      zodSchema = z.boolean();
      break;
    }
    case "null": {
      zodSchema = z.null();
      break;
    }
    case "object": {
      const shape = {};
      const properties = schema.properties || {};
      const requiredSet = new Set(schema.required || []);
      for (const [key, propSchema] of Object.entries(properties)) {
        const propZodSchema = convertSchema(propSchema, ctx);
        shape[key] = requiredSet.has(key)
          ? propZodSchema
          : propZodSchema.optional();
      }
      if (schema.propertyNames) {
        const keySchema = convertSchema(schema.propertyNames, ctx);
        const valueSchema =
          schema.additionalProperties &&
          typeof schema.additionalProperties === "object"
            ? convertSchema(schema.additionalProperties, ctx)
            : z.any();
        if (Object.keys(shape).length === 0) {
          zodSchema = z.record(keySchema, valueSchema);
          break;
        }
        const objectSchema2 = z.object(shape).passthrough();
        const recordSchema = z.looseRecord(keySchema, valueSchema);
        zodSchema = z.intersection(objectSchema2, recordSchema);
        break;
      }
      if (schema.patternProperties) {
        const patternProps = schema.patternProperties;
        const patternKeys = Object.keys(patternProps);
        const looseRecords = [];
        for (const pattern of patternKeys) {
          const patternValue = convertSchema(patternProps[pattern], ctx);
          const keySchema = z.string().regex(new RegExp(pattern));
          looseRecords.push(z.looseRecord(keySchema, patternValue));
        }
        const schemasToIntersect = [];
        if (Object.keys(shape).length > 0) {
          schemasToIntersect.push(z.object(shape).passthrough());
        }
        schemasToIntersect.push(...looseRecords);
        if (schemasToIntersect.length === 0) {
          zodSchema = z.object({}).passthrough();
        } else if (schemasToIntersect.length === 1) {
          zodSchema = schemasToIntersect[0];
        } else {
          let result = z.intersection(
            schemasToIntersect[0],
            schemasToIntersect[1]
          );
          for (let i = 2; i < schemasToIntersect.length; i++) {
            result = z.intersection(result, schemasToIntersect[i]);
          }
          zodSchema = result;
        }
        break;
      }
      const objectSchema = z.object(shape);
      if (schema.additionalProperties === false) {
        zodSchema = objectSchema.strict();
      } else if (typeof schema.additionalProperties === "object") {
        zodSchema = objectSchema.catchall(
          convertSchema(schema.additionalProperties, ctx)
        );
      } else {
        zodSchema = objectSchema.passthrough();
      }
      break;
    }
    case "array": {
      const { prefixItems } = schema;
      const { items } = schema;
      if (prefixItems && Array.isArray(prefixItems)) {
        const tupleItems = prefixItems.map((item) => convertSchema(item, ctx));
        const rest =
          items && typeof items === "object" && !Array.isArray(items)
            ? convertSchema(items, ctx)
            : void 0;
        if (rest) {
          zodSchema = z.tuple(tupleItems).rest(rest);
        } else {
          zodSchema = z.tuple(tupleItems);
        }
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (Array.isArray(items)) {
        const tupleItems = items.map((item) => convertSchema(item, ctx));
        const rest =
          schema.additionalItems && typeof schema.additionalItems === "object"
            ? convertSchema(schema.additionalItems, ctx)
            : void 0;
        if (rest) {
          zodSchema = z.tuple(tupleItems).rest(rest);
        } else {
          zodSchema = z.tuple(tupleItems);
        }
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (items !== void 0) {
        const element = convertSchema(items, ctx);
        let arraySchema = z.array(element);
        if (typeof schema.minItems === "number") {
          arraySchema = arraySchema.min(schema.minItems);
        }
        if (typeof schema.maxItems === "number") {
          arraySchema = arraySchema.max(schema.maxItems);
        }
        zodSchema = arraySchema;
      } else {
        zodSchema = z.array(z.any());
      }
      break;
    }
    default: {
      throw new Error(`Unsupported type: ${type}`);
    }
  }
  return zodSchema;
}
__name(convertBaseSchema, "convertBaseSchema");
function convertSchema(schema, ctx) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let baseSchema = convertBaseSchema(schema, ctx);
  const hasExplicitType =
    schema.type || schema.enum !== void 0 || schema.const !== void 0;
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const options = schema.anyOf.map((s) => convertSchema(s, ctx));
    const anyOfUnion = z.union(options);
    baseSchema = hasExplicitType
      ? z.intersection(baseSchema, anyOfUnion)
      : anyOfUnion;
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const options = schema.oneOf.map((s) => convertSchema(s, ctx));
    const oneOfUnion = z.xor(options);
    baseSchema = hasExplicitType
      ? z.intersection(baseSchema, oneOfUnion)
      : oneOfUnion;
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    if (schema.allOf.length === 0) {
      baseSchema = hasExplicitType ? baseSchema : z.any();
    } else {
      let result = hasExplicitType
        ? baseSchema
        : convertSchema(schema.allOf[0], ctx);
      const startIdx = hasExplicitType ? 0 : 1;
      for (let i = startIdx; i < schema.allOf.length; i++) {
        result = z.intersection(result, convertSchema(schema.allOf[i], ctx));
      }
      baseSchema = result;
    }
  }
  if (schema.nullable === true && ctx.version === "openapi-3.0") {
    baseSchema = z.nullable(baseSchema);
  }
  if (schema.readOnly === true) {
    baseSchema = z.readonly(baseSchema);
  }
  if (schema.default !== void 0) {
    baseSchema = baseSchema.default(schema.default);
  }
  const extraMeta = {};
  const coreMetadataKeys = [
    "$id",
    "id",
    "$comment",
    "$anchor",
    "$vocabulary",
    "$dynamicRef",
    "$dynamicAnchor",
  ];
  for (const key of coreMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  const contentMetadataKeys = [
    "contentEncoding",
    "contentMediaType",
    "contentSchema",
  ];
  for (const key of contentMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  for (const key of Object.keys(schema)) {
    if (!RECOGNIZED_KEYS.has(key)) {
      extraMeta[key] = schema[key];
    }
  }
  if (Object.keys(extraMeta).length > 0) {
    ctx.registry.add(baseSchema, extraMeta);
  }
  if (schema.description) {
    baseSchema = baseSchema.describe(schema.description);
  }
  return baseSchema;
}
__name(convertSchema, "convertSchema");
function fromJSONSchema(schema, params) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let normalized;
  try {
    normalized = JSON.parse(JSON.stringify(schema));
  } catch {
    throw new Error(
      "fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas"
    );
  }
  const version3 = detectVersion(normalized, params?.defaultTarget);
  const defs = normalized.$defs || normalized.definitions || {};
  const ctx = {
    defs,
    processing: /* @__PURE__ */ new Set(),
    refs: /* @__PURE__ */ new Map(),
    registry: params?.registry ?? globalRegistry,
    rootSchema: normalized,
    version: version3,
  };
  return convertSchema(normalized, ctx);
}
__name(fromJSONSchema, "fromJSONSchema");

// node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint4,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3,
});
function string3(params) {
  return _coercedString(ZodString, params);
}
__name(string3, "string");
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
__name(number3, "number");
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
__name(boolean3, "boolean");
function bigint4(params) {
  return _coercedBigint(ZodBigInt, params);
}
__name(bigint4, "bigint");
function date4(params) {
  return _coercedDate(ZodDate, params);
}
__name(date4, "date");

// node_modules/zod/v4/classic/external.js
config2(en_default());

// src/server/geocode.ts
var OVERPASS_URL = "https://overpass-api.de/api/interpreter";
var USER_AGENT = "hcc-parking-infringement/1.0 (hamilton parking ticker)";
var HAMILTON_BBOX = {
  east: 175.35,
  north: -37.68,
  south: -37.9,
  west: 175.2,
};
var HAMILTON_CENTER = { lat: -37.787, lon: 175.279 };
var OVERPASS_BATCH_SIZE = 15;
var OVERPASS_BATCH_DELAY_MS = 400;
var STREET_SUFFIX_PATTERN =
  /\s+(?<suffix>street|road|avenue|drive|place|lane|court|crescent|terrace|parade)$/u;
var overpassElementSchema = external_exports.object({
  geometry: external_exports
    .array(
      external_exports.object({
        lat: external_exports.number(),
        lon: external_exports.number(),
      })
    )
    .optional(),
  tags: external_exports
    .object({
      name: external_exports.string().optional(),
    })
    .optional(),
});
var overpassResponseSchema = external_exports.object({
  elements: external_exports.array(overpassElementSchema),
});
var sleep = /* @__PURE__ */ __name(async (ms) => {
  await delay(ms);
}, "sleep");
var normalizeStreetName = /* @__PURE__ */ __name(
  (value) =>
    value.toLowerCase().replaceAll(".", "").replaceAll(/\s+/gu, " ").trim(),
  "normalizeStreetName"
);
var expandStreetAbbreviations = /* @__PURE__ */ __name(
  (value) =>
    normalizeStreetName(value)
      .replaceAll(/\bst\b/gu, "street")
      .replaceAll(/\brd\b/gu, "road")
      .replaceAll(/\bave\b/gu, "avenue")
      .replaceAll(/\bdr\b/gu, "drive")
      .replaceAll(/\bpl\b/gu, "place")
      .replaceAll(/\bln\b/gu, "lane")
      .replaceAll(/\bct\b/gu, "court")
      .replaceAll(/\bcre\b/gu, "crescent")
      .replaceAll(/\bterr?\b/gu, "terrace")
      .replaceAll(/\bpde\b/gu, "parade"),
  "expandStreetAbbreviations"
);
var streetNameMatches = /* @__PURE__ */ __name((osmName, street) => {
  const osm = expandStreetAbbreviations(osmName);
  const target = expandStreetAbbreviations(street);
  if (osm === target) {
    return true;
  }
  if (osm.includes(target) || target.includes(osm)) {
    return true;
  }
  const osmCore = osm.replace(STREET_SUFFIX_PATTERN, "");
  const targetCore = target.replace(STREET_SUFFIX_PATTERN, "");
  return osmCore === targetCore;
}, "streetNameMatches");
var overpassNamePattern = /* @__PURE__ */ __name((street) => {
  const expanded = expandStreetAbbreviations(street);
  const escaped = expanded.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return `^${escaped}$`;
}, "overpassNamePattern");
var isRealRoadGeometry = /* @__PURE__ */ __name(
  (geometry) => geometry.some((line) => line.length >= 3),
  "isRealRoadGeometry"
);
var centroidFromGeometry = /* @__PURE__ */ __name((geometry) => {
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  for (const line of geometry) {
    for (const [lat, lon] of line) {
      sumLat += lat;
      sumLon += lon;
      count += 1;
    }
  }
  if (count === 0) {
    return HAMILTON_CENTER;
  }
  return { lat: sumLat / count, lon: sumLon / count };
}, "centroidFromGeometry");
var overpassBatchRoadGeometry = /* @__PURE__ */ __name(async (streets) => {
  if (streets.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const bbox = `${HAMILTON_BBOX.south},${HAMILTON_BBOX.west},${HAMILTON_BBOX.north},${HAMILTON_BBOX.east}`;
  const wayQueries = streets
    .map(
      (street) =>
        `  way["highway"]["name"~"${overpassNamePattern(street)}",i](${bbox});`
    )
    .join("\n");
  const query = `
[out:json][timeout:60];
(
${wayQueries}
);
out geom;
`.trim();
  const response = await fetch(OVERPASS_URL, {
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    method: "POST",
  });
  if (!response.ok) {
    return /* @__PURE__ */ new Map();
  }
  const parsed = overpassResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return /* @__PURE__ */ new Map();
  }
  const results = /* @__PURE__ */ new Map();
  for (const element of parsed.data.elements) {
    const name = element.tags?.name;
    if (
      element.geometry === void 0 ||
      element.geometry.length < 3 ||
      name === void 0 ||
      name === ""
    ) {
      continue;
    }
    const line = element.geometry.map((point) => [point.lat, point.lon]);
    for (const street of streets) {
      if (!streetNameMatches(name, street)) {
        continue;
      }
      const existing = results.get(street) ?? [];
      existing.push(line);
      results.set(street, existing);
      break;
    }
  }
  return results;
}, "overpassBatchRoadGeometry");
var processGeocodeBatch = /* @__PURE__ */ __name(async (env2, batch) => {
  const store = getParkingStore(env2);
  const geometries = await overpassBatchRoadGeometry(
    batch.map((location) => location.street)
  );
  const outcomes = await Promise.all(
    batch.map(async (location) => {
      const geometry = geometries.get(location.street);
      if (geometry !== void 0 && isRealRoadGeometry(geometry)) {
        const centroid = centroidFromGeometry(geometry);
        const suburbLabel =
          location.suburb !== null && location.suburb !== ""
            ? `, ${location.suburb}`
            : "";
        await store.saveLocationCache({
          displayName: `${location.street}${suburbLabel}, Hamilton`,
          geometry,
          lat: centroid.lat,
          lon: centroid.lon,
          street: location.street,
          suburb: location.suburb,
          town: location.town,
        });
        return "geocoded";
      }
      await store.markGeocodeFailed(
        location.street,
        location.suburb,
        location.town
      );
      return "failed";
    })
  );
  return {
    failed: outcomes.filter((outcome) => outcome === "failed").length,
    geocoded: outcomes.filter((outcome) => outcome === "geocoded").length,
  };
}, "processGeocodeBatch");
var geocodeMissingLocations = /* @__PURE__ */ __name(
  async (env2, limit = 50) => {
    const store = getParkingStore(env2);
    const missing = await store.getLocationsNeedingGeocode(limit);
    let geocoded = 0;
    let failed = 0;
    const batchStarts = [];
    for (let index = 0; index < missing.length; index += OVERPASS_BATCH_SIZE) {
      batchStarts.push(index);
    }
    const processBatchAt = /* @__PURE__ */ __name(async (batchIndex) => {
      if (batchIndex >= batchStarts.length) {
        return;
      }
      const index = batchStarts[batchIndex];
      if (index === void 0) {
        return;
      }
      const batch = missing.slice(index, index + OVERPASS_BATCH_SIZE);
      const result = await processGeocodeBatch(env2, batch);
      geocoded += result.geocoded;
      failed += result.failed;
      if (batchIndex < batchStarts.length - 1) {
        await sleep(OVERPASS_BATCH_DELAY_MS);
      }
      await processBatchAt(batchIndex + 1);
    }, "processBatchAt");
    await processBatchAt(0);
    const pending = await store.countLocationsNeedingGeocode();
    return { failed, geocoded, pending };
  },
  "geocodeMissingLocations"
);

// src/server/clean.ts
var paddedString = external_exports
  .union([external_exports.string(), external_exports.number()])
  .transform((value) => String(value).trim());
var rawInfringementSchema = external_exports.object({
  Additional_Costs_Amount: external_exports.number().optional().default(0),
  Additional_Costs_Balance: external_exports.number().optional().default(0),
  Court_Serve_Method: paddedString.optional().default(""),
  Infringement_Amount: external_exports.number(),
  Infringement_Closed_Date: paddedString.optional().default(""),
  Infringement_Date: paddedString,
  Infringement_Number: external_exports.coerce.number(),
  Infringement_Time: paddedString,
  Infringement_Type: external_exports.number().optional(),
  Is_Towed: external_exports.boolean().optional().default(false),
  Occured_At_Post_Code: paddedString.optional().default(""),
  Occured_At_Street: paddedString.optional().default(""),
  Occured_At_Suburb: paddedString.optional().default(""),
  Occured_At_Town: paddedString.optional().default(""),
  Offence_Category: paddedString.optional().default(""),
  Offence_Code: paddedString.optional().default(""),
  Offence_Description: paddedString.optional().default(""),
  Vehicle_Colour: paddedString.optional().default(""),
  Vehicle_Make: paddedString.optional().default(""),
  Vehicle_Model: paddedString.optional().default(""),
  Vehicle_Type: paddedString.optional().default(""),
});
var STREET_SUFFIXES = {
  AVE: "Ave",
  CRES: "Cres",
  CT: "Ct",
  DR: "Dr",
  LN: "Ln",
  PL: "Pl",
  RD: "Rd",
  ST: "St",
  TCE: "Tce",
};
var dollarsToCents = /* @__PURE__ */ __name(
  (amount) => Math.round(amount * 100),
  "dollarsToCents"
);
var toIsoOccurredAt = /* @__PURE__ */ __name((date5, time3) => {
  const normalizedTime = time3.length === 5 ? `${time3}:00` : time3;
  return `${date5}T${normalizedTime}+12:00`;
}, "toIsoOccurredAt");
var emptyToNull = /* @__PURE__ */ __name(
  (value) => (value.length > 0 ? value : null),
  "emptyToNull"
);
var titleCaseWords = /* @__PURE__ */ __name(
  (value) =>
    value
      .split(/\s+/u)
      .filter(Boolean)
      .map((word) => {
        if (/^\d+$/u.test(word)) {
          return word;
        }
        const upper = word.toUpperCase();
        if (STREET_SUFFIXES[upper] !== void 0) {
          return STREET_SUFFIXES[upper];
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" "),
  "titleCaseWords"
);
var normalizeStreet = /* @__PURE__ */ __name((raw2) => {
  const collapsed = raw2.trim().replaceAll(/\s+/gu, " ");
  if (collapsed === "") {
    return "Unknown";
  }
  return titleCaseWords(collapsed);
}, "normalizeStreet");
var normalizeSuburb = /* @__PURE__ */ __name((raw2) => {
  const value = titleCaseWords(raw2.trim());
  return value.length > 0 ? value : null;
}, "normalizeSuburb");
var normalizeVehicleMake = /* @__PURE__ */ __name((raw2) => {
  const value = raw2.trim();
  if (value === "") {
    return null;
  }
  if (value.length <= 4 && value === value.toUpperCase()) {
    return value.toUpperCase();
  }
  return titleCaseWords(value);
}, "normalizeVehicleMake");
var sentenceCase = /* @__PURE__ */ __name((value) => {
  const lower = value.toLowerCase().trim();
  if (lower === "") {
    return "";
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}, "sentenceCase");
var normalizeOffence = /* @__PURE__ */ __name((description, offenceCode) => {
  const trimmed = description.trim();
  const prefixMatch = /^(?<code>[A-Z]\d{2,4})\s+(?<description>.+)$/iu.exec(
    trimmed
  );
  if (prefixMatch?.groups !== void 0) {
    return {
      code: prefixMatch.groups.code.toUpperCase(),
      label: sentenceCase(prefixMatch.groups.description.trim()),
    };
  }
  const code = offenceCode.trim() === "" ? "unknown" : offenceCode.trim();
  const label = trimmed === "" ? "Unknown offence" : sentenceCase(trimmed);
  return { code, label };
}, "normalizeOffence");
var normalizeCourtServeMethod = /* @__PURE__ */ __name((raw2) => {
  const value = raw2.trim().toUpperCase();
  if (value === "") {
    return null;
  }
  const labels = {
    P: "Posted",
  };
  return labels[value] ?? value;
}, "normalizeCourtServeMethod");
var normalizeVehicleType = /* @__PURE__ */ __name((raw2) => {
  const value = raw2.trim();
  if (value === "") {
    return null;
  }
  if (value.toUpperCase() === "MOTOR VEHI") {
    return "Motor vehicle";
  }
  return titleCaseWords(value);
}, "normalizeVehicleType");
var cleanInfringement = /* @__PURE__ */ __name((raw2) => {
  const parsed = rawInfringementSchema.parse(raw2);
  const offence = normalizeOffence(
    parsed.Offence_Description,
    parsed.Offence_Code
  );
  return {
    additionalCostsCents: dollarsToCents(parsed.Additional_Costs_Amount),
    amountCents: dollarsToCents(parsed.Infringement_Amount),
    closedAt: emptyToNull(parsed.Infringement_Closed_Date),
    courtServeMethod: normalizeCourtServeMethod(parsed.Court_Serve_Method),
    infringementNumber: parsed.Infringement_Number,
    infringementType: parsed.Infringement_Type ?? null,
    isTowed: parsed.Is_Towed,
    occurredAt: toIsoOccurredAt(
      parsed.Infringement_Date,
      parsed.Infringement_Time
    ),
    offenceCategory:
      parsed.Offence_Category === ""
        ? null
        : titleCaseWords(parsed.Offence_Category),
    offenceCode: offence.code,
    offenceDescription: offence.label,
    postCode: emptyToNull(parsed.Occured_At_Post_Code),
    street: normalizeStreet(parsed.Occured_At_Street),
    suburb: normalizeSuburb(parsed.Occured_At_Suburb),
    town: normalizeSuburb(parsed.Occured_At_Town) ?? "Hamilton",
    vehicleColour: emptyToNull(parsed.Vehicle_Colour),
    vehicleMake: normalizeVehicleMake(parsed.Vehicle_Make),
    vehicleModel:
      parsed.Vehicle_Model === "" ? null : titleCaseWords(parsed.Vehicle_Model),
    vehicleType: normalizeVehicleType(parsed.Vehicle_Type),
  };
}, "cleanInfringement");
var cleanInfringements = /* @__PURE__ */ __name((records) => {
  const cleaned = [];
  let skipped = 0;
  for (const record2 of records) {
    try {
      cleaned.push(cleanInfringement(record2));
    } catch {
      skipped += 1;
    }
  }
  return { cleaned, skipped };
}, "cleanInfringements");

// src/server/import.ts
var importBatchSchema = external_exports.object({
  final: external_exports.boolean().optional().default(false),
  records: external_exports
    .array(
      external_exports.record(
        external_exports.string(),
        external_exports.unknown()
      )
    )
    .max(5e3),
});
var importInfringements = /* @__PURE__ */ __name(async (env2, body) => {
  const payload = importBatchSchema.parse(body);
  const { cleaned, skipped } = cleanInfringements(payload.records);
  const result = await getParkingStore(env2).importInfringementBatch({
    final: payload.final,
    records: cleaned,
    recordsReceived: payload.records.length,
    skipped,
  });
  return {
    ...result,
    final: payload.final,
  };
}, "importInfringements");

// src/durable-objects/parking-store.ts
import { DurableObject } from "cloudflare:workers";

// node_modules/date-fns/constants.js
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;
var constructFromSymbol = /* @__PURE__ */ Symbol.for("constructDateFrom");

// node_modules/date-fns/constructFrom.js
function constructFrom(date5, value) {
  if (typeof date5 === "function") return date5(value);
  if (date5 && typeof date5 === "object" && constructFromSymbol in date5)
    return date5[constructFromSymbol](value);
  if (date5 instanceof Date) return new date5.constructor(value);
  return new Date(value);
}
__name(constructFrom, "constructFrom");

// node_modules/date-fns/toDate.js
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}
__name(toDate, "toDate");

// node_modules/date-fns/addDays.js
function addDays(date5, amount, options) {
  const _date2 = toDate(date5, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date5, NaN);
  if (!amount) return _date2;
  _date2.setDate(_date2.getDate() + amount);
  return _date2;
}
__name(addDays, "addDays");

// node_modules/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}
__name(getDefaultOptions, "getDefaultOptions");

// node_modules/date-fns/startOfWeek.js
function startOfWeek(date5, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions2.weekStartsOn ??
    defaultOptions2.locale?.options?.weekStartsOn ??
    0;
  const _date2 = toDate(date5, options?.in);
  const day = _date2.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date2.setDate(_date2.getDate() - diff);
  _date2.setHours(0, 0, 0, 0);
  return _date2;
}
__name(startOfWeek, "startOfWeek");

// node_modules/date-fns/startOfISOWeek.js
function startOfISOWeek(date5, options) {
  return startOfWeek(date5, { ...options, weekStartsOn: 1 });
}
__name(startOfISOWeek, "startOfISOWeek");

// node_modules/date-fns/getISOWeekYear.js
function getISOWeekYear(date5, options) {
  const _date2 = toDate(date5, options?.in);
  const year = _date2.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(_date2, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(_date2, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date2.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date2.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}
__name(getISOWeekYear, "getISOWeekYear");

// node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
function getTimezoneOffsetInMilliseconds(date5) {
  const _date2 = toDate(date5);
  const utcDate = new Date(
    Date.UTC(
      _date2.getFullYear(),
      _date2.getMonth(),
      _date2.getDate(),
      _date2.getHours(),
      _date2.getMinutes(),
      _date2.getSeconds(),
      _date2.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date2.getFullYear());
  return +date5 - +utcDate;
}
__name(getTimezoneOffsetInMilliseconds, "getTimezoneOffsetInMilliseconds");

// node_modules/date-fns/_lib/normalizeDates.js
function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    context || dates.find((date5) => typeof date5 === "object")
  );
  return dates.map(normalize);
}
__name(normalizeDates, "normalizeDates");

// node_modules/date-fns/startOfDay.js
function startOfDay(date5, options) {
  const _date2 = toDate(date5, options?.in);
  _date2.setHours(0, 0, 0, 0);
  return _date2;
}
__name(startOfDay, "startOfDay");

// node_modules/date-fns/differenceInCalendarDays.js
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);
  const laterTimestamp =
    +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp =
    +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}
__name(differenceInCalendarDays, "differenceInCalendarDays");

// node_modules/date-fns/startOfISOWeekYear.js
function startOfISOWeekYear(date5, options) {
  const year = getISOWeekYear(date5, options);
  const fourthOfJanuary = constructFrom(options?.in || date5, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}
__name(startOfISOWeekYear, "startOfISOWeekYear");

// node_modules/date-fns/isDate.js
function isDate(value) {
  return (
    value instanceof Date ||
    (typeof value === "object" &&
      Object.prototype.toString.call(value) === "[object Date]")
  );
}
__name(isDate, "isDate");

// node_modules/date-fns/isValid.js
function isValid(date5) {
  return !(
    (!isDate(date5) && typeof date5 !== "number") ||
    isNaN(+toDate(date5))
  );
}
__name(isValid, "isValid");

// node_modules/date-fns/startOfYear.js
function startOfYear(date5, options) {
  const date_ = toDate(date5, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}
__name(startOfYear, "startOfYear");

// node_modules/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds",
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds",
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes",
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes",
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours",
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours",
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days",
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks",
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks",
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months",
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months",
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years",
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years",
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years",
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years",
  },
};
var formatDistance = /* @__PURE__ */ __name((token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
}, "formatDistance");

// node_modules/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format3 = args.formats[width] || args.formats[args.defaultWidth];
    return format3;
  };
}
__name(buildFormatLongFn, "buildFormatLongFn");

// node_modules/date-fns/locale/en-US/_lib/formatLong.js
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy",
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a",
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}",
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full",
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full",
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full",
  }),
};

// node_modules/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P",
};
var formatRelative = /* @__PURE__ */ __name(
  (token, _date2, _baseDate, _options) => formatRelativeLocale[token],
  "formatRelative"
);

// node_modules/date-fns/locale/_lib/buildLocalizeFn.js
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray =
        args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}
__name(buildLocalizeFn, "buildLocalizeFn");

// node_modules/date-fns/locale/en-US/_lib/localize.js
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"],
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  },
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night",
  },
};
var ordinalNumber = /* @__PURE__ */ __name((dirtyNumber, _options) => {
  const number4 = Number(dirtyNumber);
  const rem100 = number4 % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number4 + "st";
      case 2:
        return number4 + "nd";
      case 3:
        return number4 + "rd";
    }
  }
  return number4 + "th";
}, "ordinalNumber");
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide",
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: /* @__PURE__ */ __name(
      (quarter) => quarter - 1,
      "argumentCallback"
    ),
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide",
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide",
  }),
};

// node_modules/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return (string4, options = {}) => {
    const width = options.width;
    const matchPattern =
      (width && args.matchPatterns[width]) ||
      args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string4.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns =
      (width && args.parsePatterns[width]) ||
      args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns)
      ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString))
      : // [TODO] -- I challenge you to fix the type
        findKey(parsePatterns, (pattern) => pattern.test(matchedString));
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback
      ? // [TODO] -- I challenge you to fix the type
        options.valueCallback(value)
      : value;
    const rest = string4.slice(matchedString.length);
    return { value, rest };
  };
}
__name(buildMatchFn, "buildMatchFn");
function findKey(object2, predicate) {
  for (const key in object2) {
    if (
      Object.prototype.hasOwnProperty.call(object2, key) &&
      predicate(object2[key])
    ) {
      return key;
    }
  }
  return void 0;
}
__name(findKey, "findKey");
function findIndex(array2, predicate) {
  for (let key = 0; key < array2.length; key++) {
    if (predicate(array2[key])) {
      return key;
    }
  }
  return void 0;
}
__name(findIndex, "findIndex");

// node_modules/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return (string4, options = {}) => {
    const matchResult = string4.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string4.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback
      ? args.valueCallback(parseResult[0])
      : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string4.slice(matchedString.length);
    return { value, rest };
  };
}
__name(buildMatchPatternFn, "buildMatchPatternFn");

// node_modules/date-fns/locale/en-US/_lib/match.js
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i,
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i],
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i,
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i],
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i,
  },
};
var match2 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: /* @__PURE__ */ __name(
      (value) => parseInt(value, 10),
      "valueCallback"
    ),
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any",
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: /* @__PURE__ */ __name(
      (index) => index + 1,
      "valueCallback"
    ),
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any",
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any",
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any",
  }),
};

// node_modules/date-fns/locale/en-US.js
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match: match2,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1,
  },
};

// node_modules/date-fns/getDayOfYear.js
function getDayOfYear(date5, options) {
  const _date2 = toDate(date5, options?.in);
  const diff = differenceInCalendarDays(_date2, startOfYear(_date2));
  const dayOfYear = diff + 1;
  return dayOfYear;
}
__name(getDayOfYear, "getDayOfYear");

// node_modules/date-fns/getISOWeek.js
function getISOWeek(date5, options) {
  const _date2 = toDate(date5, options?.in);
  const diff = +startOfISOWeek(_date2) - +startOfISOWeekYear(_date2);
  return Math.round(diff / millisecondsInWeek) + 1;
}
__name(getISOWeek, "getISOWeek");

// node_modules/date-fns/getWeekYear.js
function getWeekYear(date5, options) {
  const _date2 = toDate(date5, options?.in);
  const year = _date2.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions2.firstWeekContainsDate ??
    defaultOptions2.locale?.options?.firstWeekContainsDate ??
    1;
  const firstWeekOfNextYear = constructFrom(options?.in || date5, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(options?.in || date5, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (+_date2 >= +startOfNextYear) {
    return year + 1;
  } else if (+_date2 >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}
__name(getWeekYear, "getWeekYear");

// node_modules/date-fns/startOfWeekYear.js
function startOfWeekYear(date5, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions2.firstWeekContainsDate ??
    defaultOptions2.locale?.options?.firstWeekContainsDate ??
    1;
  const year = getWeekYear(date5, options);
  const firstWeek = constructFrom(options?.in || date5, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date2 = startOfWeek(firstWeek, options);
  return _date2;
}
__name(startOfWeekYear, "startOfWeekYear");

// node_modules/date-fns/getWeek.js
function getWeek(date5, options) {
  const _date2 = toDate(date5, options?.in);
  const diff =
    +startOfWeek(_date2, options) - +startOfWeekYear(_date2, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}
__name(getWeek, "getWeek");

// node_modules/date-fns/_lib/addLeadingZeros.js
function addLeadingZeros(number4, targetLength) {
  const sign = number4 < 0 ? "-" : "";
  const output = Math.abs(number4).toString().padStart(targetLength, "0");
  return sign + output;
}
__name(addLeadingZeros, "addLeadingZeros");

// node_modules/date-fns/_lib/format/lightFormatters.js
var lightFormatters = {
  // Year
  y(date5, token) {
    const signedYear = date5.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date5, token) {
    const month = date5.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date5, token) {
    return addLeadingZeros(date5.getDate(), token.length);
  },
  // AM or PM
  a(date5, token) {
    const dayPeriodEnumValue = date5.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date5, token) {
    return addLeadingZeros(date5.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date5, token) {
    return addLeadingZeros(date5.getHours(), token.length);
  },
  // Minute
  m(date5, token) {
    return addLeadingZeros(date5.getMinutes(), token.length);
  },
  // Second
  s(date5, token) {
    return addLeadingZeros(date5.getSeconds(), token.length);
  },
  // Fraction of second
  S(date5, token) {
    const numberOfDigits = token.length;
    const milliseconds = date5.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  },
};

// node_modules/date-fns/_lib/format/formatters.js
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night",
};
var formatters = {
  // Era
  G: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const era = date5.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  }, "G"),
  // Year
  y: /* @__PURE__ */ __name(function (date5, token, localize2) {
    if (token === "yo") {
      const signedYear = date5.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date5, token);
  }, "y"),
  // Local week-numbering year
  Y: /* @__PURE__ */ __name(function (date5, token, localize2, options) {
    const signedWeekYear = getWeekYear(date5, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  }, "Y"),
  // ISO week-numbering year
  R: /* @__PURE__ */ __name(function (date5, token) {
    const isoWeekYear = getISOWeekYear(date5);
    return addLeadingZeros(isoWeekYear, token.length);
  }, "R"),
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: /* @__PURE__ */ __name(function (date5, token) {
    const year = date5.getFullYear();
    return addLeadingZeros(year, token.length);
  }, "u"),
  // Quarter
  Q: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const quarter = Math.ceil((date5.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting",
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting",
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "Q"),
  // Stand-alone quarter
  q: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const quarter = Math.ceil((date5.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone",
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone",
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone",
        });
    }
  }, "q"),
  // Month
  M: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const month = date5.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date5, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting",
        });
      // J, F, ..., D
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting",
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  }, "M"),
  // Stand-alone month
  L: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const month = date5.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone",
        });
      // J, F, ..., D
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone",
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  }, "L"),
  // Local week of year
  w: /* @__PURE__ */ __name(function (date5, token, localize2, options) {
    const week = getWeek(date5, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  }, "w"),
  // ISO week of year
  I: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const isoWeek = getISOWeek(date5);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  }, "I"),
  // Day of the month
  d: /* @__PURE__ */ __name(function (date5, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date5.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date5, token);
  }, "d"),
  // Day of year
  D: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const dayOfYear = getDayOfYear(date5);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  }, "D"),
  // Day of week
  E: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const dayOfWeek = date5.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      // T
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      // Tuesday
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "E"),
  // Local day of week
  e: /* @__PURE__ */ __name(function (date5, token, localize2, options) {
    const dayOfWeek = date5.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      // T
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      // Tuesday
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "e"),
  // Stand-alone local day of week
  c: /* @__PURE__ */ __name(function (date5, token, localize2, options) {
    const dayOfWeek = date5.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone",
        });
      // T
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone",
        });
      // Tu
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone",
        });
      // Tuesday
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone",
        });
    }
  }, "c"),
  // ISO day of week
  i: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const dayOfWeek = date5.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting",
        });
      // T
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting",
        });
      // Tu
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting",
        });
      // Tuesday
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "i"),
  // AM or PM
  a: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const hours = date5.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "aaa":
        return localize2
          .dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          })
          .toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "a"),
  // AM, PM, midnight, noon
  b: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const hours = date5.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "bbb":
        return localize2
          .dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          })
          .toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "b"),
  // in the morning, in the afternoon, in the evening, at night
  B: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const hours = date5.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting",
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting",
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting",
        });
    }
  }, "B"),
  // Hour [1-12]
  h: /* @__PURE__ */ __name(function (date5, token, localize2) {
    if (token === "ho") {
      let hours = date5.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date5, token);
  }, "h"),
  // Hour [0-23]
  H: /* @__PURE__ */ __name(function (date5, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date5.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date5, token);
  }, "H"),
  // Hour [0-11]
  K: /* @__PURE__ */ __name(function (date5, token, localize2) {
    const hours = date5.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  }, "K"),
  // Hour [1-24]
  k: /* @__PURE__ */ __name(function (date5, token, localize2) {
    let hours = date5.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  }, "k"),
  // Minute
  m: /* @__PURE__ */ __name(function (date5, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date5.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date5, token);
  }, "m"),
  // Second
  s: /* @__PURE__ */ __name(function (date5, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date5.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date5, token);
  }, "s"),
  // Fraction of second
  S: /* @__PURE__ */ __name(function (date5, token) {
    return lightFormatters.S(date5, token);
  }, "S"),
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: /* @__PURE__ */ __name(function (date5, token, _localize) {
    const timezoneOffset = date5.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  }, "X"),
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: /* @__PURE__ */ __name(function (date5, token, _localize) {
    const timezoneOffset = date5.getTimezoneOffset();
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  }, "x"),
  // Timezone (GMT)
  O: /* @__PURE__ */ __name(function (date5, token, _localize) {
    const timezoneOffset = date5.getTimezoneOffset();
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  }, "O"),
  // Timezone (specific non-location)
  z: /* @__PURE__ */ __name(function (date5, token, _localize) {
    const timezoneOffset = date5.getTimezoneOffset();
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  }, "z"),
  // Seconds timestamp
  t: /* @__PURE__ */ __name(function (date5, token, _localize) {
    const timestamp = Math.trunc(+date5 / 1e3);
    return addLeadingZeros(timestamp, token.length);
  }, "t"),
  // Milliseconds timestamp
  T: /* @__PURE__ */ __name(function (date5, token, _localize) {
    return addLeadingZeros(+date5, token.length);
  }, "T"),
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
__name(formatTimezoneShort, "formatTimezoneShort");
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
__name(formatTimezoneWithOptionalMinutes, "formatTimezoneWithOptionalMinutes");
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}
__name(formatTimezone, "formatTimezone");

// node_modules/date-fns/_lib/format/longFormatters.js
var dateLongFormatter = /* @__PURE__ */ __name((pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
}, "dateLongFormatter");
var timeLongFormatter = /* @__PURE__ */ __name((pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
}, "timeLongFormatter");
var dateTimeLongFormatter = /* @__PURE__ */ __name((pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat
    .replace("{{date}}", dateLongFormatter(datePattern, formatLong2))
    .replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
}, "dateTimeLongFormatter");
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter,
};

// node_modules/date-fns/_lib/protectedTokens.js
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
__name(isProtectedDayOfYearToken, "isProtectedDayOfYearToken");
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
__name(isProtectedWeekYearToken, "isProtectedWeekYearToken");
function warnOrThrowProtectedError(token, format3, input) {
  const _message = message(token, format3, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
__name(warnOrThrowProtectedError, "warnOrThrowProtectedError");
function message(token, format3, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format3}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
__name(message, "message");

// node_modules/date-fns/format.js
var formattingTokensRegExp =
  /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date5, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate =
    options?.firstWeekContainsDate ??
    options?.locale?.options?.firstWeekContainsDate ??
    defaultOptions2.firstWeekContainsDate ??
    defaultOptions2.locale?.options?.firstWeekContainsDate ??
    1;
  const weekStartsOn =
    options?.weekStartsOn ??
    options?.locale?.options?.weekStartsOn ??
    defaultOptions2.weekStartsOn ??
    defaultOptions2.locale?.options?.weekStartsOn ??
    0;
  const originalDate = toDate(date5, options?.in);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr
    .match(longFormattingTokensRegExp)
    .map((substring) => {
      const firstCharacter = substring[0];
      if (firstCharacter === "p" || firstCharacter === "P") {
        const longFormatter = longFormatters[firstCharacter];
        return longFormatter(substring, locale.formatLong);
      }
      return substring;
    })
    .join("")
    .match(formattingTokensRegExp)
    .map((substring) => {
      if (substring === "''") {
        return { isToken: false, value: "'" };
      }
      const firstCharacter = substring[0];
      if (firstCharacter === "'") {
        return { isToken: false, value: cleanEscapedString(substring) };
      }
      if (formatters[firstCharacter]) {
        return { isToken: true, value: substring };
      }
      if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" +
            firstCharacter +
            "`"
        );
      }
      return { isToken: false, value: substring };
    });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale,
  };
  return parts
    .map((part) => {
      if (!part.isToken) return part.value;
      const token = part.value;
      if (
        (!options?.useAdditionalWeekYearTokens &&
          isProtectedWeekYearToken(token)) ||
        (!options?.useAdditionalDayOfYearTokens &&
          isProtectedDayOfYearToken(token))
      ) {
        warnOrThrowProtectedError(token, formatStr, String(date5));
      }
      const formatter = formatters[token[0]];
      return formatter(originalDate, token, locale.localize, formatterOptions);
    })
    .join("");
}
__name(format, "format");
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}
__name(cleanEscapedString, "cleanEscapedString");

// node_modules/date-fns/getDefaultOptions.js
function getDefaultOptions2() {
  return Object.assign({}, getDefaultOptions());
}
__name(getDefaultOptions2, "getDefaultOptions");

// node_modules/date-fns/subDays.js
function subDays(date5, amount, options) {
  return addDays(date5, -amount, options);
}
__name(subDays, "subDays");

// node_modules/date-fns-tz/dist/esm/_lib/tzIntlTimeZoneName/index.js
function tzIntlTimeZoneName(length, date5, options) {
  const defaultOptions2 = getDefaultOptions2();
  const dtf = getDTF(
    length,
    options.timeZone,
    options.locale ?? defaultOptions2.locale
  );
  return "formatToParts" in dtf
    ? partsTimeZone(dtf, date5)
    : hackyTimeZone(dtf, date5);
}
__name(tzIntlTimeZoneName, "tzIntlTimeZoneName");
function partsTimeZone(dtf, date5) {
  const formatted = dtf.formatToParts(date5);
  for (let i = formatted.length - 1; i >= 0; --i) {
    if (formatted[i].type === "timeZoneName") {
      return formatted[i].value;
    }
  }
  return void 0;
}
__name(partsTimeZone, "partsTimeZone");
function hackyTimeZone(dtf, date5) {
  const formatted = dtf.format(date5).replace(/\u200E/g, "");
  const tzNameMatch = / [\w-+ ]+$/.exec(formatted);
  return tzNameMatch ? tzNameMatch[0].substr(1) : "";
}
__name(hackyTimeZone, "hackyTimeZone");
function getDTF(length, timeZone, locale) {
  return new Intl.DateTimeFormat(locale ? [locale.code, "en-US"] : void 0, {
    timeZone,
    timeZoneName: length,
  });
}
__name(getDTF, "getDTF");

// node_modules/date-fns-tz/dist/esm/_lib/tzTokenizeDate/index.js
function tzTokenizeDate(date5, timeZone) {
  const dtf = getDateTimeFormat(timeZone);
  return "formatToParts" in dtf
    ? partsOffset(dtf, date5)
    : hackyOffset(dtf, date5);
}
__name(tzTokenizeDate, "tzTokenizeDate");
var typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  hour: 3,
  minute: 4,
  second: 5,
};
function partsOffset(dtf, date5) {
  try {
    const formatted = dtf.formatToParts(date5);
    const filled = [];
    for (let i = 0; i < formatted.length; i++) {
      const pos = typeToPos[formatted[i].type];
      if (pos !== void 0) {
        filled[pos] = parseInt(formatted[i].value, 10);
      }
    }
    return filled;
  } catch (error51) {
    if (error51 instanceof RangeError) {
      return [NaN];
    }
    throw error51;
  }
}
__name(partsOffset, "partsOffset");
function hackyOffset(dtf, date5) {
  const formatted = dtf.format(date5);
  const parsed = /(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/.exec(formatted);
  return [
    parseInt(parsed[3], 10),
    parseInt(parsed[1], 10),
    parseInt(parsed[2], 10),
    parseInt(parsed[4], 10),
    parseInt(parsed[5], 10),
    parseInt(parsed[6], 10),
  ];
}
__name(hackyOffset, "hackyOffset");
var dtfCache = {};
var testDateFormatted = new Intl.DateTimeFormat("en-US", {
  hourCycle: "h23",
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
}).format(/* @__PURE__ */ new Date("2014-06-25T04:00:00.123Z"));
var hourCycleSupported =
  testDateFormatted === "06/25/2014, 00:00:00" ||
  testDateFormatted ===
    "\u200E06\u200E/\u200E25\u200E/\u200E2014\u200E \u200E00\u200E:\u200E00\u200E:\u200E00";
function getDateTimeFormat(timeZone) {
  if (!dtfCache[timeZone]) {
    dtfCache[timeZone] = hourCycleSupported
      ? new Intl.DateTimeFormat("en-US", {
          hourCycle: "h23",
          timeZone,
          year: "numeric",
          month: "numeric",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : new Intl.DateTimeFormat("en-US", {
          hour12: false,
          timeZone,
          year: "numeric",
          month: "numeric",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
  }
  return dtfCache[timeZone];
}
__name(getDateTimeFormat, "getDateTimeFormat");

// node_modules/date-fns-tz/dist/esm/_lib/newDateUTC/index.js
function newDateUTC(fullYear, month, day, hour, minute, second, millisecond) {
  const utcDate = /* @__PURE__ */ new Date(0);
  utcDate.setUTCFullYear(fullYear, month, day);
  utcDate.setUTCHours(hour, minute, second, millisecond);
  return utcDate;
}
__name(newDateUTC, "newDateUTC");

// node_modules/date-fns-tz/dist/esm/_lib/tzParseTimezone/index.js
var MILLISECONDS_IN_HOUR = 36e5;
var MILLISECONDS_IN_MINUTE = 6e4;
var patterns = {
  timezone: /([Z+-].*)$/,
  timezoneZ: /^(Z)$/,
  timezoneHH: /^([+-]\d{2})$/,
  timezoneHHMM: /^([+-])(\d{2}):?(\d{2})$/,
};
function tzParseTimezone(timezoneString, date5, isUtcDate) {
  if (!timezoneString) {
    return 0;
  }
  let token = patterns.timezoneZ.exec(timezoneString);
  if (token) {
    return 0;
  }
  let hours;
  let absoluteOffset;
  token = patterns.timezoneHH.exec(timezoneString);
  if (token) {
    hours = parseInt(token[1], 10);
    if (!validateTimezone(hours)) {
      return NaN;
    }
    return -(hours * MILLISECONDS_IN_HOUR);
  }
  token = patterns.timezoneHHMM.exec(timezoneString);
  if (token) {
    hours = parseInt(token[2], 10);
    const minutes = parseInt(token[3], 10);
    if (!validateTimezone(hours, minutes)) {
      return NaN;
    }
    absoluteOffset =
      Math.abs(hours) * MILLISECONDS_IN_HOUR + minutes * MILLISECONDS_IN_MINUTE;
    return token[1] === "+" ? -absoluteOffset : absoluteOffset;
  }
  if (isValidTimezoneIANAString(timezoneString)) {
    date5 = new Date(date5 || Date.now());
    const utcDate = isUtcDate ? date5 : toUtcDate(date5);
    const offset = calcOffset(utcDate, timezoneString);
    const fixedOffset = isUtcDate
      ? offset
      : fixOffset(date5, offset, timezoneString);
    return -fixedOffset;
  }
  return NaN;
}
__name(tzParseTimezone, "tzParseTimezone");
function toUtcDate(date5) {
  return newDateUTC(
    date5.getFullYear(),
    date5.getMonth(),
    date5.getDate(),
    date5.getHours(),
    date5.getMinutes(),
    date5.getSeconds(),
    date5.getMilliseconds()
  );
}
__name(toUtcDate, "toUtcDate");
function calcOffset(date5, timezoneString) {
  const tokens = tzTokenizeDate(date5, timezoneString);
  const asUTC = newDateUTC(
    tokens[0],
    tokens[1] - 1,
    tokens[2],
    tokens[3] % 24,
    tokens[4],
    tokens[5],
    0
  ).getTime();
  let asTS = date5.getTime();
  const over = asTS % 1e3;
  asTS -= over >= 0 ? over : 1e3 + over;
  return asUTC - asTS;
}
__name(calcOffset, "calcOffset");
function fixOffset(date5, offset, timezoneString) {
  const localTS = date5.getTime();
  let utcGuess = localTS - offset;
  const o2 = calcOffset(new Date(utcGuess), timezoneString);
  if (offset === o2) {
    return offset;
  }
  utcGuess -= o2 - offset;
  const o3 = calcOffset(new Date(utcGuess), timezoneString);
  if (o2 === o3) {
    return o2;
  }
  return Math.max(o2, o3);
}
__name(fixOffset, "fixOffset");
function validateTimezone(hours, minutes) {
  return (
    -23 <= hours &&
    hours <= 23 &&
    (minutes == null || (0 <= minutes && minutes <= 59))
  );
}
__name(validateTimezone, "validateTimezone");
var validIANATimezoneCache = {};
function isValidTimezoneIANAString(timeZoneString) {
  if (validIANATimezoneCache[timeZoneString]) return true;
  try {
    new Intl.DateTimeFormat(void 0, { timeZone: timeZoneString });
    validIANATimezoneCache[timeZoneString] = true;
    return true;
  } catch (error51) {
    return false;
  }
}
__name(isValidTimezoneIANAString, "isValidTimezoneIANAString");

// node_modules/date-fns-tz/dist/esm/format/formatters/index.js
var MILLISECONDS_IN_MINUTE2 = 60 * 1e3;
var formatters2 = {
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: /* @__PURE__ */ __name(function (date5, token, options) {
    const timezoneOffset = getTimeZoneOffset(options.timeZone, date5);
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes2(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone2(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimeter
      default:
        return formatTimezone2(timezoneOffset, ":");
    }
  }, "X"),
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: /* @__PURE__ */ __name(function (date5, token, options) {
    const timezoneOffset = getTimeZoneOffset(options.timeZone, date5);
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes2(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone2(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimeter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimeter
      default:
        return formatTimezone2(timezoneOffset, ":");
    }
  }, "x"),
  // Timezone (GMT)
  O: /* @__PURE__ */ __name(function (date5, token, options) {
    const timezoneOffset = getTimeZoneOffset(options.timeZone, date5);
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort2(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone2(timezoneOffset, ":");
    }
  }, "O"),
  // Timezone (specific non-location)
  z: /* @__PURE__ */ __name(function (date5, token, options) {
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return tzIntlTimeZoneName("short", date5, options);
      // Long
      case "zzzz":
      default:
        return tzIntlTimeZoneName("long", date5, options);
    }
  }, "z"),
};
function getTimeZoneOffset(timeZone, originalDate) {
  const timeZoneOffset = timeZone
    ? tzParseTimezone(timeZone, originalDate, true) / MILLISECONDS_IN_MINUTE2
    : (originalDate?.getTimezoneOffset() ?? 0);
  if (Number.isNaN(timeZoneOffset)) {
    throw new RangeError("Invalid time zone specified: " + timeZone);
  }
  return timeZoneOffset;
}
__name(getTimeZoneOffset, "getTimeZoneOffset");
function addLeadingZeros2(number4, targetLength) {
  const sign = number4 < 0 ? "-" : "";
  let output = Math.abs(number4).toString();
  while (output.length < targetLength) {
    output = "0" + output;
  }
  return sign + output;
}
__name(addLeadingZeros2, "addLeadingZeros");
function formatTimezone2(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros2(Math.floor(absOffset / 60), 2);
  const minutes = addLeadingZeros2(Math.floor(absOffset % 60), 2);
  return sign + hours + delimiter + minutes;
}
__name(formatTimezone2, "formatTimezone");
function formatTimezoneWithOptionalMinutes2(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros2(Math.abs(offset) / 60, 2);
  }
  return formatTimezone2(offset, delimiter);
}
__name(formatTimezoneWithOptionalMinutes2, "formatTimezoneWithOptionalMinutes");
function formatTimezoneShort2(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros2(minutes, 2);
}
__name(formatTimezoneShort2, "formatTimezoneShort");

// node_modules/date-fns-tz/dist/esm/_lib/getTimezoneOffsetInMilliseconds/index.js
function getTimezoneOffsetInMilliseconds2(date5) {
  const utcDate = new Date(
    Date.UTC(
      date5.getFullYear(),
      date5.getMonth(),
      date5.getDate(),
      date5.getHours(),
      date5.getMinutes(),
      date5.getSeconds(),
      date5.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(date5.getFullYear());
  return +date5 - +utcDate;
}
__name(getTimezoneOffsetInMilliseconds2, "getTimezoneOffsetInMilliseconds");

// node_modules/date-fns-tz/dist/esm/_lib/tzPattern/index.js
var tzPattern =
  /(Z|[+-]\d{2}(?::?\d{2})?| UTC| [a-zA-Z]+\/[a-zA-Z_]+(?:\/[a-zA-Z_]+)?)$/;

// node_modules/date-fns-tz/dist/esm/toDate/index.js
var MILLISECONDS_IN_HOUR2 = 36e5;
var MILLISECONDS_IN_MINUTE3 = 6e4;
var DEFAULT_ADDITIONAL_DIGITS = 2;
var patterns2 = {
  dateTimePattern: /^([0-9W+-]+)(T| )(.*)/,
  datePattern: /^([0-9W+-]+)(.*)/,
  plainTime: /:/,
  // year tokens
  YY: /^(\d{2})$/,
  YYY: [
    /^([+-]\d{2})$/,
    // 0 additional digits
    /^([+-]\d{3})$/,
    // 1 additional digit
    /^([+-]\d{4})$/,
    // 2 additional digits
  ],
  YYYY: /^(\d{4})/,
  YYYYY: [
    /^([+-]\d{4})/,
    // 0 additional digits
    /^([+-]\d{5})/,
    // 1 additional digit
    /^([+-]\d{6})/,
    // 2 additional digits
  ],
  // date tokens
  MM: /^-(\d{2})$/,
  DDD: /^-?(\d{3})$/,
  MMDD: /^-?(\d{2})-?(\d{2})$/,
  Www: /^-?W(\d{2})$/,
  WwwD: /^-?W(\d{2})-?(\d{1})$/,
  HH: /^(\d{2}([.,]\d*)?)$/,
  HHMM: /^(\d{2}):?(\d{2}([.,]\d*)?)$/,
  HHMMSS: /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/,
  // time zone tokens (to identify the presence of a tz)
  timeZone: tzPattern,
};
function toDate2(argument, options = {}) {
  if (arguments.length < 1) {
    throw new TypeError(
      "1 argument required, but only " + arguments.length + " present"
    );
  }
  if (argument === null) {
    return /* @__PURE__ */ new Date(NaN);
  }
  const additionalDigits =
    options.additionalDigits == null
      ? DEFAULT_ADDITIONAL_DIGITS
      : Number(options.additionalDigits);
  if (
    additionalDigits !== 2 &&
    additionalDigits !== 1 &&
    additionalDigits !== 0
  ) {
    throw new RangeError("additionalDigits must be 0, 1 or 2");
  }
  if (
    argument instanceof Date ||
    (typeof argument === "object" &&
      Object.prototype.toString.call(argument) === "[object Date]")
  ) {
    return new Date(argument.getTime());
  } else if (
    typeof argument === "number" ||
    Object.prototype.toString.call(argument) === "[object Number]"
  ) {
    return new Date(argument);
  } else if (
    !(Object.prototype.toString.call(argument) === "[object String]")
  ) {
    return /* @__PURE__ */ new Date(NaN);
  }
  const dateStrings = splitDateString(argument);
  const { year, restDateString } = parseYear(
    dateStrings.date,
    additionalDigits
  );
  const date5 = parseDate(restDateString, year);
  if (date5 === null || isNaN(date5.getTime())) {
    return /* @__PURE__ */ new Date(NaN);
  }
  if (date5) {
    const timestamp = date5.getTime();
    let time3 = 0;
    let offset;
    if (dateStrings.time) {
      time3 = parseTime(dateStrings.time);
      if (time3 === null || isNaN(time3)) {
        return /* @__PURE__ */ new Date(NaN);
      }
    }
    if (dateStrings.timeZone || options.timeZone) {
      offset = tzParseTimezone(
        dateStrings.timeZone || options.timeZone,
        new Date(timestamp + time3)
      );
      if (isNaN(offset)) {
        return /* @__PURE__ */ new Date(NaN);
      }
    } else {
      offset = getTimezoneOffsetInMilliseconds2(new Date(timestamp + time3));
      offset = getTimezoneOffsetInMilliseconds2(
        new Date(timestamp + time3 + offset)
      );
    }
    return new Date(timestamp + time3 + offset);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}
__name(toDate2, "toDate");
function splitDateString(dateString) {
  const dateStrings = {};
  let parts = patterns2.dateTimePattern.exec(dateString);
  let timeString;
  if (!parts) {
    parts = patterns2.datePattern.exec(dateString);
    if (parts) {
      dateStrings.date = parts[1];
      timeString = parts[2];
    } else {
      dateStrings.date = null;
      timeString = dateString;
    }
  } else {
    dateStrings.date = parts[1];
    timeString = parts[3];
  }
  if (timeString) {
    const token = patterns2.timeZone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timeZone = token[1].trim();
    } else {
      dateStrings.time = timeString;
    }
  }
  return dateStrings;
}
__name(splitDateString, "splitDateString");
function parseYear(dateString, additionalDigits) {
  if (dateString) {
    const patternYYY = patterns2.YYY[additionalDigits];
    const patternYYYYY = patterns2.YYYYY[additionalDigits];
    let token =
      patterns2.YYYY.exec(dateString) || patternYYYYY.exec(dateString);
    if (token) {
      const yearString = token[1];
      return {
        year: parseInt(yearString, 10),
        restDateString: dateString.slice(yearString.length),
      };
    }
    token = patterns2.YY.exec(dateString) || patternYYY.exec(dateString);
    if (token) {
      const centuryString = token[1];
      return {
        year: parseInt(centuryString, 10) * 100,
        restDateString: dateString.slice(centuryString.length),
      };
    }
  }
  return {
    year: null,
  };
}
__name(parseYear, "parseYear");
function parseDate(dateString, year) {
  if (year === null) {
    return null;
  }
  let date5;
  let month;
  let week;
  if (!dateString || !dateString.length) {
    date5 = /* @__PURE__ */ new Date(0);
    date5.setUTCFullYear(year);
    return date5;
  }
  let token = patterns2.MM.exec(dateString);
  if (token) {
    date5 = /* @__PURE__ */ new Date(0);
    month = parseInt(token[1], 10) - 1;
    if (!validateDate(year, month)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date5.setUTCFullYear(year, month);
    return date5;
  }
  token = patterns2.DDD.exec(dateString);
  if (token) {
    date5 = /* @__PURE__ */ new Date(0);
    const dayOfYear = parseInt(token[1], 10);
    if (!validateDayOfYearDate(year, dayOfYear)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date5.setUTCFullYear(year, 0, dayOfYear);
    return date5;
  }
  token = patterns2.MMDD.exec(dateString);
  if (token) {
    date5 = /* @__PURE__ */ new Date(0);
    month = parseInt(token[1], 10) - 1;
    const day = parseInt(token[2], 10);
    if (!validateDate(year, month, day)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date5.setUTCFullYear(year, month, day);
    return date5;
  }
  token = patterns2.Www.exec(dateString);
  if (token) {
    week = parseInt(token[1], 10) - 1;
    if (!validateWeekDate(week)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week);
  }
  token = patterns2.WwwD.exec(dateString);
  if (token) {
    week = parseInt(token[1], 10) - 1;
    const dayOfWeek = parseInt(token[2], 10) - 1;
    if (!validateWeekDate(week, dayOfWeek)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week, dayOfWeek);
  }
  return null;
}
__name(parseDate, "parseDate");
function parseTime(timeString) {
  let hours;
  let minutes;
  let token = patterns2.HH.exec(timeString);
  if (token) {
    hours = parseFloat(token[1].replace(",", "."));
    if (!validateTime(hours)) {
      return NaN;
    }
    return (hours % 24) * MILLISECONDS_IN_HOUR2;
  }
  token = patterns2.HHMM.exec(timeString);
  if (token) {
    hours = parseInt(token[1], 10);
    minutes = parseFloat(token[2].replace(",", "."));
    if (!validateTime(hours, minutes)) {
      return NaN;
    }
    return (
      (hours % 24) * MILLISECONDS_IN_HOUR2 + minutes * MILLISECONDS_IN_MINUTE3
    );
  }
  token = patterns2.HHMMSS.exec(timeString);
  if (token) {
    hours = parseInt(token[1], 10);
    minutes = parseInt(token[2], 10);
    const seconds = parseFloat(token[3].replace(",", "."));
    if (!validateTime(hours, minutes, seconds)) {
      return NaN;
    }
    return (
      (hours % 24) * MILLISECONDS_IN_HOUR2 +
      minutes * MILLISECONDS_IN_MINUTE3 +
      seconds * 1e3
    );
  }
  return null;
}
__name(parseTime, "parseTime");
function dayOfISOWeekYear(isoWeekYear, week, day) {
  week = week || 0;
  day = day || 0;
  const date5 = /* @__PURE__ */ new Date(0);
  date5.setUTCFullYear(isoWeekYear, 0, 4);
  const fourthOfJanuaryDay = date5.getUTCDay() || 7;
  const diff = week * 7 + day + 1 - fourthOfJanuaryDay;
  date5.setUTCDate(date5.getUTCDate() + diff);
  return date5;
}
__name(dayOfISOWeekYear, "dayOfISOWeekYear");
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYearIndex(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}
__name(isLeapYearIndex, "isLeapYearIndex");
function validateDate(year, month, date5) {
  if (month < 0 || month > 11) {
    return false;
  }
  if (date5 != null) {
    if (date5 < 1) {
      return false;
    }
    const isLeapYear = isLeapYearIndex(year);
    if (isLeapYear && date5 > DAYS_IN_MONTH_LEAP_YEAR[month]) {
      return false;
    }
    if (!isLeapYear && date5 > DAYS_IN_MONTH[month]) {
      return false;
    }
  }
  return true;
}
__name(validateDate, "validateDate");
function validateDayOfYearDate(year, dayOfYear) {
  if (dayOfYear < 1) {
    return false;
  }
  const isLeapYear = isLeapYearIndex(year);
  if (isLeapYear && dayOfYear > 366) {
    return false;
  }
  if (!isLeapYear && dayOfYear > 365) {
    return false;
  }
  return true;
}
__name(validateDayOfYearDate, "validateDayOfYearDate");
function validateWeekDate(week, day) {
  if (week < 0 || week > 52) {
    return false;
  }
  if (day != null && (day < 0 || day > 6)) {
    return false;
  }
  return true;
}
__name(validateWeekDate, "validateWeekDate");
function validateTime(hours, minutes, seconds) {
  if (hours < 0 || hours >= 25) {
    return false;
  }
  if (minutes != null && (minutes < 0 || minutes >= 60)) {
    return false;
  }
  if (seconds != null && (seconds < 0 || seconds >= 60)) {
    return false;
  }
  return true;
}
__name(validateTime, "validateTime");

// node_modules/date-fns-tz/dist/esm/format/index.js
var tzFormattingTokensRegExp = /([xXOz]+)|''|'(''|[^'])+('|$)/g;
function format2(date5, formatStr, options = {}) {
  formatStr = String(formatStr);
  const matches = formatStr.match(tzFormattingTokensRegExp);
  if (matches) {
    const d = toDate2(options.originalDate || date5, options);
    formatStr = matches.reduce(function (result, token) {
      if (token[0] === "'") {
        return result;
      }
      const pos = result.indexOf(token);
      const precededByQuotedSection = result[pos - 1] === "'";
      const replaced = result.replace(
        token,
        "'" + formatters2[token[0]](d, token, options) + "'"
      );
      return precededByQuotedSection
        ? replaced.substring(0, pos - 1) + replaced.substring(pos + 1)
        : replaced;
    }, formatStr);
  }
  return format(date5, formatStr, options);
}
__name(format2, "format");

// node_modules/date-fns-tz/dist/esm/toZonedTime/index.js
function toZonedTime(date5, timeZone, options) {
  date5 = toDate2(date5, options);
  const offsetMilliseconds = tzParseTimezone(timeZone, date5, true);
  const d = new Date(date5.getTime() - offsetMilliseconds);
  const resultDate = /* @__PURE__ */ new Date(0);
  resultDate.setFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  resultDate.setHours(
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );
  return resultDate;
}
__name(toZonedTime, "toZonedTime");

// node_modules/date-fns-tz/dist/esm/formatInTimeZone/index.js
function formatInTimeZone(date5, timeZone, formatStr, options) {
  options = {
    ...options,
    timeZone,
    originalDate: date5,
  };
  return format2(
    toZonedTime(date5, timeZone, { timeZone: options.timeZone }),
    formatStr,
    options
  );
}
__name(formatInTimeZone, "formatInTimeZone");

// src/durable-objects/parking-store.ts
var AUCKLAND_TZ = "Pacific/Auckland";
var STATS_LIVE_ID = 1;
var isoNow = /* @__PURE__ */ __name(
  () => /* @__PURE__ */ new Date().toISOString(),
  "isoNow"
);
var isCoordinateRing = /* @__PURE__ */ __name(
  (value) =>
    Array.isArray(value) &&
    value.every(
      (line) =>
        Array.isArray(line) &&
        line.length >= 3 &&
        line.every(
          (point) =>
            Array.isArray(point) &&
            point.length === 2 &&
            typeof point[0] === "number" &&
            typeof point[1] === "number"
        )
    ),
  "isCoordinateRing"
);
var parseGeometryJson = /* @__PURE__ */ __name((raw2) => {
  if (raw2 === null || raw2 === void 0 || raw2 === "") {
    return [];
  }
  try {
    const parsed = JSON.parse(raw2);
    if (!isCoordinateRing(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}, "parseGeometryJson");
var filterRoadGeometry = /* @__PURE__ */ __name(
  (geometry) => geometry.filter((line) => line.length >= 3),
  "filterRoadGeometry"
);
var HAMILTON_CENTER_LAT = -37.787;
var HAMILTON_CENTER_LON = 175.279;
var GEOCODE_FAILURE_RETRY_MS = 7 * 24 * 60 * 60 * 1e3;
var GEOCODE_CANDIDATE_POOL = 500;
var isRecentGeocodeFailure = /* @__PURE__ */ __name((failedAt) => {
  if (failedAt === null || failedAt === void 0 || failedAt === "") {
    return false;
  }
  const failed = Date.parse(failedAt);
  if (Number.isNaN(failed)) {
    return false;
  }
  return Date.now() - failed < GEOCODE_FAILURE_RETRY_MS;
}, "isRecentGeocodeFailure");
var locationNeedsGeocode = /* @__PURE__ */ __name(
  (geometryJson, geocodeFailedAt) => {
    if (isRecentGeocodeFailure(geocodeFailedAt)) {
      return false;
    }
    const geometry = filterRoadGeometry(parseGeometryJson(geometryJson));
    return geometry.length === 0;
  },
  "locationNeedsGeocode"
);
var filterGeocodeCandidates = /* @__PURE__ */ __name((rows, limit) => {
  const results = [];
  for (const row of rows) {
    if (!locationNeedsGeocode(row.geometry_json, row.geocode_failed_at)) {
      continue;
    }
    results.push({
      count: row.count,
      street: row.street,
      suburb: row.suburb,
      town: row.town,
    });
    if (results.length >= limit) {
      break;
    }
  }
  return results;
}, "filterGeocodeCandidates");
var normalizeLocationGeometry = /* @__PURE__ */ __name((geometry) => {
  if (!isCoordinateRing(geometry)) {
    return [];
  }
  return filterRoadGeometry(geometry);
}, "normalizeLocationGeometry");
var toMapRouteRow = /* @__PURE__ */ __name((row) => {
  const geometry = filterRoadGeometry(parseGeometryJson(row.geometry_json));
  if (geometry.length === 0) {
    return null;
  }
  const suburbKey = row.suburb ?? "";
  return {
    count: row.count,
    geometry,
    id: `${row.street}|${suburbKey}`,
    street: row.street,
    suburb: row.suburb,
    town: row.town,
  };
}, "toMapRouteRow");
var formatDateInAuckland = /* @__PURE__ */ __name(
  (date5) => formatInTimeZone(date5, AUCKLAND_TZ, "yyyy-MM-dd"),
  "formatDateInAuckland"
);
var dateBounds = /* @__PURE__ */ __name(
  (dateStr) => ({
    end: `${dateStr}T23:59:59.999+12:00`,
    start: `${dateStr}T00:00:00+12:00`,
  }),
  "dateBounds"
);
var todayBounds = /* @__PURE__ */ __name((now) => {
  const today = formatInTimeZone(now, AUCKLAND_TZ, "yyyy-MM-dd");
  return {
    end: `${today}T23:59:59.999+12:00`,
    start: `${today}T00:00:00+12:00`,
  };
}, "todayBounds");
var monthBoundsInAuckland = /* @__PURE__ */ __name((now) => {
  const zoned = toZonedTime(now, AUCKLAND_TZ);
  const year = zoned.getFullYear();
  const month = zoned.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return {
    end: `${end}T23:59:59.999+12:00`,
    start: `${start}T00:00:00+12:00`,
  };
}, "monthBoundsInAuckland");
var yearBoundsInAuckland = /* @__PURE__ */ __name((now) => {
  const year = toZonedTime(now, AUCKLAND_TZ).getFullYear();
  return {
    end: `${year}-12-31T23:59:59.999+12:00`,
    start: `${year}-01-01T00:00:00+12:00`,
  };
}, "yearBoundsInAuckland");
var ParkingStore = class extends DurableObject {
  static {
    __name(this, "ParkingStore");
  }
  constructor(ctx, env2) {
    super(ctx, env2);
    void ctx.blockConcurrencyWhile(async () => {
      await this.migrate();
    });
  }
  fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    this.pushToSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, message2) {
    void this.ctx;
    const text =
      typeof message2 === "string"
        ? message2
        : new TextDecoder().decode(message2);
    if (text === "ping") {
      ws.send(JSON.stringify({ at: isoNow(), type: "pong" }));
    }
  }
  webSocketClose(ws, code, reason, _wasClean) {
    void this.ctx;
    ws.close(code, reason);
  }
  async migrate() {
    await Promise.resolve();
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
        id INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    const currentVersion = this.ctx.storage.sql
      .exec(
        "SELECT COALESCE(MAX(id), 0) as version FROM _sql_schema_migrations"
      )
      .one().version;
    if (currentVersion < 1) {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS infringements (
          infringement_number INTEGER PRIMARY KEY,
          occurred_at TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          street TEXT NOT NULL,
          suburb TEXT,
          town TEXT,
          post_code TEXT,
          offence_code TEXT,
          offence_description TEXT NOT NULL,
          offence_category TEXT,
          vehicle_make TEXT,
          vehicle_model TEXT,
          is_towed INTEGER NOT NULL DEFAULT 0,
          first_seen_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_infringements_occurred_at ON infringements (occurred_at);
        CREATE INDEX IF NOT EXISTS idx_infringements_street ON infringements (street);
        CREATE INDEX IF NOT EXISTS idx_infringements_offence_description ON infringements (offence_description);

        CREATE TABLE IF NOT EXISTS sync_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_type TEXT NOT NULL,
          window_start TEXT NOT NULL,
          window_end TEXT NOT NULL,
          fetched INTEGER NOT NULL DEFAULT 0,
          inserted INTEGER NOT NULL DEFAULT 0,
          updated INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          error TEXT,
          started_at TEXT NOT NULL,
          finished_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stats_live (
          id INTEGER PRIMARY KEY,
          all_time_total INTEGER NOT NULL DEFAULT 0,
          all_time_amount_cents INTEGER NOT NULL DEFAULT 0,
          today INTEGER NOT NULL DEFAULT 0,
          last_24h INTEGER NOT NULL DEFAULT 0,
          last_7d INTEGER NOT NULL DEFAULT 0,
          last_30d INTEGER NOT NULL DEFAULT 0,
          this_month INTEGER NOT NULL DEFAULT 0,
          this_year INTEGER NOT NULL DEFAULT 0,
          towed_all_time INTEGER NOT NULL DEFAULT 0,
          towed_today INTEGER NOT NULL DEFAULT 0,
          last_synced_at TEXT,
          last_record_at TEXT
        );

        INSERT OR IGNORE INTO stats_live (id) VALUES (1);

        CREATE TABLE IF NOT EXISTS daily_counts (
          date TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0,
          amount_cents INTEGER NOT NULL DEFAULT 0,
          towed_count INTEGER NOT NULL DEFAULT 0
        );

        INSERT INTO _sql_schema_migrations (id) VALUES (1);
      `);
    }
    if (currentVersion < 2) {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS ingest_watermarks (
          window_start TEXT NOT NULL,
          window_end TEXT NOT NULL,
          record_count INTEGER NOT NULL DEFAULT 0,
          ingested_at TEXT NOT NULL,
          PRIMARY KEY (window_start, window_end)
        );

        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        INSERT INTO _sql_schema_migrations (id) VALUES (2);
      `);
    }
    if (currentVersion < 3) {
      this.ctx.storage.sql.exec(`
        ALTER TABLE infringements ADD COLUMN closed_at TEXT;
        ALTER TABLE infringements ADD COLUMN additional_costs_cents INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE infringements ADD COLUMN court_serve_method TEXT;
        ALTER TABLE infringements ADD COLUMN vehicle_colour TEXT;
        ALTER TABLE infringements ADD COLUMN vehicle_type TEXT;
        ALTER TABLE infringements ADD COLUMN infringement_type INTEGER;

        CREATE TABLE IF NOT EXISTS location_cache (
          street TEXT NOT NULL,
          suburb TEXT NOT NULL DEFAULT '',
          town TEXT NOT NULL DEFAULT 'Hamilton',
          lat REAL NOT NULL,
          lon REAL NOT NULL,
          display_name TEXT NOT NULL DEFAULT '',
          geocoded_at TEXT NOT NULL,
          PRIMARY KEY (street, suburb)
        );

        CREATE INDEX IF NOT EXISTS idx_location_cache_coords ON location_cache (lat, lon);

        INSERT INTO _sql_schema_migrations (id) VALUES (3);
      `);
    }
    if (currentVersion < 4) {
      this.ctx.storage.sql.exec(`
        ALTER TABLE location_cache ADD COLUMN geometry_json TEXT;
        INSERT INTO _sql_schema_migrations (id) VALUES (4);
      `);
    }
    if (currentVersion < 5) {
      this.ctx.storage.sql.exec(`
        ALTER TABLE location_cache ADD COLUMN geocode_failed_at TEXT;
        INSERT INTO _sql_schema_migrations (id) VALUES (5);
      `);
    }
  }
  applySyncWindow(payload) {
    const runId = this.startSyncRun(
      payload.runType,
      payload.start,
      payload.end
    );
    try {
      const recordsUpserted = this.upsertInfringements(payload.records);
      this.recomputeStats();
      this.finishSyncRun(runId, "success", {
        fetched: payload.recordsFetched,
        upserted: recordsUpserted,
      });
      this.recordWatermark(payload.start, payload.end, payload.recordsFetched);
      this.setSyncMeta("last_hcc_fetch_at", isoNow());
      this.broadcastLiveUpdate();
      return {
        recordsFetched: payload.recordsFetched,
        recordsUpserted,
        runId,
        skipped: payload.skipped,
      };
    } catch (error51) {
      const message2 =
        error51 instanceof Error ? error51.message : String(error51);
      this.finishSyncRun(runId, "error", {
        error: message2,
        fetched: 0,
        upserted: 0,
      });
      throw error51;
    }
  }
  importInfringementBatch(payload) {
    const recordsUpserted = this.upsertInfringements(payload.records);
    if (payload.final) {
      this.recomputeStats();
      this.setSyncMeta("last_csv_import_at", isoNow());
      this.broadcastLiveUpdate();
    }
    return {
      recomputed: payload.final,
      recordsReceived: payload.recordsReceived,
      recordsUpserted,
      skipped: payload.skipped,
      totalRecords: this.countInfringementsSync(),
    };
  }
  getPublicLiveStats() {
    return this.readPublicLiveStatsSync();
  }
  readPublicLiveStatsSync() {
    const rows = this.ctx.storage.sql
      .exec("SELECT * FROM stats_live WHERE id = ? LIMIT 1", STATS_LIVE_ID)
      .toArray();
    const [row] = rows;
    if (row === void 0) {
      return {
        allTimeAmountCents: 0,
        allTimeTotal: 0,
        last24h: 0,
        last30d: 0,
        last7d: 0,
        lastRecordAt: null,
        lastSyncedAt: null,
        thisMonth: 0,
        today: 0,
        towedToday: 0,
      };
    }
    return {
      allTimeAmountCents: row.all_time_amount_cents,
      allTimeTotal: row.all_time_total,
      last24h: row.last_24h,
      last30d: row.last_30d,
      last7d: row.last_7d,
      lastRecordAt: row.last_record_at,
      lastSyncedAt: row.last_synced_at,
      thisMonth: row.this_month,
      today: row.today,
      towedToday: row.towed_today,
    };
  }
  getLiveStats() {
    const cached2 = this.ctx.storage.sql
      .exec(
        "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();
    const now = /* @__PURE__ */ new Date();
    const today = this.aggregatePeriod(
      todayBounds(now).start,
      todayBounds(now).end
    );
    const thisMonth = this.aggregatePeriod(
      monthBoundsInAuckland(now).start,
      monthBoundsInAuckland(now).end
    );
    const thisYear = this.aggregatePeriod(
      yearBoundsInAuckland(now).start,
      yearBoundsInAuckland(now).end
    );
    const allTime = this.ctx.storage.sql
      .exec(
        "SELECT count(*) as count, coalesce(sum(amount_cents), 0) as total_cents FROM infringements"
      )
      .one();
    return {
      allTime: {
        count: allTime?.count ?? 0,
        totalCents: allTime?.total_cents ?? 0,
      },
      thisMonth,
      thisYear,
      today,
      updatedAt: cached2?.last_synced_at ?? null,
    };
  }
  getDailyStats(from, to) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT date, count, amount_cents FROM daily_counts
         WHERE date >= ? AND date <= ?
         ORDER BY date`,
        from,
        to
      )
      .toArray();
    return rows.map((row) => ({
      count: row.count,
      date: row.date,
      totalCents: row.amount_cents,
    }));
  }
  getTopStats(groupBy, window, limit) {
    const column = groupBy === "street" ? "street" : "offence_description";
    const startDate =
      window === "all"
        ? null
        : formatDateInAuckland(
            subDays(/* @__PURE__ */ new Date(), window === "7d" ? 7 : 30)
          );
    const rows =
      startDate === null
        ? this.ctx.storage.sql
            .exec(
              `SELECT ${column} as key, count(*) as count, coalesce(sum(amount_cents), 0) as total_cents
             FROM infringements
             WHERE ${column} != ''
             GROUP BY ${column}
             ORDER BY count DESC
             LIMIT ?`,
              limit
            )
            .toArray()
        : this.ctx.storage.sql
            .exec(
              `SELECT ${column} as key, count(*) as count, coalesce(sum(amount_cents), 0) as total_cents
             FROM infringements
             WHERE ${column} != '' AND occurred_at >= ?
             GROUP BY ${column}
             ORDER BY count DESC
             LIMIT ?`,
              `${startDate}T00:00:00+12:00`,
              limit
            )
            .toArray();
    return rows.map((row) => ({
      count: row.count,
      key: row.key,
      totalCents: row.total_cents,
    }));
  }
  getPublicTop(groupBy, limit) {
    const rows = this.getTopStats(groupBy, "all", limit);
    return rows.map((row) => ({ count: row.count, label: row.key.trim() }));
  }
  getTopStreets(limit) {
    const rows = this.getTopStats("street", "all", limit);
    return rows.map((row) => ({
      count: row.count,
      label: row.key,
      street: row.key,
    }));
  }
  getTopSuburbs(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT coalesce(suburb, 'Unknown') as suburb, count(*) as count
         FROM infringements
         WHERE suburb IS NOT NULL AND suburb != ''
         GROUP BY suburb
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    return rows.map((row) => ({
      count: row.count,
      label: row.suburb,
      suburb: row.suburb,
    }));
  }
  getStreetsInSuburb(suburb, limit) {
    const result = this.browseStreets({
      limit,
      page: 1,
      sort: "count",
      suburb,
    });
    return result.items;
  }
  browseSuburbs(query) {
    const q = query.q?.trim() ?? "";
    const pattern = `%${q}%`;
    const offset = (query.page - 1) * query.limit;
    const orderBy =
      query.sort === "name" ? "label COLLATE NOCASE ASC" : "count DESC";
    const totalRow = this.ctx.storage.sql
      .exec(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(suburb), ''), 'Unknown') AS label,
                  count(*) AS count
           FROM infringements
           GROUP BY coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT count(*) AS total
         FROM grouped
         WHERE (? = '' OR lower(label) LIKE lower(?))`,
        q,
        pattern
      )
      .one();
    const rows = this.ctx.storage.sql
      .exec(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(suburb), ''), 'Unknown') AS label,
                  count(*) AS count
           FROM infringements
           GROUP BY coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT label, count
         FROM grouped
         WHERE (? = '' OR lower(label) LIKE lower(?))
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        q,
        pattern,
        query.limit,
        offset
      )
      .toArray();
    return {
      items: rows.map((row) => ({
        count: row.count,
        label: row.label,
        suburb: row.label,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }
  browseStreets(query) {
    const q = query.q?.trim() ?? "";
    const pattern = `%${q}%`;
    const offset = (query.page - 1) * query.limit;
    const orderBy =
      query.sort === "name" ? "street COLLATE NOCASE ASC" : "count DESC";
    let suburbFilter = "";
    if (
      query.suburb !== void 0 &&
      query.suburb !== null &&
      query.suburb !== ""
    ) {
      suburbFilter =
        query.suburb === "Unknown"
          ? "AND (suburb IS NULL OR trim(suburb) = '')"
          : "AND suburb = ?";
    }
    const suburbParams =
      query.suburb !== void 0 &&
      query.suburb !== null &&
      query.suburb !== "" &&
      query.suburb !== "Unknown"
        ? [query.suburb]
        : [];
    const totalRow = this.ctx.storage.sql
      .exec(
        `WITH grouped AS (
           SELECT street,
                  coalesce(nullif(trim(suburb), ''), 'Unknown') AS suburb,
                  count(*) AS count
           FROM infringements
           WHERE street != '' AND street != 'Unknown'
             ${suburbFilter}
           GROUP BY street, coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT count(*) AS total
         FROM grouped
         WHERE (? = '' OR lower(street) LIKE lower(?) OR lower(suburb) LIKE lower(?))`,
        ...suburbParams,
        q,
        pattern,
        pattern
      )
      .one();
    const rows = this.ctx.storage.sql
      .exec(
        `WITH grouped AS (
           SELECT street,
                  coalesce(nullif(trim(suburb), ''), 'Unknown') AS suburb,
                  count(*) AS count
           FROM infringements
           WHERE street != '' AND street != 'Unknown'
             ${suburbFilter}
           GROUP BY street, coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT street, suburb, count
         FROM grouped
         WHERE (? = '' OR lower(street) LIKE lower(?) OR lower(suburb) LIKE lower(?))
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        ...suburbParams,
        q,
        pattern,
        pattern,
        query.limit,
        offset
      )
      .toArray();
    return {
      items: rows.map((row) => ({
        count: row.count,
        label:
          row.suburb === "Unknown"
            ? row.street
            : `${row.street} \xB7 ${row.suburb}`,
        street: row.street,
        suburb: row.suburb,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }
  browseVehicles(query) {
    const q = query.q?.trim() ?? "";
    const pattern = `%${q}%`;
    const offset = (query.page - 1) * query.limit;
    const orderBy =
      query.sort === "name"
        ? "make COLLATE NOCASE ASC, model COLLATE NOCASE ASC"
        : "count DESC";
    const totalRow = this.ctx.storage.sql
      .exec(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') AS make,
                  coalesce(nullif(trim(vehicle_model), ''), '') AS model,
                  count(*) AS count
           FROM infringements
           WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
              OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
           GROUP BY vehicle_make, vehicle_model
         )
         SELECT count(*) AS total
         FROM grouped
         WHERE (? = '' OR lower(make) LIKE lower(?) OR lower(model) LIKE lower(?))`,
        q,
        pattern,
        pattern
      )
      .one();
    const rows = this.ctx.storage.sql
      .exec(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') AS make,
                  coalesce(nullif(trim(vehicle_model), ''), '') AS model,
                  count(*) AS count
           FROM infringements
           WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
              OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
           GROUP BY vehicle_make, vehicle_model
         )
         SELECT make, model, count
         FROM grouped
         WHERE (? = '' OR lower(make) LIKE lower(?) OR lower(model) LIKE lower(?))
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        q,
        pattern,
        pattern,
        query.limit,
        offset
      )
      .toArray();
    return {
      items: rows.map((row) => ({
        count: row.count,
        label: row.model ? `${row.make} ${row.model}` : row.make,
        make: row.make,
        model: row.model,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }
  getTopVehicles(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') as make,
                coalesce(nullif(trim(vehicle_model), ''), '') as model,
                count(*) as count
         FROM infringements
         WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
            OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
         GROUP BY vehicle_make, vehicle_model
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    return rows.map((row) => ({
      count: row.count,
      label: row.model ? `${row.make} ${row.model}` : row.make,
      make: row.make,
      model: row.model,
    }));
  }
  getLocationsNeedingGeocode(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json,
                lc.geocode_failed_at
         FROM infringements i
         LEFT JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND i.street != 'Unknown'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json, lc.geocode_failed_at
         ORDER BY count DESC
         LIMIT ?`,
        GEOCODE_CANDIDATE_POOL
      )
      .toArray();
    return filterGeocodeCandidates(rows, limit);
  }
  countLocationsNeedingGeocode() {
    return this.countLocationsNeedingGeocodeSync();
  }
  markGeocodeFailed(street, suburb, town) {
    const now = isoNow();
    this.ctx.storage.sql.exec(
      `INSERT INTO location_cache (street, suburb, town, lat, lon, display_name, geocoded_at, geometry_json, geocode_failed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
       ON CONFLICT(street, suburb) DO UPDATE SET
         town = excluded.town,
         geocode_failed_at = excluded.geocode_failed_at`,
      street,
      suburb ?? "",
      town,
      HAMILTON_CENTER_LAT,
      HAMILTON_CENTER_LON,
      "",
      now,
      now
    );
  }
  countLocationsNeedingGeocodeSync() {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json,
                lc.geocode_failed_at
         FROM infringements i
         LEFT JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND i.street != 'Unknown'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json, lc.geocode_failed_at
         ORDER BY count DESC`
      )
      .toArray();
    return filterGeocodeCandidates(rows, Number.MAX_SAFE_INTEGER).length;
  }
  saveLocationCache(input) {
    this.ctx.storage.sql.exec(
      `INSERT INTO location_cache (street, suburb, town, lat, lon, display_name, geocoded_at, geometry_json, geocode_failed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(street, suburb) DO UPDATE SET
         town = excluded.town,
         lat = excluded.lat,
         lon = excluded.lon,
         display_name = excluded.display_name,
         geocoded_at = excluded.geocoded_at,
         geometry_json = excluded.geometry_json,
         geocode_failed_at = NULL`,
      input.street,
      input.suburb ?? "",
      input.town,
      input.lat,
      input.lon,
      input.displayName,
      isoNow(),
      JSON.stringify(input.geometry)
    );
    this.broadcastLiveUpdate();
  }
  getMapPoints(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json
         FROM infringements i
         INNER JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND lc.geometry_json IS NOT NULL
           AND lc.geometry_json != ''
           AND lc.geometry_json != '[]'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    const pendingGeocode = this.countLocationsNeedingGeocodeSync();
    return {
      pendingGeocode,
      routes: rows
        .map((row) => toMapRouteRow(row))
        .filter((row) => row !== null),
    };
  }
  listInfringements(query) {
    const conditions = [];
    const params = [];
    if (query.from !== void 0 && query.from !== "") {
      conditions.push("occurred_at >= ?");
      params.push(`${query.from}T00:00:00+12:00`);
    }
    if (query.to !== void 0 && query.to !== "") {
      conditions.push("occurred_at <= ?");
      params.push(`${query.to}T23:59:59.999+12:00`);
    }
    if (query.street !== void 0 && query.street !== "") {
      conditions.push("street = ?");
      params.push(query.street);
    }
    if (query.suburb !== void 0 && query.suburb !== "") {
      if (query.suburb === "Unknown") {
        conditions.push("(suburb IS NULL OR suburb = '')");
      } else {
        conditions.push("suburb = ?");
        params.push(query.suburb);
      }
    }
    if (query.vehicleMake !== void 0 && query.vehicleMake !== "") {
      conditions.push(
        "coalesce(nullif(trim(vehicle_make), ''), 'Unknown') = ?"
      );
      params.push(query.vehicleMake);
    }
    if (query.vehicleModel !== void 0) {
      conditions.push("coalesce(nullif(trim(vehicle_model), ''), '') = ?");
      params.push(query.vehicleModel);
    }
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.limit;
    const totalRow = this.ctx.storage.sql
      .exec(
        `SELECT count(*) as total FROM infringements ${whereClause}`,
        ...params
      )
      .one();
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT * FROM infringements ${whereClause}
         ORDER BY occurred_at DESC
         LIMIT ? OFFSET ?`,
        ...params,
        query.limit,
        offset
      )
      .toArray();
    return {
      data: rows.map((row) => ({
        amountCents: row.amount_cents,
        firstSeenAt: row.first_seen_at,
        infringementNumber: row.infringement_number,
        isTowed: row.is_towed === 1,
        occurredAt: row.occurred_at,
        offenceCategory: row.offence_category,
        offenceCode: row.offence_code,
        offenceDescription: row.offence_description,
        postCode: row.post_code,
        street: row.street,
        suburb: row.suburb,
        town: row.town,
        updatedAt: row.updated_at,
        vehicleColour: row.vehicle_colour,
        vehicleMake: row.vehicle_make,
        vehicleModel: row.vehicle_model,
        vehicleType: row.vehicle_type,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }
  getLatestSyncRun() {
    const rows = this.ctx.storage.sql
      .exec(`SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`)
      .toArray();
    const [row] = rows;
    if (row === void 0) {
      return null;
    }
    return {
      error: row.error,
      fetched: row.fetched,
      finishedAt: row.finished_at,
      id: row.id,
      inserted: row.inserted,
      runType: row.run_type,
      startedAt: row.started_at,
      status: row.status,
      updated: row.updated,
      windowEnd: row.window_end,
      windowStart: row.window_start,
    };
  }
  isWindowIngested(start, end) {
    return this.hasWatermark(start, end);
  }
  filterPendingChunks(windows) {
    return windows.filter(
      (window) => !this.hasWatermark(window.start, window.end)
    );
  }
  getCacheStatus() {
    const totalRow = this.ctx.storage.sql
      .exec("SELECT count(*) as total FROM infringements")
      .one();
    const watermarkRow = this.ctx.storage.sql
      .exec("SELECT count(*) as count FROM ingest_watermarks")
      .one();
    const statsRow = this.ctx.storage.sql
      .exec(
        "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();
    return {
      ingestWindows: watermarkRow?.count ?? 0,
      lastHccFetchAt: this.getSyncMeta("last_hcc_fetch_at"),
      lastSyncedAt: statsRow?.last_synced_at ?? null,
      source: "parking-store",
      totalRecords: totalRow?.total ?? 0,
    };
  }
  broadcastLiveUpdate() {
    const sockets = this.ctx.getWebSockets();
    if (sockets.length === 0) {
      return;
    }
    const payload = JSON.stringify({
      type: "full",
      ...this.buildFullDashboardSnapshotSync(),
    });
    for (const ws of sockets) {
      try {
        ws.send(payload);
      } catch {}
    }
  }
  pushToSocket(ws) {
    try {
      ws.send(
        JSON.stringify({
          type: "full",
          ...this.buildFullDashboardSnapshotSync(),
        })
      );
    } catch {}
  }
  buildFullDashboardSnapshotSync() {
    return {
      at: isoNow(),
      live: this.readPublicLiveStatsSync(),
      map: this.readMapPointsSync(50),
      recentInfringements: this.listInfringements({
        limit: 15,
        page: 1,
      }).data,
      streets: this.readTopStreetsRankedSync(10),
      suburbs: this.readTopSuburbsRankedSync(10),
      topOffences: this.readTopGroupedSync("offence", 5),
      topStreets: this.readTopGroupedSync("street", 5),
      vehicles: this.readTopVehiclesSync(10),
    };
  }
  readTopGroupedSync(groupBy, limit) {
    const column = groupBy === "street" ? "street" : "offence_description";
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT ${column} as key, count(*) as count
         FROM infringements
         WHERE ${column} != ''
         GROUP BY ${column}
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    return rows.map((row) => ({
      count: row.count,
      label: row.key.trim(),
    }));
  }
  readTopStreetsRankedSync(limit) {
    return this.readTopGroupedSync("street", limit).map((row) => ({
      count: row.count,
      label: row.label,
      street: row.label,
    }));
  }
  readTopSuburbsRankedSync(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT coalesce(suburb, 'Unknown') as suburb, count(*) as count
         FROM infringements
         WHERE suburb IS NOT NULL AND suburb != ''
         GROUP BY suburb
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    return rows.map((row) => ({
      count: row.count,
      label: row.suburb,
      suburb: row.suburb,
    }));
  }
  readTopVehiclesSync(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') as make,
                coalesce(nullif(trim(vehicle_model), ''), '') as model,
                count(*) as count
         FROM infringements
         WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
            OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
         GROUP BY vehicle_make, vehicle_model
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    return rows.map((row) => ({
      count: row.count,
      label: row.model ? `${row.make} ${row.model}` : row.make,
      make: row.make,
      model: row.model,
    }));
  }
  readMapPointsSync(limit) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json
         FROM infringements i
         INNER JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND lc.geometry_json IS NOT NULL
           AND lc.geometry_json != ''
           AND lc.geometry_json != '[]'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();
    return {
      pendingGeocode: this.countLocationsNeedingGeocodeSync(),
      routes: rows
        .map((row) => toMapRouteRow(row))
        .filter((row) => row !== null),
    };
  }
  countInfringementsSync() {
    const totalRow = this.ctx.storage.sql
      .exec("SELECT count(*) as total FROM infringements")
      .one();
    return totalRow?.total ?? 0;
  }
  startSyncRun(runType, start, end) {
    const result = this.ctx.storage.sql.exec(
      `INSERT INTO sync_runs (run_type, window_start, window_end, status, started_at)
       VALUES (?, ?, ?, 'running', ?)
       RETURNING id`,
      runType,
      start,
      end,
      isoNow()
    );
    const runId = result.one().id;
    if (!runId) {
      throw new Error("Failed to create sync run");
    }
    return runId;
  }
  finishSyncRun(runId, status, details) {
    this.ctx.storage.sql.exec(
      `UPDATE sync_runs
       SET finished_at = ?, status = ?, fetched = ?, inserted = ?, updated = 0, error = ?
       WHERE id = ?`,
      isoNow(),
      status,
      details.fetched,
      details.upserted,
      details.error ?? null,
      runId
    );
  }
  upsertInfringements(records) {
    if (records.length === 0) {
      return 0;
    }
    const now = isoNow();
    for (const record2 of records) {
      this.ctx.storage.sql.exec(
        `INSERT INTO infringements (
          infringement_number, occurred_at, closed_at, amount_cents,
          additional_costs_cents, street, suburb, town, post_code,
          offence_code, offence_description, offence_category,
          infringement_type, court_serve_method,
          vehicle_colour, vehicle_make, vehicle_model, vehicle_type,
          is_towed, first_seen_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(infringement_number) DO UPDATE SET
          occurred_at = excluded.occurred_at,
          closed_at = excluded.closed_at,
          amount_cents = excluded.amount_cents,
          additional_costs_cents = excluded.additional_costs_cents,
          street = excluded.street,
          suburb = excluded.suburb,
          town = excluded.town,
          post_code = excluded.post_code,
          offence_code = excluded.offence_code,
          offence_description = excluded.offence_description,
          offence_category = excluded.offence_category,
          infringement_type = excluded.infringement_type,
          court_serve_method = excluded.court_serve_method,
          vehicle_colour = excluded.vehicle_colour,
          vehicle_make = excluded.vehicle_make,
          vehicle_model = excluded.vehicle_model,
          vehicle_type = excluded.vehicle_type,
          is_towed = excluded.is_towed,
          updated_at = excluded.updated_at`,
        record2.infringementNumber,
        record2.occurredAt,
        record2.closedAt,
        record2.amountCents,
        record2.additionalCostsCents,
        record2.street,
        record2.suburb,
        record2.town,
        record2.postCode,
        record2.offenceCode,
        record2.offenceDescription,
        record2.offenceCategory,
        record2.infringementType,
        record2.courtServeMethod,
        record2.vehicleColour,
        record2.vehicleMake,
        record2.vehicleModel,
        record2.vehicleType,
        record2.isTowed ? 1 : 0,
        now,
        now
      );
    }
    return records.length;
  }
  aggregateWindow(start, end) {
    const row = this.ctx.storage.sql
      .exec(
        `SELECT count(*) as count,
                coalesce(sum(amount_cents), 0) as amount_cents,
                coalesce(sum(case when is_towed = 1 then 1 else 0 end), 0) as towed_count
         FROM infringements
         WHERE occurred_at >= ? AND occurred_at <= ?`,
        start,
        end
      )
      .one();
    return {
      amountCents: row?.amount_cents ?? 0,
      count: row?.count ?? 0,
      towedCount: row?.towed_count ?? 0,
    };
  }
  aggregatePeriod(start, end) {
    const row = this.aggregateWindow(start, end);
    return { count: row.count, totalCents: row.amountCents };
  }
  recomputeStats() {
    const now = /* @__PURE__ */ new Date();
    const today = formatDateInAuckland(now);
    const todayWindow = dateBounds(today);
    const monthBounds = monthBoundsInAuckland(now);
    const yearBounds = yearBoundsInAuckland(now);
    const last24hStart = subDays(now, 1).toISOString();
    const last7dStart = formatDateInAuckland(subDays(now, 7));
    const last30dStart = formatDateInAuckland(subDays(now, 30));
    const allTime = this.aggregateWindow(
      "1970-01-01T00:00:00+12:00",
      "2099-12-31T23:59:59.999+12:00"
    );
    const todayStats = this.aggregateWindow(todayWindow.start, todayWindow.end);
    const monthStats = this.aggregateWindow(monthBounds.start, monthBounds.end);
    const yearStats = this.aggregateWindow(yearBounds.start, yearBounds.end);
    const last24h = this.aggregateWindow(last24hStart, isoNow());
    const last7d = this.aggregateWindow(
      `${last7dStart}T00:00:00+12:00`,
      todayWindow.end
    );
    const last30d = this.aggregateWindow(
      `${last30dStart}T00:00:00+12:00`,
      todayWindow.end
    );
    const lastRecord = this.ctx.storage.sql
      .exec("SELECT max(occurred_at) as latest FROM infringements")
      .one();
    const syncedAt = isoNow();
    this.ctx.storage.sql.exec(
      `INSERT INTO stats_live (
        id, all_time_total, all_time_amount_cents, today, last_24h, last_7d,
        last_30d, this_month, this_year, towed_all_time, towed_today,
        last_synced_at, last_record_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        all_time_total = excluded.all_time_total,
        all_time_amount_cents = excluded.all_time_amount_cents,
        today = excluded.today,
        last_24h = excluded.last_24h,
        last_7d = excluded.last_7d,
        last_30d = excluded.last_30d,
        this_month = excluded.this_month,
        this_year = excluded.this_year,
        towed_all_time = excluded.towed_all_time,
        towed_today = excluded.towed_today,
        last_synced_at = excluded.last_synced_at,
        last_record_at = excluded.last_record_at`,
      STATS_LIVE_ID,
      allTime.count,
      allTime.amountCents,
      todayStats.count,
      last24h.count,
      last7d.count,
      last30d.count,
      monthStats.count,
      yearStats.count,
      allTime.towedCount,
      todayStats.towedCount,
      syncedAt,
      lastRecord?.latest ?? null
    );
    const dailyRows = this.ctx.storage.sql
      .exec(
        `SELECT substr(occurred_at, 1, 10) as date,
                count(*) as count,
                coalesce(sum(amount_cents), 0) as amount_cents,
                coalesce(sum(case when is_towed = 1 then 1 else 0 end), 0) as towed_count
         FROM infringements
         GROUP BY substr(occurred_at, 1, 10)`
      )
      .toArray();
    for (const row of dailyRows) {
      this.ctx.storage.sql.exec(
        `INSERT INTO daily_counts (date, count, amount_cents, towed_count)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           count = excluded.count,
           amount_cents = excluded.amount_cents,
           towed_count = excluded.towed_count`,
        row.date,
        row.count,
        row.amount_cents,
        row.towed_count
      );
    }
  }
  hasWatermark(start, end) {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT 1 as found FROM ingest_watermarks
         WHERE window_start = ? AND window_end = ?
         LIMIT 1`,
        start,
        end
      )
      .toArray();
    return rows.length > 0;
  }
  recordWatermark(start, end, recordCount) {
    this.ctx.storage.sql.exec(
      `INSERT INTO ingest_watermarks (window_start, window_end, record_count, ingested_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(window_start, window_end) DO UPDATE SET
         record_count = excluded.record_count,
         ingested_at = excluded.ingested_at`,
      start,
      end,
      recordCount,
      isoNow()
    );
  }
  setSyncMeta(key, value) {
    this.ctx.storage.sql.exec(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  }
  getSyncMeta(key) {
    const row = this.ctx.storage.sql
      .exec("SELECT value FROM sync_meta WHERE key = ? LIMIT 1", key)
      .one();
    return row?.value ?? null;
  }
};

// src/server/locations.ts
var getTopStreets = /* @__PURE__ */ __name(
  async (env2, limit = 10) => await getParkingStore(env2).getTopStreets(limit),
  "getTopStreets"
);
var getTopSuburbs = /* @__PURE__ */ __name(
  async (env2, limit = 10) => await getParkingStore(env2).getTopSuburbs(limit),
  "getTopSuburbs"
);
var getMapPoints = /* @__PURE__ */ __name(async (env2, limit = 50) => {
  const result = await getParkingStore(env2).getMapPoints(limit);
  return {
    pendingGeocode: result.pendingGeocode,
    routes: result.routes.map((route) => ({
      ...route,
      geometry: normalizeLocationGeometry(route.geometry),
    })),
  };
}, "getMapPoints");

// src/server/public-stats.ts
var getPublicLiveStats = /* @__PURE__ */ __name(
  async (env2) => await getParkingStore(env2).getPublicLiveStats(),
  "getPublicLiveStats"
);
var getPublicTopStreets = /* @__PURE__ */ __name(
  async (env2, limit = 5) =>
    await getParkingStore(env2).getPublicTop("street", limit),
  "getPublicTopStreets"
);
var getPublicTopOffences = /* @__PURE__ */ __name(
  async (env2, limit = 5) =>
    await getParkingStore(env2).getPublicTop("offence", limit),
  "getPublicTopOffences"
);

// src/server/stats.ts
var getLiveStats = /* @__PURE__ */ __name(
  async (env2) => await getParkingStore(env2).getLiveStats(),
  "getLiveStats"
);
var getDailyStats = /* @__PURE__ */ __name(
  async (env2, from, to) => await getParkingStore(env2).getDailyStats(from, to),
  "getDailyStats"
);
var getTopStats = /* @__PURE__ */ __name(
  async (env2, groupBy, window, limit) =>
    await getParkingStore(env2).getTopStats(groupBy, window, limit),
  "getTopStats"
);
var listInfringements = /* @__PURE__ */ __name(
  async (env2, query) => await getParkingStore(env2).listInfringements(query),
  "listInfringements"
);

// src/server/hcc-client.ts
var DEFAULT_API_BASE =
  "https://api.hcc.govt.nz/OpenData/get_parking_infringement";
var hccPagingSchema = external_exports.object({
  Current_Page: external_exports.number(),
  Dataset_Name: external_exports.string().optional(),
  Page_Count: external_exports.number(),
  Page_Size: external_exports.number(),
});
var hccInfringementResponseSchema = external_exports.object({
  Data: external_exports
    .array(
      external_exports.record(
        external_exports.string(),
        external_exports.unknown()
      )
    )
    .optional(),
  Paging: external_exports.array(hccPagingSchema).min(1),
});
var apiBase = /* @__PURE__ */ __name((env2) => {
  const base = env2.HCC_API_BASE ?? DEFAULT_API_BASE;
  if (base.includes("get_parking_infringement")) {
    return base;
  }
  return `${base.replace(/\/$/u, "")}/get_parking_infringement`;
}, "apiBase");
var fetchInfringements = /* @__PURE__ */ __name(async (env2, options) => {
  const url2 = new URL(apiBase(env2));
  url2.searchParams.set("Page", String(options.page));
  url2.searchParams.set("Start_Date", options.startDate);
  url2.searchParams.set("End_Date", options.endDate);
  const response = await fetch(url2.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `HCC API error ${response.status}: ${await response.text()}`
    );
  }
  const parsed = hccInfringementResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("HCC API response missing Paging metadata");
  }
  return parsed.data;
}, "fetchInfringements");
var fetchRemainingPages = /* @__PURE__ */ __name(
  async (env2, startDate, endDate, page, pageCount, pageSize, records) => {
    if (page > pageCount) {
      const possiblyTruncated =
        pageCount === 1 && records.length >= pageSize && records.length > 0;
      return { pageCount, pageSize, possiblyTruncated, records };
    }
    const response = await fetchInfringements(env2, {
      endDate,
      page,
      startDate,
    });
    const [paging] = response.Paging;
    if (paging === void 0) {
      const possiblyTruncated =
        pageCount === 1 && records.length >= pageSize && records.length > 0;
      return { pageCount, pageSize, possiblyTruncated, records };
    }
    const nextRecords = [...records];
    if (response.Data !== void 0 && response.Data.length > 0) {
      nextRecords.push(...response.Data);
    }
    return await fetchRemainingPages(
      env2,
      startDate,
      endDate,
      page + 1,
      paging.Page_Count,
      paging.Page_Size,
      nextRecords
    );
  },
  "fetchRemainingPages"
);
var fetchAllInWindow = /* @__PURE__ */ __name(
  async (env2, startDate, endDate) => {
    const response = await fetchInfringements(env2, {
      endDate,
      page: 1,
      startDate,
    });
    const [paging] = response.Paging;
    if (paging === void 0) {
      return {
        pageCount: 0,
        pageSize: 1e4,
        possiblyTruncated: false,
        records: [],
      };
    }
    const records = [];
    if (response.Data !== void 0 && response.Data.length > 0) {
      records.push(...response.Data);
    }
    if (paging.Page_Count <= 1) {
      const possiblyTruncated =
        records.length >= paging.Page_Size && records.length > 0;
      return {
        pageCount: paging.Page_Count,
        pageSize: paging.Page_Size,
        possiblyTruncated,
        records,
      };
    }
    return await fetchRemainingPages(
      env2,
      startDate,
      endDate,
      2,
      paging.Page_Count,
      paging.Page_Size,
      records
    );
  },
  "fetchAllInWindow"
);

// src/server/sync.ts
var AUCKLAND_TZ2 = "Pacific/Auckland";
var BACKFILL_EARLIEST = "2020-01-01";
var HOURLY_OVERLAP_DAYS = 7;
var PAGE_SIZE_LIMIT = 1e4;
var formatDateInAuckland2 = /* @__PURE__ */ __name(
  (date5) => formatInTimeZone(date5, AUCKLAND_TZ2, "yyyy-MM-dd"),
  "formatDateInAuckland"
);
var addDays2 = /* @__PURE__ */ __name((dateStr, days) => {
  const date5 = /* @__PURE__ */ new Date(`${dateStr}T12:00:00Z`);
  date5.setUTCDate(date5.getUTCDate() + days);
  return date5.toISOString().slice(0, 10);
}, "addDays");
var splitDateRange = /* @__PURE__ */ __name((startDate, endDate) => {
  const chunks = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    const chunkEnd = addDays2(cursor, 6);
    chunks.push({
      end: chunkEnd > endDate ? endDate : chunkEnd,
      start: cursor,
    });
    cursor = addDays2(chunkEnd, 1);
  }
  return chunks;
}, "splitDateRange");
var syncWindow = /* @__PURE__ */ __name(async (env2, options, prefetched) => {
  const store = getParkingStore(env2);
  if (options.force !== true && prefetched === void 0) {
    const alreadyIngested = await store.isWindowIngested(
      options.start,
      options.end
    );
    if (alreadyIngested) {
      return {
        hccSkipped: true,
        possiblyTruncated: false,
        recordsFetched: 0,
        recordsUpserted: 0,
        runId: 0,
        skipped: 0,
      };
    }
  }
  const { records, possiblyTruncated } =
    prefetched ?? (await fetchAllInWindow(env2, options.start, options.end));
  const { cleaned, skipped } = cleanInfringements(records);
  const result = await store.applySyncWindow({
    end: options.end,
    records: cleaned,
    recordsFetched: records.length,
    runType: options.runType,
    skipped,
    start: options.start,
  });
  return {
    ...result,
    hccSkipped: false,
    possiblyTruncated,
  };
}, "syncWindow");
var hourlySync = /* @__PURE__ */ __name(async (env2, runType = "hourly") => {
  const today = formatDateInAuckland2(/* @__PURE__ */ new Date());
  const start = addDays2(today, -HOURLY_OVERLAP_DAYS);
  return await syncWindow(env2, { end: today, force: true, runType, start });
}, "hourlySync");
var startBackfill = /* @__PURE__ */ __name(async (env2, options) => {
  const today = formatDateInAuckland2(/* @__PURE__ */ new Date());
  const chunks = splitDateRange(BACKFILL_EARLIEST, today);
  const store = getParkingStore(env2);
  const pending =
    options?.force === true ? chunks : await store.filterPendingChunks(chunks);
  await Promise.all(
    pending.map(async (chunk) => {
      const message2 = {
        endDate: chunk.end,
        force: options?.force,
        startDate: chunk.start,
      };
      return await env2.BACKFILL_QUEUE.send(message2);
    })
  );
  return {
    enqueued: pending.length,
    skipped: chunks.length - pending.length,
    total: chunks.length,
  };
}, "startBackfill");
var processBackfillMessage = /* @__PURE__ */ __name(async (env2, message2) => {
  const store = getParkingStore(env2);
  if (message2.force !== true) {
    const alreadyIngested = await store.isWindowIngested(
      message2.startDate,
      message2.endDate
    );
    if (alreadyIngested) {
      return { skipped: true, split: false };
    }
  }
  const fetched = await fetchAllInWindow(
    env2,
    message2.startDate,
    message2.endDate
  );
  if (
    fetched.possiblyTruncated ||
    (fetched.pageCount === 1 && fetched.records.length >= PAGE_SIZE_LIMIT)
  ) {
    const start = /* @__PURE__ */ new Date(`${message2.startDate}T12:00:00Z`);
    const end = /* @__PURE__ */ new Date(`${message2.endDate}T12:00:00Z`);
    const midpoint = new Date((start.getTime() + end.getTime()) / 2);
    const midStr = midpoint.toISOString().slice(0, 10);
    if (midStr > message2.startDate && midStr < message2.endDate) {
      await env2.BACKFILL_QUEUE.send({
        endDate: midStr,
        force: message2.force,
        startDate: message2.startDate,
      });
      await env2.BACKFILL_QUEUE.send({
        endDate: message2.endDate,
        force: message2.force,
        startDate: addDays2(midStr, 1),
      });
      return { split: true };
    }
  }
  const result = await syncWindow(
    env2,
    {
      end: message2.endDate,
      force: message2.force,
      runType: "backfill",
      start: message2.startDate,
    },
    fetched
  );
  return { result, split: false };
}, "processBackfillMessage");
var getLatestSyncRun = /* @__PURE__ */ __name(
  async (env2) => await getParkingStore(env2).getLatestSyncRun(),
  "getLatestSyncRun"
);

// src/app.ts
var app = new Hono2();
var STORED_HEADERS = {
  "Cache-Control": "public, max-age=60",
  "X-Data-Source": "stored",
};
var storedJson = /* @__PURE__ */ __name(
  (c, body, status = 200) => c.json(body, status, STORED_HEADERS),
  "storedJson"
);
var jsonError = /* @__PURE__ */ __name(
  (status, message2) => Response.json({ error: message2 }, { status }),
  "jsonError"
);
var handleAppError = /* @__PURE__ */ __name((error51, _c) => {
  if (error51 instanceof HTTPException) {
    return error51.getResponse();
  }
  console.error(error51);
  return jsonError(500, "Internal server error");
}, "handleAppError");
app.onError(handleAppError);
var assertApiKey = /* @__PURE__ */ __name((request, env2) => {
  if (!verifyApiKey(request, env2)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
}, "assertApiKey");
var assertApiKeyOrCronSecret = /* @__PURE__ */ __name((request, env2) => {
  if (!verifyApiKeyOrCronSecret(request, env2)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
}, "assertApiKeyOrCronSecret");
var parsePositiveInt = /* @__PURE__ */ __name((value, fallback) => {
  if (value === void 0 || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}, "parsePositiveInt");
var parseDateParam = /* @__PURE__ */ __name((value) => {
  if (value === void 0 || value === "") {
    return void 0;
  }
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : void 0;
}, "parseDateParam");
var parseForceFlag = /* @__PURE__ */ __name(
  (value) => value === "1" || value === "true" || value === "yes",
  "parseForceFlag"
);
var parseBrowseSort = /* @__PURE__ */ __name(
  (value) => (value === "name" ? "name" : "count"),
  "parseBrowseSort"
);
var optionalTrimmedQuery = /* @__PURE__ */ __name((value) => {
  const trimmed = value?.trim();
  return trimmed !== void 0 && trimmed !== "" ? trimmed : void 0;
}, "optionalTrimmedQuery");
var isTopGroupBy = /* @__PURE__ */ __name(
  (value) => value === "street" || value === "offence",
  "isTopGroupBy"
);
var isTopWindow = /* @__PURE__ */ __name(
  (value) => value === "all" || value === "7d" || value === "30d",
  "isTopWindow"
);
app.get("/api/health", async (c) => {
  const cache = await getCacheStatus(c.env);
  return c.json({
    dataSource: cache.source,
    status: "ok",
    timestamp: /* @__PURE__ */ new Date().toISOString(),
    totalRecords: cache.totalRecords,
  });
});
app.get("/api/public/cache", async (c) => {
  const cache = await getCacheStatus(c.env);
  return storedJson(c, {
    meta: {
      description:
        "All public endpoints serve data from ParkingStore. HCC Open Data is only contacted during background sync.",
      ingestWindows: cache.ingestWindows,
      lastHccFetchAt: cache.lastHccFetchAt,
      lastSyncedAt: cache.lastSyncedAt,
      source: cache.source,
      totalRecords: cache.totalRecords,
    },
  });
});
app.get("/api/public/stats/live", async (c) => {
  try {
    const data = await getPublicLiveStats(c.env);
    return storedJson(c, {
      data,
      meta: { source: "stored" },
    });
  } catch (error51) {
    console.error("public live stats error", error51);
    return jsonError(500, "Failed to load live stats");
  }
});
app.get("/api/public/live/ws", async (c) => {
  const stub = getParkingStore(c.env);
  return await stub.fetch(c.req.raw);
});
app.get("/api/public/stats/top", async (c) => {
  const groupBy = c.req.query("groupBy") ?? "street";
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 5), 20);
  if (groupBy !== "street" && groupBy !== "offence") {
    return jsonError(400, "groupBy must be street or offence");
  }
  try {
    const items =
      groupBy === "street"
        ? await getPublicTopStreets(c.env, limit)
        : await getPublicTopOffences(c.env, limit);
    return storedJson(c, {
      data: { groupBy, items },
      meta: { source: "stored" },
    });
  } catch (error51) {
    console.error("public top stats error", error51);
    return jsonError(500, "Failed to load top stats");
  }
});
app.get("/api/public/locations/streets", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
  const streets = await getTopStreets(c.env, limit);
  return storedJson(c, { data: streets, meta: { source: "stored" } });
});
app.get("/api/public/locations/suburbs", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
  const suburbs = await getTopSuburbs(c.env, limit);
  return storedJson(c, { data: suburbs, meta: { source: "stored" } });
});
app.get("/api/public/locations/map", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 100);
  c.executionCtx.waitUntil(geocodeMissingLocations(c.env, 25));
  const map2 = await getMapPoints(c.env, limit);
  return storedJson(c, {
    data: map2,
    meta: {
      geocoder: "Overpass (Hamilton)",
      mapTiles: "OpenStreetMap",
      source: "stored",
    },
  });
});
app.get("/api/public/vehicles/top", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
  const vehicles = await getTopVehicles(c.env, limit);
  return storedJson(c, { data: vehicles, meta: { source: "stored" } });
});
app.get("/api/public/infringements/recent", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 15), 50);
  const result = await listInfringements(c.env, {
    limit,
    page: 1,
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});
app.get("/api/public/browse/suburbs", async (c) => {
  const result = await browseSuburbs(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});
app.get("/api/public/browse/streets", async (c) => {
  const result = await browseStreets(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
    suburb: optionalTrimmedQuery(c.req.query("suburb")),
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});
app.get("/api/public/browse/vehicles", async (c) => {
  const result = await browseVehicles(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});
app.get("/api/public/explore/suburbs/:suburb/streets", async (c) => {
  const suburb = decodeURIComponent(c.req.param("suburb")).trim();
  if (suburb === "") {
    return jsonError(400, "suburb required");
  }
  const result = await browseStreets(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
    suburb,
  });
  return storedJson(c, { meta: { source: "stored", suburb }, ...result });
});
app.get("/api/public/explore/infringements", async (c) => {
  const page = parsePositiveInt(c.req.query("page"), 1);
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 15), 50);
  const street = optionalTrimmedQuery(c.req.query("street"));
  const suburb = optionalTrimmedQuery(c.req.query("suburb"));
  const vehicleMake = optionalTrimmedQuery(c.req.query("vehicleMake"));
  const vehicleModel = optionalTrimmedQuery(c.req.query("vehicleModel"));
  if (street === void 0 && suburb === void 0 && vehicleMake === void 0) {
    return jsonError(
      400,
      "At least one of street, suburb, or vehicleMake is required"
    );
  }
  const result = await exploreInfringements(c.env, {
    limit,
    page,
    street,
    suburb,
    vehicleMake,
    vehicleModel,
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});
app.get("/api/v1/cache/status", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const cache = await getCacheStatus(c.env);
  return storedJson(c, {
    ...cache,
    hccFetchPolicy: {
      backfill: "skips already-ingested windows",
      force: "POST /api/v1/sync/backfill?force=true",
      hourly: "last 7 days only",
    },
  });
});
app.get("/api/v1/stats/live", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const stats = await getLiveStats(c.env);
  return storedJson(c, { meta: { source: "stored" }, ...stats });
});
app.get("/api/v1/stats/daily", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const from = parseDateParam(c.req.query("from"));
  const to = parseDateParam(c.req.query("to"));
  if (from === void 0 || to === void 0) {
    return jsonError(400, "from and to query params required (YYYY-MM-DD)");
  }
  const stats = await getDailyStats(c.env, from, to);
  return storedJson(c, { data: stats, from, meta: { source: "stored" }, to });
});
app.get("/api/v1/stats/top", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const groupByParam = c.req.query("groupBy");
  const windowParam = c.req.query("window") ?? "all";
  const limit = parsePositiveInt(c.req.query("limit"), 10);
  if (!isTopGroupBy(groupByParam)) {
    return jsonError(400, "groupBy must be street or offence");
  }
  if (!isTopWindow(windowParam)) {
    return jsonError(400, "window must be all, 7d, or 30d");
  }
  const data = await getTopStats(
    c.env,
    groupByParam,
    windowParam,
    Math.min(limit, 100)
  );
  return storedJson(c, {
    data,
    groupBy: groupByParam,
    limit,
    meta: { source: "stored" },
    window: windowParam,
  });
});
app.get("/api/v1/infringements", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const page = parsePositiveInt(c.req.query("page"), 1);
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 200);
  const from = parseDateParam(c.req.query("from"));
  const to = parseDateParam(c.req.query("to"));
  const street = optionalTrimmedQuery(c.req.query("street"));
  const suburb = optionalTrimmedQuery(c.req.query("suburb"));
  const vehicleMake = optionalTrimmedQuery(c.req.query("vehicleMake"));
  const vehicleModel = optionalTrimmedQuery(c.req.query("vehicleModel"));
  const result = await listInfringements(c.env, {
    from,
    limit,
    page,
    street,
    suburb,
    to,
    vehicleMake,
    vehicleModel,
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});
app.get("/api/v1/health", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const [latestRun, cache] = await Promise.all([
    getLatestSyncRun(c.env),
    getCacheStatus(c.env),
  ]);
  return storedJson(c, {
    cache,
    status: "ok",
    sync: latestRun
      ? {
          endDate: latestRun.windowEnd,
          errorMessage: latestRun.error,
          finishedAt: latestRun.finishedAt,
          id: latestRun.id,
          recordsFetched: latestRun.fetched,
          recordsUpserted: latestRun.inserted + latestRun.updated,
          runType: latestRun.runType,
          startDate: latestRun.windowStart,
          startedAt: latestRun.startedAt,
          status: latestRun.status,
        }
      : null,
  });
});
app.post("/api/v1/sync", async (c) => {
  assertApiKeyOrCronSecret(c.req.raw, c.env);
  try {
    const result = await hourlySync(c.env, "manual");
    return c.json({ ok: true, ...result });
  } catch (error51) {
    const message2 =
      error51 instanceof Error ? error51.message : String(error51);
    return jsonError(500, message2);
  }
});
app.post("/api/v1/sync/backfill", async (c) => {
  assertApiKey(c.req.raw, c.env);
  try {
    const force = parseForceFlag(c.req.query("force"));
    const result = await startBackfill(c.env, { force });
    return c.json({ force, ok: true, ...result });
  } catch (error51) {
    const message2 =
      error51 instanceof Error ? error51.message : String(error51);
    return jsonError(500, message2);
  }
});
app.post("/api/v1/import/infringements", async (c) => {
  assertApiKey(c.req.raw, c.env);
  try {
    const body = await c.req.json();
    const result = await importInfringements(c.env, body);
    return c.json({ ok: true, ...result });
  } catch (error51) {
    const message2 =
      error51 instanceof Error ? error51.message : String(error51);
    return jsonError(400, message2);
  }
});
app.post("/api/v1/geocode/run", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 100);
  const result = await geocodeMissingLocations(c.env, limit);
  return c.json({ ok: true, ...result });
});
app.notFound((c) => c.json({ error: "Not found" }, 404));

// src/worker.ts
var worker_default = {
  async fetch(request, env2, ctx) {
    const url2 = new URL(request.url);
    if (!url2.pathname.startsWith("/api/")) {
      return await env2.ASSETS.fetch(request.url);
    }
    return await app.fetch(request, env2, ctx);
  },
  async queue(batch, env2) {
    const processMessageAt = /* @__PURE__ */ __name(async (index) => {
      if (index >= batch.messages.length) {
        return;
      }
      const message2 = batch.messages[index];
      if (message2 === void 0) {
        return;
      }
      try {
        const outcome = await processBackfillMessage(env2, message2.body);
        if (outcome.split) {
          console.log(
            "split backfill window",
            message2.body.startDate,
            message2.body.endDate
          );
        }
        message2.ack();
      } catch (error51) {
        console.error("backfill message failed", message2.body, error51);
        message2.retry();
      }
      await processMessageAt(index + 1);
    }, "processMessageAt");
    await processMessageAt(0);
  },
  scheduled(_controller, env2, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          await hourlySync(env2);
          await geocodeMissingLocations(env2, 25);
        } catch (error51) {
          console.error("hourly sync failed", error51);
        }
      })()
    );
  },
};
export { ParkingStore, worker_default as default };
//# sourceMappingURL=worker.js.map
