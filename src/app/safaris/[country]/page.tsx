export default async function Page({params}) {
    const {country} = await params;
    return (
        <main>
            <h1 className="mt-[100px] h-screen">{country}</h1>
        </main>
    )

}