import { redirect } from "next/navigation";
import { getCurrentUser, isMarketingAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetTypesPanel, MediaOutletsPanel, RequestTypesPanel, ServiceLinesPanel } from "@/components/admin/settings-panels";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !isMarketingAdmin(user)) redirect("/admin");

  const [requestTypes, mediaOutlets, serviceLines, assetTypes] = await Promise.all([
    db.requestTypeDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    db.mediaOutlet.findMany({ orderBy: { name: "asc" } }),
    db.serviceLine.findMany({ orderBy: { name: "asc" } }),
    db.assetTypeDefinition.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure the lists and options used throughout request workflows.</p>
      </div>

      <Tabs defaultValue="request-types">
        <TabsList>
          <TabsTrigger value="request-types">Request Types</TabsTrigger>
          <TabsTrigger value="media">Media Lists</TabsTrigger>
          <TabsTrigger value="service-lines">Service Lines</TabsTrigger>
          <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
        </TabsList>
        <TabsContent value="request-types" className="mt-5">
          <RequestTypesPanel types={requestTypes} />
        </TabsContent>
        <TabsContent value="media" className="mt-5">
          <MediaOutletsPanel outlets={mediaOutlets} />
        </TabsContent>
        <TabsContent value="service-lines" className="mt-5">
          <ServiceLinesPanel items={serviceLines} />
        </TabsContent>
        <TabsContent value="asset-types" className="mt-5">
          <AssetTypesPanel items={assetTypes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
