import { test } from "node:test";
import assert from "node:assert/strict";

import { buildFeed, normalizeUrl, tierFor, validatePartners, assetUrl, CDN_BASE } from "./build-feed.mjs";

const node = (login, { dollars = null, kind = "User", name = login, websiteUrl = null } = {}) => ({
  tier: dollars == null ? null : { monthlyPriceInDollars: dollars, isOneTime: false },
  sponsorEntity: {
    __typename: kind,
    login,
    name,
    avatarUrl: `https://avatars.githubusercontent.com/u/1?u=${login}&v=4`,
    websiteUrl,
  },
});

const partner = (overrides = {}) => ({
  id: "acme",
  name: "Acme",
  tagline: "Rockets for developers",
  url: "https://acme.dev/",
  logo: "assets/partners/acme.svg",
  tier: "gold",
  ...overrides,
});

const NOW = new Date("2026-11-23T12:00:00Z");

test("places sponsors on the highest tier they reach", () => {
  assert.equal(tierFor(1600), "platinum");
  assert.equal(tierFor(1599), "gold");
  assert.equal(tierFor(10), "fan");
  assert.equal(tierFor(5), "donor");
  assert.equal(tierFor(0), "donor");
  assert.equal(tierFor(null), null);
});

test("splits active and past sponsors and orders them by tier, then name", () => {
  const active = [node("zed", { dollars: 10 }), node("big", { dollars: 2000, kind: "Organization" }), node("amy", { dollars: 10 })];
  const all = [...active, node("microsoft", { kind: "Organization", name: "Microsoft" }), node("gone")];
  const feed = buildFeed({ active, all, counts: { activeWithPrivate: 3, allWithPrivate: 5 }, partners: [], now: NOW });

  assert.deepEqual(
    feed.sponsors.map((s) => [s.login, s.tier, s.kind]),
    [
      ["big", "platinum", "organization"],
      ["amy", "fan", "user"],
      ["zed", "fan", "user"],
    ],
  );
  // Microsoft keeps the tier it held; other past sponsors have none
  assert.deepEqual(
    feed.pastSponsors.map((s) => [s.login, s.tier]),
    [
      ["microsoft", "platinum"],
      ["gone", null],
    ],
  );
  assert.deepEqual(feed.privateSponsors, { active: 0, past: 0 });
});

test("counts private sponsors without naming them", () => {
  const active = [node("amy", { dollars: 10 })];
  const all = [...active, node("gone")];
  const feed = buildFeed({ active, all, counts: { activeWithPrivate: 3, allWithPrivate: 7 }, partners: [], now: NOW });

  assert.deepEqual(feed.privateSponsors, { active: 2, past: 3 });
  assert.equal(JSON.stringify(feed).includes("private-person"), false);
});

test("links to the sponsor's website, or their GitHub profile when they have none", () => {
  const active = [node("site", { dollars: 10, websiteUrl: "piotrfonte.com" }), node("bare", { dollars: 10 })];
  const feed = buildFeed({ active, all: active, counts: { activeWithPrivate: 2, allWithPrivate: 2 }, partners: [], now: NOW });

  assert.equal(feed.sponsors.find((s) => s.login === "site").url, "https://piotrfonte.com/");
  assert.equal(feed.sponsors.find((s) => s.login === "bare").url, "https://github.com/bare");
  assert.match(feed.sponsors[0].avatarUrl, /[?&]s=160/);
});

test("drops website urls that are not http", () => {
  assert.equal(normalizeUrl("javascript:alert(1)"), null);
  assert.equal(normalizeUrl("   "), null);
  assert.equal(normalizeUrl("http://kerns.dk"), "http://kerns.dk/");
});

test("shows partners only inside their dates, ordered by tier", () => {
  const partners = [
    partner({ id: "house", tier: "house" }),
    partner({ id: "later", tier: "platinum", startsAt: "2026-12-01" }),
    partner({ id: "ended", tier: "platinum", endsAt: "2026-11-01" }),
    partner({ id: "plat", tier: "platinum", endsAt: "2027-01-01" }),
    partner({ id: "gold", tier: "gold", logo: "https://cdn.example.com/gold.svg" }),
  ];
  const feed = buildFeed({ active: [], all: [], counts: { activeWithPrivate: 0, allWithPrivate: 0 }, partners, now: NOW });

  assert.deepEqual(
    feed.partners.map((p) => p.id),
    ["plat", "gold", "house"],
  );
  assert.equal(feed.partners[0].logo, `${CDN_BASE}assets/partners/acme.svg`);
  assert.equal(feed.partners[1].logo, "https://cdn.example.com/gold.svg");
  assert.equal(feed.partners[0].projects, "all");
  assert.equal("startsAt" in feed.partners[0], false);
});

test("resolves repo paths against the CDN and keeps absolute urls", () => {
  assert.equal(assetUrl("assets/x.png"), `${CDN_BASE}assets/x.png`);
  assert.equal(assetUrl("https://a.b/c.png"), "https://a.b/c.png");
});

test("rejects partners the docs sites could not render", () => {
  assert.deepEqual(validatePartners([partner()]), []);
  const errors = validatePartners([
    partner({ id: "a", tier: "diamond" }),
    partner({ id: "a", url: "http://insecure.dev" }),
    partner({ id: "b", tagline: "x".repeat(71), projects: "hyper-fetch" }),
    partner({ id: "c", name: "", endsAt: "soon" }),
  ]);

  assert.deepEqual(errors, [
    "partners[0] (a): tier must be one of platinum, gold, silver, house",
    "partners[1] (a): duplicate id",
    "partners[1] (a): url must start with https://",
    "partners[2] (b): tagline is over 70 characters",
    'partners[2] (b): projects must be "all" or a list of project ids',
    'partners[3] (c): "name" is required',
    "partners[3] (c): endsAt is not a date",
  ]);
});

test("the partners.json in this repo is valid", async () => {
  const { readFile } = await import("node:fs/promises");
  const { partners } = JSON.parse(await readFile(new URL("../partners.json", import.meta.url), "utf8"));
  assert.deepEqual(validatePartners(partners), []);
});
