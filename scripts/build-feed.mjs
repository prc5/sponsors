/*
 * Builds feed/v1/sponsors.json, the one file every BetterTyped docs site reads its sponsors and partners from.
 * jsDelivr serves it from this repo with a long cache, and the workflow purges that cache after each change:
 *
 *   https://cdn.jsdelivr.net/gh/prc5/sponsors@main/feed/v1/sponsors.json
 *
 * Sponsors come from GitHub Sponsors, partners from partners.json. Private sponsors are only counted, never named.
 * Run with a GitHub token in SPONSORS_GITHUB_TOKEN (or GITHUB_TOKEN). `--dry` prints instead of writing.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const LOGIN = "prc5";
export const CDN_BASE = `https://cdn.jsdelivr.net/gh/${LOGIN}/sponsors@main/`;
export const FEED_PATH = "feed/v1/sponsors.json";
export const LINKS = {
  sponsor: `https://github.com/sponsors/${LOGIN}`,
  partner: `https://github.com/sponsors/${LOGIN}`,
};

/** Highest first. A sponsor lands on the first tier whose monthly amount they reach. */
export const TIERS = [
  { id: "platinum", name: "Platinum", monthlyDollars: 1600 },
  { id: "gold", name: "Gold", monthlyDollars: 800 },
  { id: "silver", name: "Silver", monthlyDollars: 400 },
  { id: "backer", name: "Backer", monthlyDollars: 200 },
  { id: "supporter", name: "Supporter", monthlyDollars: 100 },
  { id: "fan", name: "Fan", monthlyDollars: 10 },
  { id: "donor", name: "Donor", monthlyDollars: 0 },
];

export const PARTNER_TIERS = ["platinum", "gold", "silver", "house"];

/** Past sponsors keep the tier they held. GitHub stops reporting it once a sponsorship ends. */
export const PAST_TIERS = { microsoft: "platinum" };

export const tierFor = (monthlyDollars) => {
  if (monthlyDollars == null) return null;
  return TIERS.find((tier) => monthlyDollars >= tier.monthlyDollars).id;
};

const tierRank = (id) => {
  const index = TIERS.findIndex((tier) => tier.id === id);
  return index === -1 ? TIERS.length : index;
};

export const normalizeUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

export const assetUrl = (value) => (/^https?:\/\//i.test(value) ? value : new URL(value, CDN_BASE).toString());

const avatar = (value, size = 160) => {
  const url = new URL(value);
  url.searchParams.set("s", String(size));
  return url.toString();
};

export const toSponsor = (node, { past }) => {
  const entity = node.sponsorEntity;
  if (!entity?.login) return null;
  const login = entity.login;
  const tier = past ? (PAST_TIERS[login.toLowerCase()] ?? null) : tierFor(node.tier?.monthlyPriceInDollars ?? 0);
  return {
    login,
    name: entity.name || login,
    kind: entity.__typename === "Organization" ? "organization" : "user",
    avatarUrl: avatar(entity.avatarUrl),
    url: normalizeUrl(entity.websiteUrl) ?? `https://github.com/${login}`,
    github: `https://github.com/${login}`,
    tier,
  };
};

const bySponsorOrder = (a, b) => tierRank(a.tier) - tierRank(b.tier) || a.name.localeCompare(b.name);

/**
 * Turns the raw GitHub answers and partners.json into the feed. Pure, so the tests can drive it.
 * `active` and `all` are public sponsorships (activeOnly true / false); the counts include private ones.
 */
export const buildFeed = ({ active, all, counts, partners, now = new Date() }) => {
  const activeLogins = new Set(active.map((node) => node.sponsorEntity?.login).filter(Boolean));
  // A sponsor who is also a partner shows as the partner only
  const partnerLogins = new Set(partners.map((partner) => partner.github?.toLowerCase()).filter(Boolean));
  const notPartner = (node) => !partnerLogins.has(node.sponsorEntity?.login?.toLowerCase());

  const sponsors = active
    .filter(notPartner)
    .map((node) => toSponsor(node, { past: false }))
    .filter(Boolean)
    .sort(bySponsorOrder);
  const pastSponsors = all
    .filter(notPartner)
    .filter((node) => !activeLogins.has(node.sponsorEntity?.login))
    .map((node) => toSponsor(node, { past: true }))
    .filter(Boolean)
    .sort(bySponsorOrder);

  const time = now.getTime();
  const livePartners = partners
    .filter((partner) => {
      if (partner.startsAt && new Date(partner.startsAt).getTime() > time) return false;
      if (partner.endsAt && new Date(partner.endsAt).getTime() <= time) return false;
      return true;
    })
    .map((partner) => ({
      id: partner.id,
      name: partner.name,
      tagline: partner.tagline,
      url: partner.url,
      logo: assetUrl(partner.logo),
      tier: partner.tier,
      accent: partner.accent ?? null,
      projects: partner.projects ?? "all",
    }))
    .sort((a, b) => PARTNER_TIERS.indexOf(a.tier) - PARTNER_TIERS.indexOf(b.tier));

  const hiddenActive = active.filter((node) => !notPartner(node)).length;
  const hiddenPast = all.filter((node) => !notPartner(node)).length - hiddenActive;

  return {
    version: 1,
    generatedAt: now.toISOString(),
    links: LINKS,
    tiers: TIERS,
    partners: livePartners,
    sponsors,
    pastSponsors,
    privateSponsors: {
      active: Math.max(0, counts.activeWithPrivate - sponsors.length - hiddenActive),
      past: Math.max(0, counts.allWithPrivate - counts.activeWithPrivate - pastSponsors.length - hiddenPast),
    },
  };
};

/** Rejects a partners.json the docs sites could not render, so a bad edit fails the workflow instead of a page. */
export const validatePartners = (partners) => {
  const errors = [];
  const ids = new Set();
  partners.forEach((partner, index) => {
    const at = `partners[${index}]${partner?.id ? ` (${partner.id})` : ""}`;
    for (const key of ["id", "name", "tagline", "url", "logo", "tier"]) {
      if (typeof partner?.[key] !== "string" || !partner[key].trim()) errors.push(`${at}: "${key}" is required`);
    }
    if (partner?.id && ids.has(partner.id)) errors.push(`${at}: duplicate id`);
    ids.add(partner?.id);
    if (partner?.tier && !PARTNER_TIERS.includes(partner.tier)) {
      errors.push(`${at}: tier must be one of ${PARTNER_TIERS.join(", ")}`);
    }
    if (partner?.url && !/^https:\/\//.test(partner.url)) errors.push(`${at}: url must start with https://`);
    if (partner?.tagline && partner.tagline.length > 70) errors.push(`${at}: tagline is over 70 characters`);
    const projects = partner?.projects ?? "all";
    if (projects !== "all" && !(Array.isArray(projects) && projects.every((p) => typeof p === "string"))) {
      errors.push(`${at}: projects must be "all" or a list of project ids`);
    }
    if (partner?.github !== undefined && (typeof partner.github !== "string" || !/^[A-Za-z0-9-]+$/.test(partner.github))) {
      errors.push(`${at}: github must be a GitHub login`);
    }
    for (const key of ["startsAt", "endsAt"]) {
      if (partner?.[key] && Number.isNaN(new Date(partner[key]).getTime())) errors.push(`${at}: ${key} is not a date`);
    }
  });
  return errors;
};

const QUERY = `
  query ($login: String!, $activeOnly: Boolean!, $after: String) {
    user(login: $login) {
      sponsorshipsAsMaintainer(first: 100, after: $after, activeOnly: $activeOnly) {
        pageInfo { hasNextPage endCursor }
        nodes {
          tier { monthlyPriceInDollars isOneTime }
          sponsorEntity {
            __typename
            ... on User { login name avatarUrl websiteUrl }
            ... on Organization { login name avatarUrl websiteUrl }
          }
        }
      }
    }
  }
`;

const COUNT_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      active: sponsorshipsAsMaintainer(first: 1, activeOnly: true, includePrivate: true) { totalCount }
      all: sponsorshipsAsMaintainer(first: 1, activeOnly: false, includePrivate: true) { totalCount }
    }
  }
`;

const graphql = async (token, query, variables) => {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "sponsors-feed" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors) {
    throw new Error(`GitHub GraphQL failed (${response.status}): ${JSON.stringify(body.errors ?? body)}`);
  }
  return body.data;
};

const fetchSponsorships = async (token, activeOnly) => {
  const nodes = [];
  let after = null;
  do {
    const data = await graphql(token, QUERY, { login: LOGIN, activeOnly, after });
    const page = data.user.sponsorshipsAsMaintainer;
    nodes.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return nodes;
};

const main = async () => {
  const token = process.env.SPONSORS_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Set SPONSORS_GITHUB_TOKEN to a token that can read GitHub Sponsors");

  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { partners } = JSON.parse(await readFile(resolve(root, "partners.json"), "utf8"));
  const errors = validatePartners(partners);
  if (errors.length) throw new Error(`partners.json is invalid:\n- ${errors.join("\n- ")}`);

  const [active, all, countData] = await Promise.all([
    fetchSponsorships(token, true),
    fetchSponsorships(token, false),
    graphql(token, COUNT_QUERY, { login: LOGIN }),
  ]);
  const counts = { activeWithPrivate: countData.user.active.totalCount, allWithPrivate: countData.user.all.totalCount };
  const feed = buildFeed({ active, all, counts, partners });
  const json = `${JSON.stringify(feed, null, 2)}\n`;

  if (process.argv.includes("--dry")) {
    process.stdout.write(json);
    return;
  }

  // Only the generation time changed: keep the file, so the workflow has nothing to commit or purge.
  const target = resolve(root, FEED_PATH);
  const previous = await readFile(target, "utf8").catch(() => null);
  const strip = (text) => text?.replace(/"generatedAt": "[^"]*"/, "");
  if (strip(previous) === strip(json)) {
    console.log("Feed unchanged");
    return;
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, json);
  console.log(`Feed written: ${feed.partners.length} partners, ${feed.sponsors.length} sponsors, ${feed.pastSponsors.length} past`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
