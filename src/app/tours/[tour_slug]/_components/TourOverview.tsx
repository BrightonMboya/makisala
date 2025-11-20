import { Card, CardContent } from '@/components/ui/card'
import { Clock, Globe, Users, Zap } from 'lucide-react'

interface TourOverviewProps {
    overview: string
    country: string
    days: number
    minAge?: number
    maxGroupSize?: number
}

export default function TourOverview({
    overview,
    country,
    days,
    minAge = 5,
    maxGroupSize = 6,
}: TourOverviewProps) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-heading mb-4 text-3xl font-bold text-gray-900">
                    Tour Overview
                </h2>
                <div className="prose prose-lg text-muted-foreground max-w-none">
                    <p className="leading-relaxed">{overview}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatsCard
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    label="Duration"
                    value={`${days} Days`}
                />
                <StatsCard
                    icon={<Globe className="h-5 w-5 text-primary" />}
                    label="Country"
                    value={country}
                    className="capitalize"
                />
                <StatsCard
                    icon={<Users className="h-5 w-5 text-primary" />}
                    label="Group Size"
                    value={`Max ${maxGroupSize}`}
                />
                <StatsCard
                    icon={<Zap className="h-5 w-5 text-primary" />}
                    label="Min Age"
                    value={`${minAge}+ Years`}
                />
            </div>
        </div>
    )
}

function StatsCard({
    icon,
    label,
    value,
    className = '',
}: {
    icon: React.ReactNode
    label: string
    value: string
    className?: string
}) {
    return (
        <Card className="bg-accent/5 border-none shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 rounded-full bg-primary/10 p-3">
                    {icon}
                </div>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    {label}
                </p>
                <p className={`mt-1 text-lg font-bold text-gray-900 ${className}`}>
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}
