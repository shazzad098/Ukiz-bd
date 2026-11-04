import { afterEach, describe, expect, it } from "vitest";
import { httpsRedirect } from "./_core/securityHeaders";

const originalNodeEnv = process.env.NODE_ENV;
const originalPublicUrl = process.env.PUBLIC_APP_URL;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalPublicUrl === undefined) delete process.env.PUBLIC_APP_URL;
  else process.env.PUBLIC_APP_URL = originalPublicUrl;
});

describe("canonical HTTPS redirect", () => {
  it("does not use an untrusted Host header as the redirect origin", () => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_APP_URL = "https://shop.example/ignored-path";
    const response = {
      statusCode: 0,
      location: "",
      redirect(status: number, url: string) { this.statusCode = status; this.location = url; },
    };
    let nextCalled = false;

    httpsRedirect()({ protocol: "http", headers: { host: "attacker.example" }, originalUrl: "/shop?search=amber" } as never, response as never, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(response.statusCode).toBe(301);
    expect(response.location).toBe("https://shop.example/shop?search=amber");
  });

  it("does not manually trust a raw X-Forwarded-Proto header when Express says the request is HTTP", () => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_APP_URL = "https://shop.example";
    const response = {
      statusCode: 0,
      location: "",
      redirect(status: number, url: string) { this.statusCode = status; this.location = url; },
    };

    httpsRedirect()({ protocol: "http", headers: { "x-forwarded-proto": "https" }, originalUrl: "/" } as never, response as never, () => undefined);

    expect(response.statusCode).toBe(301);
    expect(response.location).toBe("https://shop.example/");
  });
});
