import {Duffel} from "@duffel/api"
import {env} from "@/lib/env";

export const duffel = new Duffel({
    token: env.NEXT_PUBLIC_DUFFEL_KEY
})