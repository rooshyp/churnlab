import { Account, BillingInfo, Industry, MetricsSnapshot, Tier } from "./types";
import { Rng, chance, clamp, createRng, float, int, pick } from "./rng";

const INDUSTRIES: Industry[] = [
  "SaaS & Software",
  "Financial Services",
  "Healthcare",
  "Retail & E-commerce",
  "Manufacturing",
  "Media & Entertainment",
  "Logistics",
  "Professional Services",
  "Education",
  "Nonprofit",
];

const REGIONS = ["North America", "EMEA", "APAC", "LATAM"];

const OWNERS = [
  "Priya Nair",
  "Daniel Cho",
  "Maria Fernandez",
  "Jordan Blake",
  "Sam Whitfield",
  "Leah Osei",
  "Ravi Patel",
  "Emma Sorensen",
];

const CORE_FEATURES = [
  "Dashboards",
  "Automations",
  "Reporting API",
  "SSO",
  "Team Workspaces",
  "Custom Fields",
  "Alerts",
  "Integrations Hub",
  "Audit Log",
];

const COMPANY_PREFIXES = [
  "Acme", "Nova", "Vertex", "Summit", "Northwind", "Cascade", "Ironclad", "Bluepeak",
  "Cobalt", "Lumen", "Redwood", "Anchor", "Fathom", "Granite", "Harbor", "Meridian",
  "Outrigger", "Pinecrest", "Quarry", "Sterling", "Tidewater", "Vantage", "Westbrook",
  "Zenith", "Beacon", "Crestline", "Driftwood", "Elmhurst", "Fernbank", "Glacier",
  "Hollowell", "Ironbridge", "Juniper", "Kestrel", "Larkspur", "Millbrook", "Overlook",
];
const COMPANY_SUFFIXES = [
  "Systems", "Labs", "Group", "Technologies", "Partners", "Industries", "Solutions",
  "Networks", "Dynamics", "Holdings", "Works", "Collective", "Analytics", "Robotics",
  "Health", "Media", "Logistics", "Foods", "Financial", "Studios",
];

function companyName(rng: Rng, used: Set<string>): string {
  let name = "";
  do {
    name = `${pick(rng, COMPANY_PREFIXES)} ${pick(rng, COMPANY_SUFFIXES)}`;
  } while (used.has(name));
  used.add(name);
  return name;
}

function tierForEmployees(employees: number): Tier {
  if (employees < 100) return "Starter";
  if (employees < 1000) return "Growth";
  return "Enterprise";
}

function mrrForTier(rng: Rng, tier: Tier): number {
  switch (tier) {
    case "Starter":
      return int(rng, 300, 2500);
    case "Growth":
      return int(rng, 2500, 15000);
    case "Enterprise":
      return int(rng, 15000, 65000);
  }
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysFromNowIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Archetypes bias correlated signals so risk emerges from realistic causes
 * rather than uniform randomness. Weights sum to 1.
 */
const ARCHETYPES = [
  { key: "thriving", weight: 0.28 },
  { key: "steady", weight: 0.22 },
  { key: "usage-decline", weight: 0.13 },
  { key: "low-adoption", weight: 0.1 },
  { key: "support-friction", weight: 0.09 },
  { key: "sentiment-drop", weight: 0.07 },
  { key: "billing-risk", weight: 0.05 },
  { key: "compound-risk", weight: 0.06 },
] as const;

type ArchetypeKey = (typeof ARCHETYPES)[number]["key"];

function pickArchetype(rng: Rng): ArchetypeKey {
  const roll = rng();
  let cumulative = 0;
  for (const a of ARCHETYPES) {
    cumulative += a.weight;
    if (roll <= cumulative) return a.key;
  }
  return "steady";
}

function buildSnapshot(
  rng: Rng,
  archetype: ArchetypeKey,
  seats: number,
  asOf: string,
  isPast: boolean
): MetricsSnapshot {
  // Baselines, then archetype-driven adjustment, then per-account noise.
  let utilization = float(rng, 0.55, 0.92);
  let trend = float(rng, -5, 10);
  let adoptionRate = float(rng, 0.45, 0.85);
  let openTickets = int(rng, 0, 2);
  let severeOpenTickets = 0;
  let ticketsOpenedRecently = int(rng, 0, 2);
  let escalation = false;
  let nps: number | null = int(rng, 20, 55);
  let lastActiveDaysAgo = int(rng, 0, 3);

  switch (archetype) {
    case "thriving":
      utilization = float(rng, 0.72, 0.97);
      trend = float(rng, 2, 22);
      adoptionRate = float(rng, 0.65, 0.98);
      nps = int(rng, 35, 70);
      break;
    case "steady":
      // baseline values are fine
      break;
    case "usage-decline":
      utilization = float(rng, 0.25, 0.55);
      trend = float(rng, -55, -18);
      lastActiveDaysAgo = int(rng, 4, 21);
      nps = int(rng, 0, 35);
      break;
    case "low-adoption":
      adoptionRate = float(rng, 0.11, 0.4);
      utilization = float(rng, 0.35, 0.65);
      trend = float(rng, -12, 4);
      break;
    case "support-friction":
      openTickets = int(rng, 3, 8);
      severeOpenTickets = int(rng, 1, 3);
      ticketsOpenedRecently = int(rng, 2, 6);
      escalation = chance(rng, 0.6);
      nps = int(rng, -10, 30);
      trend = float(rng, -15, 5);
      break;
    case "sentiment-drop":
      nps = int(rng, -30, 15);
      trend = float(rng, -10, 6);
      break;
    case "billing-risk":
      trend = float(rng, -10, 8);
      nps = int(rng, 5, 35);
      break;
    case "compound-risk":
      utilization = float(rng, 0.15, 0.4);
      trend = float(rng, -60, -25);
      adoptionRate = float(rng, 0.1, 0.35);
      openTickets = int(rng, 2, 7);
      severeOpenTickets = int(rng, 1, 4);
      escalation = chance(rng, 0.7);
      nps = int(rng, -40, 10);
      lastActiveDaysAgo = int(rng, 7, 30);
      break;
  }

  // For the "past" snapshot, soften the deviation slightly so risky
  // accounts show visible deterioration over the trailing 30 days rather
  // than having always been exactly this bad.
  if (isPast) {
    utilization = clamp(utilization + float(rng, 0.03, 0.14), 0.05, 0.99);
    trend = trend + float(rng, 4, 14);
    adoptionRate = clamp(adoptionRate + float(rng, 0.02, 0.1), 0.05, 1);
    openTickets = Math.max(0, openTickets - int(rng, 0, 2));
    severeOpenTickets = Math.max(0, severeOpenTickets - int(rng, 0, 1));
    if (nps !== null) nps = clamp(nps + int(rng, 3, 12), -100, 100);
    lastActiveDaysAgo = Math.max(0, lastActiveDaysAgo - int(rng, 0, 4));
  }

  const activeUsers = clamp(Math.round(seats * utilization), 0, seats);
  const weeklyActiveUsers = clamp(Math.round(activeUsers * float(rng, 0.7, 0.95)), 0, seats);
  const coreFeaturesTotal = CORE_FEATURES.length;
  const coreFeaturesAdopted = clamp(Math.round(coreFeaturesTotal * adoptionRate), 0, coreFeaturesTotal);
  const shuffled = [...CORE_FEATURES].sort(() => rng() - 0.5);
  const adoptedFeatureNames = shuffled.slice(0, coreFeaturesAdopted);

  // Data-quality gaps: a small slice of accounts is missing NPS or
  // resolution-time data, on purpose, to exercise confidence scoring and
  // the Data Quality Console.
  const missingNps = chance(rng, 0.06);

  return {
    asOf,
    licensedSeats: seats,
    activeUsers,
    weeklyActiveUsers,
    sessionsPerWeek: Math.round(weeklyActiveUsers * float(rng, 1.5, 4.5)),
    usageTrendPct: Math.round(trend * 10) / 10,
    coreFeaturesTotal,
    coreFeaturesAdopted,
    adoptedFeatureNames,
    lastActiveDaysAgo,
    openTickets,
    severeOpenTickets,
    ticketsOpenedRecently,
    avgResolutionHours: openTickets + ticketsOpenedRecently > 0 ? int(rng, 4, 96) : null,
    recentEscalation: escalation,
    nps: missingNps ? null : clamp(Math.round(nps ?? 0), -100, 100),
  };
}

function buildBilling(rng: Rng, archetype: ArchetypeKey): BillingInfo {
  if (archetype === "billing-risk" || archetype === "compound-risk") {
    const failed = int(rng, 1, 3);
    return {
      paymentStatus: chance(rng, 0.5) ? "Failed" : "Late",
      failedPaymentsLast90d: failed,
      overdueInvoiceCount: int(rng, 1, 3),
      overdueAmount: int(rng, 800, 22000),
    };
  }
  if (chance(rng, 0.05)) {
    return {
      paymentStatus: "Late",
      failedPaymentsLast90d: 0,
      overdueInvoiceCount: 1,
      overdueAmount: int(rng, 200, 4000),
    };
  }
  return { paymentStatus: "Current", failedPaymentsLast90d: 0, overdueInvoiceCount: 0, overdueAmount: 0 };
}

export interface GeneratorOptions {
  seed?: number;
  activeCount?: number;
  churnedCount?: number;
}

export function generateAccounts(options: GeneratorOptions = {}): Account[] {
  const { seed = 20240611, activeCount = 220, churnedCount = 42 } = options;
  const rng = createRng(seed);
  const used = new Set<string>();
  const accounts: Account[] = [];

  const total = activeCount + churnedCount;
  for (let i = 0; i < total; i++) {
    const isChurned = i >= activeCount;
    const employees = Math.round(Math.exp(float(rng, Math.log(8), Math.log(6000))));
    const tier = tierForEmployees(employees);
    const seats = clamp(Math.round(employees * float(rng, 0.04, 0.22)), 3, 1200);
    const mrr = mrrForTier(rng, tier);
    const arr = mrr * 12;
    const archetype = isChurned
      ? pick(rng, ["usage-decline", "support-friction", "compound-risk", "sentiment-drop", "billing-risk"] as const)
      : pickArchetype(rng);

    const startDaysAgo = int(rng, 60, 1400);
    const contractType: Account["contractType"] = pick(rng, ["Monthly", "Annual", "Annual", "Multi-year"] as const);
    const cycleDays = contractType === "Monthly" ? 30 : contractType === "Annual" ? 365 : 365 * 2;
    let renewalInDays = int(rng, -10, cycleDays);
    // Bias risky archetypes toward closer renewals so urgency compounds realistically.
    if (["usage-decline", "support-friction", "compound-risk", "sentiment-drop"].includes(archetype)) {
      renewalInDays = int(rng, 5, 75);
    }

    const current = buildSnapshot(rng, archetype, seats, daysAgoIso(0), false);
    const past = buildSnapshot(rng, archetype, seats, daysAgoIso(30), true);

    const account: Account = {
      id: `ACC-${String(i + 1).padStart(4, "0")}`,
      company: companyName(rng, used),
      industry: pick(rng, INDUSTRIES),
      employees,
      tier,
      contractType,
      region: pick(rng, REGIONS),
      ownerName: pick(rng, OWNERS),
      startDate: daysAgoIso(startDaysAgo),
      renewalDate: isChurned ? daysAgoIso(int(rng, 1, 60)) : daysFromNowIso(renewalInDays),
      mrr,
      arr,
      current,
      past,
      billing: buildBilling(rng, archetype),
      status: isChurned ? "churned" : "active",
      churnDate: isChurned ? daysAgoIso(int(rng, 1, 60)) : undefined,
    };

    // A handful of accounts deliberately carry messy/invalid data so the
    // Data Quality Console has real issues to surface, not staged ones.
    if (!isChurned && chance(rng, 0.035)) {
      account.arr = -Math.abs(account.arr); // impossible negative revenue
    } else if (!isChurned && chance(rng, 0.03)) {
      account.renewalDate = daysAgoIso(int(rng, 5, 40)); // renewal "in the past"
    } else if (!isChurned && chance(rng, 0.03)) {
      account.current = { ...account.current, activeUsers: account.current.licensedSeats + int(rng, 5, 40) }; // active > licensed
    }

    accounts.push(account);
  }

  return accounts;
}
