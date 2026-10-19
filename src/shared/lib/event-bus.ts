export interface BaseEvent {
  type: string;
}

export interface EventBus<E extends BaseEvent> {
  publish(event: E): Promise<void>;
  subscribe<T extends E["type"]>(
    type: T,
    handler: (event: Extract<E, { type: T }>) => void | Promise<void>,
  ): () => void;
}

interface EventBusOptions {
  onError?: (error: unknown, event: BaseEvent) => void;
}

/** Bus en memoria. Un suscriptor que falla no afecta a quien publica ni a los demás suscriptores. */
export function createEventBus<E extends BaseEvent>({ onError }: EventBusOptions = {}): EventBus<E> {
  const handlers = new Map<string, Set<(event: E) => void | Promise<void>>>();

  return {
    async publish(event) {
      const subscribers = [...(handlers.get(event.type) ?? [])];
      const results = await Promise.allSettled(subscribers.map(async (handler) => handler(event)));
      for (const result of results) {
        if (result.status === "rejected") onError?.(result.reason, event);
      }
    },
    subscribe(type, handler) {
      const set = handlers.get(type) ?? new Set();
      set.add(handler as (event: E) => void | Promise<void>);
      handlers.set(type, set);
      return () => {
        set.delete(handler as (event: E) => void | Promise<void>);
      };
    },
  };
}
