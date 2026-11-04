import { describe, expect, it } from "vitest";
import { clientIp } from "./_core/rateLimit";

describe("rate-limit client identity", () => {
  it("uses Express's resolved client IP instead of the first raw X-Forwarded-For value", () => {
    const request = {
      ip: "203.0.113.10",
      headers: { "x-forwarded-for": "198.51.100.77, 203.0.113.10" },
      socket: { remoteAddress: "10.0.0.4" },
    };
    expect(clientIp(request as never)).toBe("203.0.113.10");
  });

  it("falls back to the socket address when Express has no resolved IP", () => {
    const request = { ip: "", headers: { "x-forwarded-for": "198.51.100.77" }, socket: { remoteAddress: "10.0.0.4" } };
    expect(clientIp(request as never)).toBe("10.0.0.4");
  });
});
