import Image from 'next/image';
import { Button } from '@repo/ui/button';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface FeatureHighlightProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  features?: string[];
  ctaText?: string;
  ctaLink?: string;
  align?: 'left' | 'right';
}

export function FeatureHighlight({
  title,
  description,
  imageSrc,
  imageAlt,
  features,
  ctaText,
  ctaLink,
  align = 'left',
}: FeatureHighlightProps) {
  return (
    <div className="overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col gap-16 lg:items-center ${align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
        >
          <div className="animate-slide-up-fade flex-1 space-y-8" style={{ '--delay': '100ms' } as React.CSSProperties}>
            <h2 className="text-foreground font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>

            {features && (
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="animate-slide-up-fade flex items-center gap-3"
                    style={{ '--delay': `${200 + index * 80}ms` } as React.CSSProperties}
                  >
                    <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {ctaText && ctaLink && (
              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link href={ctaLink}>{ctaText}</Link>
              </Button>
            )}
          </div>

          <div className="animate-slide-up-fade flex-1" style={{ '--delay': '250ms' } as React.CSSProperties}>
            <div className="relative">
              {/* Gradient border effect */}
              <div className="from-primary/20 absolute -inset-1 rounded-2xl bg-gradient-to-br via-transparent to-blue-500/10 opacity-60 blur-sm" />
              <div className="border-border/50 bg-background/50 relative rounded-2xl border p-2 shadow-2xl">
                <div className="bg-muted/20 relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
                </div>
              </div>
              {/* Decorative orb */}
              <div
                className={`absolute top-1/2 -z-10 -translate-y-1/2 ${align === 'left' ? '-right-16' : '-left-16'} bg-primary/10 h-56 w-56 rounded-full blur-3xl`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
