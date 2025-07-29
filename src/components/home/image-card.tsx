import Image from "next/image";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ImageCardProps {
    img_url: string;
    alt: string;
    title: string;
    description: string;
    truncate?: boolean;
}

export default function ImageCard({img_url, alt, title, description, truncate}: ImageCardProps) {
    return (
        <Card>
            <Image
                src={img_url}
                alt={alt}
                width={400}
                height={300}
                className="w-full object-cover rounded-t-lg lg:h-[220px]"
            />
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="">
                <CardDescription className={truncate ? 'truncate' : ''}>{description}</CardDescription>
            </CardContent>
        </Card>
    );
}
