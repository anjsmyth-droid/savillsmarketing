import { getReportingData } from "@/lib/reporting/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HorizontalBarChart, TrendLineChart } from "@/components/reporting/charts";

function StatTile({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className={`font-display text-2xl font-medium ${danger ? "text-danger" : ""}`}>{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export default async function ReportingPage() {
  const data = await getReportingData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Marketing Intelligence</h1>
        <p className="mt-1 text-muted-foreground">Live workload and performance metrics, built from real request data.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Requests this month" value={data.requestsThisMonth} />
        <StatTile label="Requests YTD" value={data.requestsYtd} />
        <StatTile label="Overdue" value={data.overdueRequests} danger={data.overdueRequests > 0} />
        <StatTile label="Avg turnaround (days)" value={data.avgTurnaround} />
        <StatTile label="Median turnaround (days)" value={data.medianTurnaround} />
        <StatTile label="PR requests" value={data.prRequests} />
        <StatTile label="Pitch requests" value={data.pitchRequests} />
        <StatTile label="Brochures generated" value={data.brochuresGenerated} />
        <StatTile label="Assets added this month" value={data.assetsAddedThisMonth} />
        <StatTile label="Completed campaigns" value={data.completedCampaigns} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Requests over time</CardTitle></CardHeader>
          <CardContent><TrendLineChart data={data.requestsOverTime} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Current workload by Marketing owner</CardTitle></CardHeader>
          <CardContent><HorizontalBarChart data={data.byOwner} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Requests by type</CardTitle></CardHeader>
          <CardContent><HorizontalBarChart data={data.byType} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Most active departments</CardTitle></CardHeader>
          <CardContent><HorizontalBarChart data={data.byDivision} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
