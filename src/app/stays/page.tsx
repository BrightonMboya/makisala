import {duffel} from "@/lib/duffel";
import Stay from "@/app/stays/_components/Stay";

export default async function Page() {
    // const {data} = await duffel.stays.search({
    //     rooms: 1,
    //     location: {
    //         radius: 10,
    //         geographic_coordinates: {
    //             latitude: -3.3869, longitude: 36.68299
    //         }
    //     },
    //     check_out_date: "2025-12-05",
    //     check_in_date: "2025-12-04",
    //     guests: [{type: "adult"}, {type: "adult"}]
    // })
    const {data} = await duffel.stays.accommodation.list({
        latitude: -17.9244, longitude: 25.8567,
        radius: 5,
        limit: 10
    })

    // const foo = await duffel.stays.accommodation.get("acc_0000AWPsz7Gdsx1EqDPFIq")
    console.log(data[0])


    return (
        <main className="mt-[100px]">
            <section className="grid grid-cols-3 gap-10">
                {data.map((stay) => (
                    <Stay key={stay.id} stay={stay}/>
                ))}
            </section>
        </main>
    )
}

