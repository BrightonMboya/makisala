import C2A from "@/components/home/call-to-action";

export default async function Layout({children}: { children: React.ReactNode }) {
    return (
        <main className="mt-[80px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            {children}
            {/*<C2A/>*/}
        </main>
    )

}