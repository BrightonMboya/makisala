interface IParams {
    params: {
        park: string;
    }
}

export default async function Page({params}: IParams) {
    const {park} = await params;
    return (
        <main className="mt-[100px]">
            {`${park} Full Page details`}
        </main>
    )
}