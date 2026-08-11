import { Account } from "../data/types";
import { daysUntil } from "../metrics/saas-metrics";
import { healthForAccount, pastHealthForAccount } from "../scoring/account-health";
import { DRIVER_SUMMARY_PHRASE } from "./explain";

export interface ChangedMetric {
  key: string;
  label: string;
  before: string;
  after: string;
  deltaPct: number | null;
  direction: "improved" | "worsened" | "flat";
}

export interface WhatChanged {
  healthBefore: number;
  healthAfter: number;
  metrics: ChangedMetric[];
  biggestDeterioration: string | null;
}

function pct(before: number, after: number): number | null {
  if (before === 0) return after === 0 ? 0 : null;
  return Math.round(((after - before) / Math.abs(before)) * 100);
}

function direction(before: number, after: number, higherIsBetter: boolean): "improved" | "worsened" | "flat" {
  if (before === after) return "flat";
  const up = after > before;
  return higherIsBetter === up ? "improved" : "worsened";
}

export function computeWhatChanged(account: Account): WhatChanged {
  const { current, past } = account;
  const healthNow = healthForAccount(account);
  const healthPast = pastHealthForAccount(account);

  const utilizationBefore = past.licensedSeats > 0 ? Math.round((past.activeUsers / past.licensedSeats) * 100) : 0;
  const utilizationAfter = current.licensedSeats > 0 ? Math.round((current.activeUsers / current.licensedSeats) * 100) : 0;

  const daysToRenewalNow = daysUntil(account.renewalDate);
  // "30 days ago" the renewal was 30 days further away.
  const daysToRenewalPast = daysToRenewalNow + 30;

  const metrics: ChangedMetric[] = [
    {
      key: "weeklyActiveUsers",
      label: "Weekly Active Users",
      before: String(past.weeklyActiveUsers),
      after: String(current.weeklyActiveUsers),
      deltaPct: pct(past.weeklyActiveUsers, current.weeklyActiveUsers),
      direction: direction(past.weeklyActiveUsers, current.weeklyActiveUsers, true),
    },
    {
      key: "seatUtilization",
      label: "Seat Utilization",
      before: `${utilizationBefore}%`,
      after: `${utilizationAfter}%`,
      deltaPct: pct(utilizationBefore, utilizationAfter),
      direction: direction(utilizationBefore, utilizationAfter, true),
    },
    {
      key: "featureAdoption",
      label: "Core Features Adopted",
      before: `${past.coreFeaturesAdopted} / ${past.coreFeaturesTotal}`,
      after: `${current.coreFeaturesAdopted} / ${current.coreFeaturesTotal}`,
      deltaPct: pct(past.coreFeaturesAdopted, current.coreFeaturesAdopted),
      direction: direction(past.coreFeaturesAdopted, current.coreFeaturesAdopted, true),
    },
    {
      key: "nps",
      label: "NPS",
      before: past.nps === null ? "—" : String(past.nps),
      after: current.nps === null ? "—" : String(current.nps),
      deltaPct: past.nps !== null && current.nps !== null ? pct(past.nps, current.nps) : null,
      direction: past.nps !== null && current.nps !== null ? direction(past.nps, current.nps, true) : "flat",
    },
    {
      key: "openTickets",
      label: "Open Support Tickets",
      before: String(past.openTickets),
      after: String(current.openTickets),
      deltaPct: pct(past.openTickets, current.openTickets),
      direction: direction(past.openTickets, current.openTickets, false),
    },
    {
      key: "healthScore",
      label: "Health Score",
      before: String(healthPast.score),
      after: String(healthNow.score),
      deltaPct: pct(healthPast.score, healthNow.score),
      direction: direction(healthPast.score, healthNow.score, true),
    },
    {
      key: "renewalDistance",
      label: "Renewal Distance",
      before: `${daysToRenewalPast} days`,
      after: `${daysToRenewalNow} days`,
      deltaPct: null,
      direction: "flat",
    },
  ];

  // Biggest deterioration: compare per-signal deductions between the two
  // health evaluations and surface whichever driver got materially worse.
  const pastByKey = new Map(healthPast.drivers.map((d) => [d.key, d.deduction]));
  const nowByKey = new Map(healthNow.drivers.map((d) => [d.key, d.deduction]));
  const allKeys = new Set([...pastByKey.keys(), ...nowByKey.keys()]);
  let worstKey: string | null = null;
  let worstDelta = 0;
  for (const key of allKeys) {
    const delta = (nowByKey.get(key) ?? 0) - (pastByKey.get(key) ?? 0);
    if (delta > worstDelta) {
      worstDelta = delta;
      worstKey = key;
    }
  }
  const biggestDeterioration =
    worstKey && worstDelta >= 2 ? `${DRIVER_SUMMARY_PHRASE[worstKey] ?? worstKey} is the largest driver of recent deterioration.` : null;

  return { healthBefore: healthPast.score, healthAfter: healthNow.score, metrics, biggestDeterioration };
}
