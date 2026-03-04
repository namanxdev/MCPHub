interface RegistryServerPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function RegistryServerPage({
  params,
}: RegistryServerPageProps) {
  const { serverId } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Registry</h1>
      <p className="text-muted-foreground">Server: {serverId} — Coming soon</p>
    </div>
  );
}
