"use server";
import Database from "better-sqlite3";
import path from "path";

// Initialize SQLite database
const dbPath = path.join(process.cwd(), "cms.db");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    page_type TEXT CHECK (page_type IN ('page', 'blog')) DEFAULT 'page',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
  CREATE INDEX IF NOT EXISTS idx_pages_status_type ON pages(status, page_type);
  CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at DESC);

  CREATE TRIGGER IF NOT EXISTS update_pages_updated_at 
    AFTER UPDATE ON pages
    FOR EACH ROW
    BEGIN
      UPDATE pages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
`);

// Insert sample data if table is empty
const count = db.prepare("SELECT COUNT(*) as count FROM pages").get() as {
  count: number;
};
if (count.count === 0) {
  const insertSample = db.prepare(`
    INSERT INTO pages (title, slug, content, excerpt, meta_title, meta_description, status, page_type) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSample.run(
    "Welcome to Safari Frank Tanzania",
    "welcome-safari-frank-tanzania",
    `# Welcome to the Ultimate Safari Experience

Tanzania offers some of the most spectacular wildlife viewing opportunities in the world. From the endless plains of the Serengeti to the breathtaking Ngorongoro Crater, every moment is filled with wonder.

## Our Safari Experiences

### The Great Migration
Witness millions of wildebeest and zebra as they traverse the Serengeti in search of fresh grazing grounds.

### Big Five Safari
Track Africa's most iconic animals:
- **Lion** - The king of the savanna
- **Elephant** - Gentle giants of Africa
- **Buffalo** - The unpredictable herd animals
- **Leopard** - The elusive spotted cat
- **Rhinoceros** - The ancient armored giants

## Why Choose Us?

We are passionate about creating authentic African experiences that:
- Support local communities
- Promote wildlife conservation
- Provide luxury accommodations
- Offer expert local guides

*Book your dream safari today and create memories that will last a lifetime.*`,
    "Discover the ultimate safari experience in Tanzania with expert guides, luxury accommodations, and unforgettable wildlife encounters.",
    "Safari Frank Tanzania - Ultimate Wildlife Experience",
    "Experience the best of Tanzania with Safari Frank. Luxury safaris, expert guides, and unforgettable wildlife encounters in Serengeti and Ngorongoro.",
    "published",
    "page"
  );

  insertSample.run(
    "Best Time to Visit Tanzania for Safari",
    "best-time-visit-tanzania-safari",
    `# When to Visit Tanzania for the Perfect Safari

Planning your Tanzania safari? Timing is everything when it comes to wildlife viewing and weather conditions.

## Dry Season (June - October)

The dry season is considered the best time for safari:

- **Wildlife Viewing**: Animals congregate around water sources
- **Weather**: Clear skies and minimal rainfall
- **Roads**: Excellent road conditions
- **Migration**: Great Migration in northern Serengeti

## Wet Season (November - May)

Don't overlook the wet season benefits:

- **Calving Season**: January-March in southern Serengeti
- **Bird Watching**: Migratory birds arrive
- **Landscapes**: Lush green scenery
- **Prices**: Lower accommodation rates

## Monthly Breakdown

### January - March
- Calving season in Ndutu area
- Excellent predator action
- Beautiful landscapes

### June - August
- Peak dry season
- River crossings in northern Serengeti
- Highest prices but best weather

### September - October
- Excellent wildlife viewing
- Less crowded than peak season
- Great value for money

## Our Recommendation

For first-time visitors, we recommend **July to September** for the classic safari experience with guaranteed wildlife sightings and perfect weather conditions.`,
    "Learn about the best times to visit Tanzania for safari, including wildlife migration patterns, weather conditions, and seasonal highlights.",
    "Best Time to Visit Tanzania for Safari - Complete Guide",
    "Discover the perfect time for your Tanzania safari. Learn about wildlife migration, weather patterns, and seasonal highlights for the ultimate African adventure.",
    "published",
    "blog"
  );
}

interface PageData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  status: "draft" | "published";
  page_type: "page" | "blog";
  created_at?: string;
  updated_at?: string;
}

// Get all pages

export async function getPages(): Promise<PageData[]> {
  const stmt = db.prepare("SELECT * FROM pages ORDER BY updated_at DESC");
  return stmt.all() as PageData[];
}

// Get page by slug
export async function getPageBySlug(slug: string): Promise<PageData> {
  const stmt = db.prepare("SELECT * FROM pages WHERE slug = ?");
  const result = stmt.get(slug) as PageData | undefined;
  if (!result) {
    throw new Error("Page not found");
  }
  return result;
}

// Create new page
export async function createPage(
  pageData: Omit<PageData, "id" | "created_at" | "updated_at">
): Promise<PageData> {
  const stmt = db.prepare(`
      INSERT INTO pages (title, slug, content, excerpt, featured_image, meta_title, meta_description, meta_keywords, status, page_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

  const result = stmt.run(
    pageData.title,
    pageData.slug,
    pageData.content,
    pageData.excerpt,
    pageData.featured_image,
    pageData.meta_title,
    pageData.meta_description,
    pageData.meta_keywords,
    pageData.status,
    pageData.page_type
  );

  const getStmt = db.prepare("SELECT * FROM pages WHERE id = ?");
  return getStmt.get(result.lastInsertRowid) as PageData;
}

export async function updatePage(
  id: string,
  pageData: Partial<PageData>
): Promise<PageData> {
  const fields = Object.keys(pageData).filter(
    (key) => key !== "id" && key !== "created_at" && key !== "updated_at"
  );
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = fields.map((field) => pageData[field as keyof PageData]);

  const stmt = db.prepare(`UPDATE pages SET ${setClause} WHERE id = ?`);
  stmt.run(...values, id);

  const getStmt = db.prepare("SELECT * FROM pages WHERE id = ?");
  return getStmt.get(id) as PageData;
}
