import { describe, expect, it, vi } from "vitest";
import { createEventBus } from "./event-bus";

type TestEvent = { type: "a"; value: number } | { type: "b" };

describe("createEventBus", () => {
  it("entrega el evento solo a los suscriptores de su tipo", async () => {
    const bus = createEventBus<TestEvent>();
    const onA = vi.fn();
    const onB = vi.fn();
    bus.subscribe("a", onA);
    bus.subscribe("b", onB);

    await bus.publish({ type: "a", value: 1 });

    expect(onA).toHaveBeenCalledWith({ type: "a", value: 1 });
    expect(onB).not.toHaveBeenCalled();
  });

  it("permite cancelar la suscripción", async () => {
    const bus = createEventBus<TestEvent>();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe("b", handler);
    unsubscribe();

    await bus.publish({ type: "b" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("aísla los errores de un suscriptor y los reporta", async () => {
    const onError = vi.fn();
    const bus = createEventBus<TestEvent>({ onError });
    const healthy = vi.fn();
    bus.subscribe("b", () => {
      throw new Error("falló");
    });
    bus.subscribe("b", healthy);

    await expect(bus.publish({ type: "b" })).resolves.toBeUndefined();

    expect(healthy).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
