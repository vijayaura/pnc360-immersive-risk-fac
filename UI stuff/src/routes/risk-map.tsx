import { createFileRoute, Link } from "@tanstack/react-router";
import { mockProperties } from "@/data/mock-properties";
import { Map } from "lucide-react";

export const Route = createFileRoute("/risk-map")({
  component: RiskMapPage,
  head: () => ({
    meta: [
      { title: "Risk Map — P&C 360 IRV" },
      { name: "description", content: "Geographic overview of all properties with risk overlays." },
    ],
  }),
});

function RiskMapPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Map</h1>
        <p className="text-sm text-muted-foreground mt-1">Geographic overview of portfolio risk</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Map className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Portfolio-wide risk map — select a property to enter the Immersive Risk View</p>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {mockProperties.map((p) => (
            <Link
              key={p.id}
              to="/risk/$id"
              params={{ id: p.id }}
              className="rounded-lg border border-border bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
