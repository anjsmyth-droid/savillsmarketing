import { getCurrentUser, isMarketingAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { KnowledgeManager } from "@/components/admin/knowledge-manager";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  const docs = await db.knowledgeDocument.findMany({ orderBy: { category: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Brand & Content Knowledge</h1>
        <p className="mt-1 text-muted-foreground">
          The approved source material AI-assisted drafting should eventually retrieve from. Example content only —
          replace with real approved Savills material before production use.
        </p>
      </div>
      <KnowledgeManager docs={docs} canEdit={!!user && isMarketingAdmin(user)} />
    </div>
  );
}
