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
}

export default function ImageCard({img_url, alt, title, description}: ImageCardProps) {
  return (
    // <div className="text-center">
    //   <div className="mb-8">
    //     <Image
    //       src={img_url}
    //       alt={alt}
    //       width={400}
    //       height={300}
    //       className="rounded-lg mx-auto"
    //     />
    //   </div>
    //   <h3 className="text-2xl font-light text-gray-900 mb-4">
    //     {title}
    //   </h3>
    //   <p className="text-gray-600 leading-relaxed">
    //     {description}
    //   </p>
    // </div>
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
        <CardDescription className="truncate">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
