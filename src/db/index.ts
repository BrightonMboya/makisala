import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import {env} from "@/lib/env"


// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(env.DATABASE_URL!, {prepare: false});

// export const client = postgres(Resource.DATABASE_URL.value, { prepare: false });
export const db = drizzle(client, {schema});
export * as schema from "./schema";
export * from "./schema";
