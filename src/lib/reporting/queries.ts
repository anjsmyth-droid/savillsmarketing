import { db } from "@/lib/db";

function startOfYear() {
  return new Date(new Date().getFullYear(), 0, 1);
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getReportingData() {
  const now = new Date();

  const [
    requestsThisMonth,
    requestsYtd,
    overdueRequests,
    prRequests,
    pitchRequests,
    brochuresGenerated,
    assetsAddedThisMonth,
    completedRequests,
    allRequestsByType,
    allRequestsByDivision,
    openByOwner,
    completedCampaigns,
    createdOverTime,
  ] = await Promise.all([
    db.request.count({ where: { createdAt: { gte: startOfMonth() } } }),
    db.request.count({ where: { createdAt: { gte: startOfYear() } } }),
    db.request.count({ where: { status: { notIn: ["DRAFT", "COMPLETE"] }, targetDate: { lt: now } } }),
    db.request.count({ where: { requestTypeKey: { in: ["property_pr", "pr_media"] } } }),
    db.request.count({ where: { requestTypeKey: "pitch_tender" } }),
    db.brochureProject.count(),
    db.asset.count({ where: { createdAt: { gte: startOfMonth() } } }),
    db.request.findMany({ where: { status: "COMPLETE", submittedAt: { not: null }, completedAt: { not: null } }, select: { submittedAt: true, completedAt: true } }),
    db.request.groupBy({ by: ["requestTypeKey"], _count: { _all: true } }),
    db.request.findMany({ include: { requestor: { include: { department: true } } } }),
    db.request.groupBy({ by: ["marketingOwnerId"], where: { status: { notIn: ["DRAFT", "COMPLETE"] } }, _count: { _all: true } }),
    db.campaign.count({ where: { status: "Complete" } }),
    db.request.findMany({ select: { createdAt: true } }),
  ]);

  const requestTypes = await db.requestTypeDefinition.findMany();
  const typeLabel = new Map(requestTypes.map((t) => [t.key, t.label]));

  const byType = allRequestsByType
    .map((g) => ({ name: typeLabel.get(g.requestTypeKey) ?? g.requestTypeKey, value: g._count._all }))
    .sort((a, b) => b.value - a.value);

  const divisionCounts = new Map<string, number>();
  for (const r of allRequestsByDivision) {
    const name = r.requestor.department?.name ?? "Unassigned";
    divisionCounts.set(name, (divisionCounts.get(name) ?? 0) + 1);
  }
  const byDivision = Array.from(divisionCounts.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const ownerIds = openByOwner.filter((o) => o.marketingOwnerId).map((o) => o.marketingOwnerId as string);
  const owners = await db.user.findMany({ where: { id: { in: ownerIds } } });
  const ownerName = new Map(owners.map((o) => [o.id, o.name]));
  const byOwner = openByOwner
    .map((o) => ({ name: o.marketingOwnerId ? ownerName.get(o.marketingOwnerId) ?? "Unknown" : "Unassigned", value: o._count._all }))
    .sort((a, b) => b.value - a.value);

  const turnaroundDays = completedRequests
    .filter((r) => r.submittedAt && r.completedAt)
    .map((r) => Math.max(0, Math.round((r.completedAt!.getTime() - r.submittedAt!.getTime()) / 86400000)));
  turnaroundDays.sort((a, b) => a - b);
  const avgTurnaround = turnaroundDays.length ? Math.round((turnaroundDays.reduce((a, b) => a + b, 0) / turnaroundDays.length) * 10) / 10 : 0;
  const medianTurnaround = turnaroundDays.length
    ? turnaroundDays.length % 2 === 1
      ? turnaroundDays[(turnaroundDays.length - 1) / 2]
      : Math.round(((turnaroundDays[turnaroundDays.length / 2 - 1] + turnaroundDays[turnaroundDays.length / 2]) / 2) * 10) / 10
    : 0;

  // peak demand: requests created per month, last 6 months
  const monthBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.set(d.toLocaleDateString("en-IE", { month: "short", year: "2-digit" }), 0);
  }
  for (const r of createdOverTime) {
    const label = r.createdAt.toLocaleDateString("en-IE", { month: "short", year: "2-digit" });
    if (monthBuckets.has(label)) monthBuckets.set(label, (monthBuckets.get(label) ?? 0) + 1);
  }
  const requestsOverTime = Array.from(monthBuckets.entries()).map(([name, value]) => ({ name, value }));

  return {
    requestsThisMonth,
    requestsYtd,
    overdueRequests,
    prRequests,
    pitchRequests,
    brochuresGenerated,
    assetsAddedThisMonth,
    completedCampaigns,
    avgTurnaround,
    medianTurnaround,
    byType,
    byDivision,
    byOwner,
    requestsOverTime,
  };
}
