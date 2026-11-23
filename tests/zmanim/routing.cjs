/* Actual routing/provider source; only SDK hooks are replaced to observe routing boundaries. */
const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  ts = require("typescript"),
  { NextRequest } = require("next/server");
let website = 0,
  protectedCalls = 0,
  path = "/zmanim";
function source(file, overrides = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    loadedModule = { exports: {} };
  vm.runInNewContext("(function(require,module,exports){" + code + "})", {
    console,
    process,
  })(
    (name) =>
      Object.hasOwn(overrides, name) ? overrides[name] : require(name),
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}
(async () => {
  const sdk = {
    createRouteMatcher: () => (req) =>
      /^\/(dashboard|admin)(\/|$)/.test(req.nextUrl.pathname),
    clerkMiddleware: (fn) => async (req) => {
      website++;
      return fn(
        Object.assign(async () => ({}), {
          protect: async () => {
            protectedCalls++;
          },
        }),
        req,
      );
    },
  };
  const middleware = source("middleware.ts", {
    "@clerk/nextjs/server": sdk,
  }).default;
  for (const p of [
    "/zmanim",
    "/api/zmanim",
    "/miniapp",
    "/api/community/cities",
  ]) {
    const r = await middleware(
      new NextRequest("https://local.invalid" + p),
      {},
    );
    assert.equal(r.status, 200);
    assert.equal(website, 0);
  }
  for (const p of ["/dashboard", "/dashboard/telegram", "/admin"])
    await middleware(new NextRequest("https://local.invalid" + p), {});
  assert.equal(protectedCalls, 3);
  for (const p of ["/events", "/zmanim-other", "/zmanim"])
    await middleware(
      new NextRequest("https://local.invalid" + p, { method: "POST" }),
      {},
    );
  assert.equal(website, 6);
  const Provider = () => null,
    providers = source("components/site-providers.tsx", {
      "next/navigation": { usePathname: () => path },
      "next/dynamic": { default: () => Provider },
    }).default;
  for (const p of ["/miniapp", "/miniapp/kids", "/zmanim"]) {
    path = p;
    assert.equal(providers({ children: "content" }), "content");
  }
  for (const p of ["/events", "/register", "/dashboard", "/zmanim-other"]) {
    path = p;
    const result = providers({ children: "content" });
    assert.equal(result.type, Provider);
    assert.equal(result.props.children, "content");
  }
  console.log(
    "PASS public GET TV routes bypass SDK; admin/dashboard protection retained; POST and sibling routes use website middleware; website and Mini App provider boundaries retained",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
