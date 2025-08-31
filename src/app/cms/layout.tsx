import {ReactNode} from "react";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

export default async function Layout({children}: { children: ReactNode }) {
    // const session = await auth.api.getSession({
    //     headers: await headers()
    // })
    // if (session === null) {
    //     redirect("/")
    // }
    return (
        <main>{children}</main>
    )
}