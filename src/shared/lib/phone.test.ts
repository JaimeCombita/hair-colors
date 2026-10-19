import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["3001112233", "+573001112233"],
    ["300 111 2233", "+573001112233"],
    ["(300) 111-2233", "+573001112233"],
    ["573001112233", "+573001112233"],
    ["+57 300 111 2233", "+573001112233"],
    ["0057 300 111 2233", "+573001112233"],
    ["+1 415 555 0132", "+14155550132"],
  ])("normaliza %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "abc", "300111223", "+0123456789", "30011122334"])(
    "rechaza %j",
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    },
  );
});
