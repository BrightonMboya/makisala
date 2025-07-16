"use server"
import { db } from "../index";
import { pages } from "@/db/schema";
import { eq } from "drizzle-orm";
import cuid from "cuid";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Types
export type Page = InferSelectModel<typeof pages>;
export type NewPage = Omit<InferInsertModel<typeof pages>, "id" | "createdAt" | "updatedAt">;

/* ------------------------------------------------------------------ */
/*  CREATE                                                            */
/* ------------------------------------------------------------------ */
export async function createPage(data: NewPage): Promise<Page> {
    const [inserted] = await db
        .insert(pages)
        .values({
            id: cuid(), // ✅ generate here
            updatedAt: new Date().toISOString(),
            ...data,
        })
        .returning();

    return inserted;
}

/* ------------------------------------------------------------------ */
/*  UPDATE                                                            */
/* ------------------------------------------------------------------ */
export async function updatePage(id: string, data: Partial<Page>): Promise<Page> {
    console.log(data, "---------------------------")
    const [updated] = await db
        .update(pages)
        .set({
            ...data,
            updatedAt: new Date().toISOString(), // ✅ keep updatedAt consistent
        })
        .where(eq(pages.id, id))
        .returning();

    return updated;
}

/* ------------------------------------------------------------------ */
/*  GET ALL                                                           */
/* ------------------------------------------------------------------ */
export async function getPages(page_type: "blog" | "page"): Promise<Page[]> {
    return await db
        .select()
        .from(pages)
        .where(eq(pages.page_type, page_type))
}

/* ------------------------------------------------------------------ */
/*  GET BY ID                                                         */
/* ------------------------------------------------------------------ */
export async function getPageById(id: string): Promise<Page | null> {
    const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.id, id))
        .limit(1);

    return page ?? null;
}

/* ------------------------------------------------------------------ */
/*  GET BY SLUG                                                       */
/* ------------------------------------------------------------------ */
export async function getPageBySlug(slug: string): Promise<Page | null> {
    const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, slug))
        .limit(1);

    return page ?? null;
}

/* ------------------------------------------------------------------ */
/*  DELETE                                                            */
/* ------------------------------------------------------------------ */
export async function deletePage(id: string): Promise<Page | null> {
    const [deleted] = await db
        .delete(pages)
        .where(eq(pages.id, id))
        .returning();

    return deleted ?? null;
}
