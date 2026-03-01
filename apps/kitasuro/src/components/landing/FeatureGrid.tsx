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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <div
          key={index}
          className="animate-slide-up-fade group relative rounded-2xl border border-border/50 bg-card/50 p-8 transition-all duration-300 hover:bg-card/80 hover:border-border/80 hover:-translate-y-1 hover:shadow-lg"
          style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}
        >
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20">
            <feature.icon className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-lg font-semibold tracking-tight font-heading">{feature.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
