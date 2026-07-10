import { useRoute } from "wouter";

export default function NotFound() {
  const [match, params] = useRoute("/:path*");

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card p-12 text-center max-w-md rounded-2xl border-dashed border-2 border-primary/20">
        <h1 className="font-heading text-6xl font-bold uppercase tracking-widest text-primary mb-4">404</h1>
        <h2 className="text-xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground">
          The requested page <code className="bg-black/50 px-1 py-0.5 rounded text-primary">{(params as Record<string, string> | null)?.["path*"] || "unknown"}</code> does not exist within the Vault.
        </p>
      </div>
    </div>
  );
}
