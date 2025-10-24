import C2A from '@/components/home/call-to-action'

export default async function Layout({ children }: { children: React.ReactNode }) {
    return (
        <main className="my-[60px]">
            {children}
            {/*<C2A/>*/}
        </main>
    )
}
