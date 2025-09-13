import {IParams} from "@/app/national-parks/[park]/type";
import {getNPInfo} from "@/lib/cms-service";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {notFound} from "next/navigation";

export default async function page({params}: IParams) {
    const {park} = await params;
    const {park: np, page} = await getNPInfo(park, 'weather_page_id')

    if (!page) {
        return notFound()
    }

    return (
        <main>
            <h1 className="pb-10 text-4xl font-semibold">{page.title}</h1>
            <MarkdownRenderer content={page.content}/>
        </main>
    )
}