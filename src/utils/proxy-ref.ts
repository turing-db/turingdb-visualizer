type ProxyCallback = () => void

export class ProxyRef<T extends object> {
  private getter: () => T
  private methodCallbacks: Map<symbol | string, ProxyCallback> = new Map<
    symbol | string,
    ProxyCallback
  >()

  private constructor(getter: () => T) {
    this.getter = getter
  }

  protected get target(): T {
    return this.getter()
  }

  public hook(methodName: symbol | string, callback: ProxyCallback): void {
    this.methodCallbacks.set(methodName, callback)
  }

  public unhook(methodName: symbol | string): boolean {
    if (!this.methodCallbacks.has(methodName)) {
      return false
    }

    this.methodCallbacks.delete(methodName)
    return true
  }

  // Create a proxied version of the object
  static create<U extends object>(
    getter: () => U
  ): U & {
    hook: (methodName: symbol | string, callback: ProxyCallback) => void
    unhook: (methodName: symbol | string, callback: ProxyCallback) => boolean
  } {
    const ref = new ProxyRef(getter)

    // biome-ignore lint/suspicious/noExplicitAny:  This would be complex to handle the type system
    const proxy = new Proxy<any>(
      {},
      {
        get: (_target, prop) => {
          // Handle the hook and unhook methods on the proxy itself
          if (prop === 'hook') {
            return ref.hook.bind(ref)
          }
          if (prop === 'unhook') {
            return ref.unhook.bind(ref)
          }

          const actualTarget = ref.target
          const value = Reflect.get(actualTarget, prop, actualTarget)

          if (typeof value === 'function') {
            // biome-ignore lint/suspicious/noExplicitAny:  This would be complex to handle the type system
            return (...args: any[]) => {
              const result = value.apply(actualTarget, args)

              if (result instanceof Promise) {
                // For Promise-returning methods, return a new Promise
                // that triggers callbacks after the original Promise resolves
                return result.then((resolvedValue) => {
                  const callback = ref.methodCallbacks.get(prop)
                  if (callback) {
                    callback()
                  }
                  return resolvedValue
                })
              }

              const callback = ref.methodCallbacks.get(prop)
              if (callback) {
                callback()
              }

              return result
            }
          }

          return value
        },
        set: (_target, prop, value) => {
          const actualTarget = ref.target
          return Reflect.set(actualTarget, prop, value, actualTarget)
        },
        has: (_target, prop) => {
          if (prop === 'hook' || prop === 'unhook') {
            return true
          }
          const actualTarget = ref.target
          return Reflect.has(actualTarget, prop)
        },
        deleteProperty: (_target, prop) => {
          const actualTarget = ref.target
          return Reflect.deleteProperty(actualTarget, prop)
        },
        getPrototypeOf: () => {
          const actualTarget = ref.target
          return Object.getPrototypeOf(actualTarget)
        },
      }
    )

    return proxy as U & {
      hook: (methodName: string | symbol | string, callback: ProxyCallback) => void
      unhook: (methodName: string | symbol | string, callback: ProxyCallback) => boolean
    }
  }
}
