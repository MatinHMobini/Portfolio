/**
 * DEV-ONLY test helper. Some embedded/headless browsers pause
 * requestAnimationFrame when the view is not visible. Opening the dev
 * server with ?raf-timer drives frames from a 60 Hz timer instead so the
 * animations can be tested. Vite removes this code from production builds.
 */
if (import.meta.env.DEV && new URLSearchParams(location.search).has('raf-timer')) {
  let id = 0;
  const timers = new Map<number, number>();
  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const handle = ++id;
    timers.set(handle, window.setTimeout(() => {
      timers.delete(handle);
      cb(performance.now());
    }, 16));
    return handle;
  };
  window.cancelAnimationFrame = (handle: number): void => {
    clearTimeout(timers.get(handle));
    timers.delete(handle);
  };
}

export {};
