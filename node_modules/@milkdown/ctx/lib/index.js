import { contextNotFound, ctxCallOutOfScope, timerNotFound } from "@milkdown/exception";
class Container {
  constructor() {
    this.sliceMap = /* @__PURE__ */ new Map();
    this.get = (slice) => {
      const context = typeof slice === "string" ? [...this.sliceMap.values()].find((x) => x.type.name === slice) : this.sliceMap.get(slice.id);
      if (!context) {
        const name = typeof slice === "string" ? slice : slice.name;
        throw contextNotFound(name);
      }
      return context;
    };
    this.remove = (slice) => {
      const context = typeof slice === "string" ? [...this.sliceMap.values()].find((x) => x.type.name === slice) : this.sliceMap.get(slice.id);
      if (!context) return;
      this.sliceMap.delete(context.type.id);
    };
    this.has = (slice) => {
      if (typeof slice === "string")
        return [...this.sliceMap.values()].some((x) => x.type.name === slice);
      return this.sliceMap.has(slice.id);
    };
  }
}
class Slice {
  /// @internal
  constructor(container, value, type) {
    this.#watchers = [];
    this.#emit = () => {
      this.#watchers.forEach((watcher) => watcher(this.#value));
    };
    this.set = (value2) => {
      this.#value = value2;
      this.#emit();
    };
    this.get = () => this.#value;
    this.update = (updater) => {
      this.#value = updater(this.#value);
      this.#emit();
    };
    this.type = type;
    this.#value = value;
    container.set(type.id, this);
  }
  #watchers;
  /// @internal
  #value;
  #emit;
  /// Add a watcher for changes in the slice.
  /// Returns a function to remove the watcher.
  on(watcher) {
    this.#watchers.push(watcher);
    return () => {
      this.#watchers = this.#watchers.filter((w) => w !== watcher);
    };
  }
  /// Add a one-time watcher for changes in the slice.
  /// The watcher will be removed after it is called.
  /// Returns a function to remove the watcher.
  once(watcher) {
    const off = this.on((value) => {
      watcher(value);
      off();
    });
    return off;
  }
  /// Remove a watcher.
  off(watcher) {
    this.#watchers = this.#watchers.filter((w) => w !== watcher);
  }
  /// Remove all watchers.
  offAll() {
    this.#watchers = [];
  }
}
class SliceType {
  /// Create a slice type with a default value and a name.
  /// The name should be unique in the container.
  constructor(value, name) {
    this.id = Symbol(`Context-${name}`);
    this.name = name;
    this._defaultValue = value;
    this._typeInfo = () => {
      throw ctxCallOutOfScope();
    };
  }
  /// Create a slice with a container.
  /// You can also pass a value to override the default value.
  create(container, value = this._defaultValue) {
    return new Slice(container, value, this);
  }
}
const createSlice = (value, name) => new SliceType(value, name);
class Inspector {
  /// Create an inspector with container, clock and metadata.
  constructor(container, clock, meta) {
    this.#injectedSlices = /* @__PURE__ */ new Set();
    this.#consumedSlices = /* @__PURE__ */ new Set();
    this.#recordedTimers = /* @__PURE__ */ new Map();
    this.#waitTimers = /* @__PURE__ */ new Map();
    this.read = () => {
      return {
        metadata: this.#meta,
        injectedSlices: [...this.#injectedSlices].map((slice) => ({
          name: typeof slice === "string" ? slice : slice.name,
          value: this.#getSlice(slice)
        })),
        consumedSlices: [...this.#consumedSlices].map((slice) => ({
          name: typeof slice === "string" ? slice : slice.name,
          value: this.#getSlice(slice)
        })),
        recordedTimers: [...this.#recordedTimers].map(
          ([timer, { duration }]) => ({
            name: timer.name,
            duration,
            status: this.#getTimer(timer)
          })
        ),
        waitTimers: [...this.#waitTimers].map(([timer, { duration }]) => ({
          name: timer.name,
          duration,
          status: this.#getTimer(timer)
        }))
      };
    };
    this.onRecord = (timerType) => {
      this.#recordedTimers.set(timerType, { start: Date.now(), duration: 0 });
    };
    this.onClear = (timerType) => {
      this.#recordedTimers.delete(timerType);
    };
    this.onDone = (timerType) => {
      const timer = this.#recordedTimers.get(timerType);
      if (!timer) return;
      timer.duration = Date.now() - timer.start;
    };
    this.onWait = (timerType, promise) => {
      const start = Date.now();
      promise.finally(() => {
        this.#waitTimers.set(timerType, { duration: Date.now() - start });
      }).catch(console.error);
    };
    this.onInject = (sliceType) => {
      this.#injectedSlices.add(sliceType);
    };
    this.onRemove = (sliceType) => {
      this.#injectedSlices.delete(sliceType);
    };
    this.onUse = (sliceType) => {
      this.#consumedSlices.add(sliceType);
    };
    this.#getSlice = (sliceType) => {
      return this.#container.get(sliceType).get();
    };
    this.#getTimer = (timerType) => {
      return this.#clock.get(timerType).status;
    };
    this.#container = container;
    this.#clock = clock;
    this.#meta = meta;
  }
  /// @internal
  #meta;
  /// @internal
  #container;
  /// @internal
  #clock;
  #injectedSlices;
  #consumedSlices;
  #recordedTimers;
  #waitTimers;
  #getSlice;
  #getTimer;
}
class Ctx {
  /// Create a ctx object with container and clock.
  constructor(container, clock, meta) {
    this.produce = (meta2) => {
      if (meta2 && Object.keys(meta2).length)
        return new Ctx(this.#container, this.#clock, { ...meta2 });
      return this;
    };
    this.inject = (sliceType, value) => {
      const slice = sliceType.create(this.#container.sliceMap);
      if (value != null) slice.set(value);
      this.#inspector?.onInject(sliceType);
      return this;
    };
    this.remove = (sliceType) => {
      this.#container.remove(sliceType);
      this.#inspector?.onRemove(sliceType);
      return this;
    };
    this.record = (timerType) => {
      timerType.create(this.#clock.store);
      this.#inspector?.onRecord(timerType);
      return this;
    };
    this.clearTimer = (timerType) => {
      this.#clock.remove(timerType);
      this.#inspector?.onClear(timerType);
      return this;
    };
    this.isInjected = (sliceType) => this.#container.has(sliceType);
    this.isRecorded = (timerType) => this.#clock.has(timerType);
    this.use = (sliceType) => {
      this.#inspector?.onUse(sliceType);
      return this.#container.get(sliceType);
    };
    this.get = (sliceType) => this.use(sliceType).get();
    this.set = (sliceType, value) => this.use(sliceType).set(value);
    this.update = (sliceType, updater) => this.use(sliceType).update(updater);
    this.timer = (timer) => this.#clock.get(timer);
    this.done = (timer) => {
      this.timer(timer).done();
      this.#inspector?.onDone(timer);
    };
    this.wait = (timer) => {
      const promise = this.timer(timer).start();
      this.#inspector?.onWait(timer, promise);
      return promise;
    };
    this.waitTimers = async (slice) => {
      await Promise.all(this.get(slice).map((x) => this.wait(x)));
    };
    this.#container = container;
    this.#clock = clock;
    this.#meta = meta;
    if (meta) this.#inspector = new Inspector(container, clock, meta);
  }
  /// @internal
  #container;
  /// @internal
  #clock;
  /// @internal
  #meta;
  /// @internal
  #inspector;
  /// Get metadata of the ctx.
  get meta() {
    return this.#meta;
  }
  /// Get the inspector of the ctx.
  get inspector() {
    return this.#inspector;
  }
}
class Clock {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
    this.get = (timer) => {
      const meta = this.store.get(timer.id);
      if (!meta) throw timerNotFound(timer.name);
      return meta;
    };
    this.remove = (timer) => {
      this.store.delete(timer.id);
    };
    this.has = (timer) => {
      return this.store.has(timer.id);
    };
  }
}
class Timer {
  /// @internal
  constructor(clock, type) {
    this.#promise = null;
    this.#listener = null;
    this.#status = "pending";
    this.start = () => {
      this.#promise ??= new Promise((resolve, reject) => {
        this.#listener = (e) => {
          if (!(e instanceof CustomEvent)) return;
          if (e.detail.id === this.#eventUniqId) {
            this.#status = "resolved";
            this.#removeListener();
            e.stopImmediatePropagation();
            resolve();
          }
        };
        this.#waitTimeout(() => {
          if (this.#status === "pending") this.#status = "rejected";
          this.#removeListener();
          reject(new Error(`Timing ${this.type.name} timeout.`));
        });
        this.#status = "pending";
        addEventListener(this.type.name, this.#listener);
      });
      return this.#promise;
    };
    this.done = () => {
      const event = new CustomEvent(this.type.name, {
        detail: { id: this.#eventUniqId }
      });
      dispatchEvent(event);
    };
    this.#removeListener = () => {
      if (this.#listener) removeEventListener(this.type.name, this.#listener);
    };
    this.#waitTimeout = (ifTimeout) => {
      setTimeout(() => {
        ifTimeout();
      }, this.type.timeout);
    };
    this.#eventUniqId = Symbol(type.name);
    this.type = type;
    clock.set(type.id, this);
  }
  #promise;
  #listener;
  /// @internal
  #eventUniqId;
  #status;
  /// The status of the timer.
  /// Can be `pending`, `resolved` or `rejected`.
  get status() {
    return this.#status;
  }
  #removeListener;
  #waitTimeout;
}
class TimerType {
  /// Create a timer type with a name and a timeout.
  /// The name should be unique in the clock.
  constructor(name, timeout = 3e3) {
    this.create = (clock) => {
      return new Timer(clock, this);
    };
    this.id = Symbol(`Timer-${name}`);
    this.name = name;
    this.timeout = timeout;
  }
}
const createTimer = (name, timeout = 3e3) => new TimerType(name, timeout);
export {
  Clock,
  Container,
  Ctx,
  Inspector,
  Slice,
  SliceType,
  Timer,
  TimerType,
  createSlice,
  createTimer
};
//# sourceMappingURL=index.js.map
