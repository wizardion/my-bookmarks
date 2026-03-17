export { IEventListener, AppMessageTypes, IAppMessage } from './models/core.models';

export const RUNTIME_ID = chrome.runtime.id;

export function delay(milliseconds: number = 200): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Returns a promise that resolves at the start of the next animation frame.
 * The promise resolves with the timestamp provided by the browser.
 */
export function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

export function CachedAsync(
  _target: any,
  _propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const cache = new Map<string, any>();
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]): Promise<any> {
    const key = args.join('');

    if (cache.has(key)) {
      return cache.get(key);
    }

    const results = await originalMethod.apply(this, args);

    cache.set(key, results);

    return results;
  };

  return descriptor;
}
