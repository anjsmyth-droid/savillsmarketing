export function NoUsersSeeded() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="font-display text-xl font-medium">No users found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The database has no seeded dummy users yet. Run{" "}
          <code className="rounded bg-surface-sunken px-1.5 py-0.5 text-xs">npm run db:seed</code> and reload this
          page.
        </p>
      </div>
    </div>
  );
}
