import type { LucideIcon } from "lucide-react";

interface FeatureGridProps {
  features: {
    title: string;
    description: string;
    icon: LucideIcon;
  }[];
}

export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <div 
            key={index} 
            className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 transition-colors hover:bg-card/80 hover:border-border/80"
        >
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <feature.icon className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-lg font-semibold tracking-tight font-heading">{feature.title}</h3>
          <p className="text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
