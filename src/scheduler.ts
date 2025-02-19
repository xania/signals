export type ScheduledTask = () => void;
export type BatchTasks = (queue: ScheduledTask[]) => void;
export type StopFlushUpdates = () => void;

export type Scheduler = {
  enqueue: (task: ScheduledTask) => void;
  enqueueBatch: (batch: BatchTasks) => void;
  flush: () => void;
  flushSync: () => void;
  onFlush: (callback: () => void) => StopFlushUpdates;
};

/**
 * Creates a scheduler which batches tasks and runs them in the microtask queue.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide}
 * @example
 * ```ts
 * const scheduler = createScheduler();
 *
 * // Queue tasks.
 * scheduler.enqueue(() => {});
 * scheduler.enqueue(() => {});
 *
 * // Schedule a flush - can be invoked more than once.
 * scheduler.flush();
 *
 * // Run a synchronous flush.
 * await scheduler.flushSync();
 * ```
 */
export function createScheduler(): Scheduler {
  let i = 0,
    j = 0,
    scheduled = false,
    flushing = false,
    tasks: ScheduledTask[] = [],
    afterTasks: (() => void)[] = [];

  function enqueue(task: ScheduledTask) {
    tasks.push(task);
    if (!scheduled) scheduleFlush();
  }

  function enqueueBatch(batch: BatchTasks) {
    batch(tasks);
    if (!scheduled) scheduleFlush();
  }

  function scheduleFlush() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(flush);
  }

  function flush() {
    if (flushing) return;
    try {
      flushing = true;
      scheduled = true;
      do {
        for (; i < tasks.length; i++) tasks[i]();
        for (j = 0; j < afterTasks.length; j++) afterTasks[j]();
      } while (tasks.length > i);
    } finally {
      i = 0;
      tasks = [];
      flushing = false;
      scheduled = false;
    }
  }

  return {
    enqueue,
    enqueueBatch,
    flush: scheduleFlush,
    flushSync: flush,
    onFlush: hook(afterTasks),
  };
}

function hook(callbacks: (() => void)[]) {
  return function removeFlushHook(callback: () => void) {
    callbacks.push(callback);
    return () => callbacks.splice(callbacks.indexOf(callback), 1);
  };
}
