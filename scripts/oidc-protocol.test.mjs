// Offline protocol verification against a synthetic IdP transport, never a real Auth0 tenant.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { generateKeyPairSync, sign, createHash } from "node:crypto";
const requireApi = createRequire(
  new URL("../apps/api/package.json", import.meta.url),
);
requireApi("reflect-metadata");
const issuer = "https://idp.example.test/";
const originalFetch = globalThis.fetch;
const previous = { ...process.env };
const key = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = {
  ...key.publicKey.export({ format: "jwk" }),
  kid: "synthetic",
  alg: "RS256",
  use: "sig",
};
let mutation = "none",
  nonce,
  verifier,
  provider;
let tokenRequests = 0,
  jwksRequests = 0;
const json = (body) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
before(() => {
  Object.assign(process.env, {
    NODE_ENV: "test",
    COMMERCIAL_AUTH_ENABLED: "true",
    WEB_ORIGIN: "http://localhost:5173",
    OIDC_ISSUER: issuer,
    OIDC_CLIENT_ID: "synthetic-client",
    OIDC_CLIENT_SECRET: "synthetic-secret",
    OIDC_REDIRECT_URI: "http://localhost:5173/api/auth/callback",
    COMMERCIAL_STATE_KEY: "f".repeat(64),
  });
  globalThis.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input);
    assert.equal(
      url.origin,
      new URL(issuer).origin,
      "Only synthetic IdP traffic is permitted",
    );
    if (url.pathname === "/.well-known/openid-configuration")
      return json({
        issuer,
        authorization_endpoint: `${issuer}authorize`,
        token_endpoint: `${issuer}oauth/token`,
        jwks_uri: `${issuer}jwks`,
        end_session_endpoint: `${issuer}oidc/logout`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        token_endpoint_auth_methods_supported: ["client_secret_post"],
        code_challenge_methods_supported: ["S256"],
      });
    if (url.pathname === "/jwks") {
      jwksRequests++;
      return json({ keys: [jwk] });
    }
    if (url.pathname === "/oauth/token") {
      tokenRequests++;
      const body = new URLSearchParams(options.body);
      assert.equal(body.get("code_verifier"), verifier);
      assert.equal(body.get("redirect_uri"), process.env.OIDC_REDIRECT_URI);
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        iss: issuer,
        aud: "synthetic-client",
        sub: "synthetic-user",
        email: "fixture@example.test",
        email_verified: true,
        iat: now,
        exp: now + 3600,
        nonce,
      };
      if (mutation === "issuer") claims.iss = "https://wrong.example.test/";
      if (mutation === "audience") claims.aud = "another-client";
      if (mutation === "nonce") claims.nonce = "incorrect";
      if (mutation === "expired") claims.exp = now - 600;
      if (mutation === "unverified") claims.email_verified = false;
      const encode = (value) =>
        Buffer.from(JSON.stringify(value)).toString("base64url");
      const unsigned = `${encode({ alg: "RS256", kid: "synthetic" })}.${encode(claims)}`;
      const signature = sign(
        "RSA-SHA256",
        Buffer.from(unsigned),
        mutation === "signature" ? otherKey.privateKey : key.privateKey,
      ).toString("base64url");
      return json({
        access_token: "synthetic-provider-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        id_token: `${unsigned}.${signature}`,
      });
    }
    throw new Error("Unexpected synthetic IdP request");
  };
  const { OidcProvider } = requireApi("./dist/commercial/oidc.provider.js");
  provider = new OidcProvider();
});
after(() => {
  globalThis.fetch = originalFetch;
  process.env = previous;
});
const secrets = () => {
  nonce = "synthetic-nonce";
  verifier = "a".repeat(43);
  return { nonce, verifier, next: "/app/servicios" };
};
const callback = (state) =>
  new URL(
    `${process.env.OIDC_REDIRECT_URI}?code=synthetic-code&state=${state}`,
  );
test("real openid-client in Node 24 validates RS256 and PKCE; adapter returns no tokens", async () => {
  mutation = "none";
  const secret = secrets();
  const start = new URL(
    await provider.begin(
      "signup",
      "synthetic-state",
      secret,
      "fixture@example.test",
    ),
  );
  assert.equal(start.searchParams.get("screen_hint"), "signup");
  assert.equal(start.searchParams.get("code_challenge_method"), "S256");
  assert.equal(
    start.searchParams.get("code_challenge"),
    createHash("sha256").update(verifier).digest("base64url"),
  );
  const identity = await provider.exchange(
    callback("synthetic-state"),
    "synthetic-state",
    secret,
  );
  assert.equal(identity.verified, true);
  assert.deepEqual(Object.keys(identity).sort(), [
    "email",
    "expiresAt",
    "issuer",
    "subject",
    "verified",
  ]);
  assert.ok(jwksRequests > 0);
});
for (const invalid of ["signature", "issuer", "audience", "nonce", "expired"])
  test(`OIDC rejects incorrect ${invalid}`, async () => {
    mutation = invalid;
    await assert.rejects(
      provider.exchange(
        callback("synthetic-state"),
        "synthetic-state",
        secrets(),
      ),
    );
  });
test("OIDC rejects changed state before the token endpoint", async () => {
  const beforeCount = tokenRequests;
  await assert.rejects(
    provider.exchange(callback("attacker-state"), "synthetic-state", secrets()),
  );
  assert.equal(tokenRequests, beforeCount);
});
test("unverified email is preserved as unverified; recovery stays at the provider", async () => {
  mutation = "unverified";
  assert.equal(
    (
      await provider.exchange(
        callback("synthetic-state"),
        "synthetic-state",
        secrets(),
      )
    ).verified,
    false,
  );
  const start = new URL(
    await provider.begin("recover", "synthetic-state", secrets()),
  );
  assert.equal(start.searchParams.get("prompt"), "login");
  assert.equal(start.searchParams.has("screen_hint"), false);
});
test("RP logout uses the configured provider and fixed return address", async () => {
  const url = new URL(await provider.logoutUrl());
  assert.equal(url.origin, new URL(issuer).origin);
  assert.equal(
    url.searchParams.get("post_logout_redirect_uri"),
    "http://localhost:5173/login",
  );
});
