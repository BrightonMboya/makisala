"use client"
import Link from "next/link";
import {usePathname} from "next/navigation";
import {articles_url} from "@/app/where-to-go/[month]/_components/data";


export default function MonthNavigator() {
    const pathname = usePathname();
    const current_month = pathname.split("/")[2];

    return (
        <div className="pb-10">
            <div
                className="grid grid-cols-3 gap-5 lg:flex lg:items-center lg:justify-center lg:space-x-5 ">
                {articles_url.map((article, index) => (
                    <Link href={`/where-to-go/${article.month}`} key={index}>
                        <p className={`${current_month === article.month ? "text-primary border-b border-primary" : ""} uppercase font-medium`}>
                            {article.month.substring(0, 3)}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
