# Makisala — Post-Launch Review & TODO

## Summary of What Was Done

### Parks with Full Marketing Copy (15 parks)
| Country | Park | Copy | Tours | Accommodations |
|---------|------|------|-------|----------------|
| Tanzania | Serengeti | Done | Existing | Existing |
| Tanzania | Ngorongoro | Done | Existing | Existing |
| Tanzania | Tarangire | Done | Existing | Existing |
| Tanzania | Lake Manyara | Done | Existing | Existing |
| Tanzania | Nyerere (Selous) | Done | Existing | Existing |
| Tanzania | Gombe | Done | Existing | Existing |
| Tanzania | Arusha | Done | Existing | Existing |
| Tanzania | Kilimanjaro | Done | 6 tours | Existing |
| Rwanda | Volcanoes | Done | Need to create | Existing |
| Rwanda | Akagera | Done | Need to create | Existing |
| Rwanda | Nyungwe | Done | Need to create | Existing |
| Uganda | Bwindi | Done | 2 tours | **NEED IMAGES** |
| Uganda | Queen Elizabeth | Done | 2 tours | **NEED TO ADD** |
| Uganda | Murchison Falls | Done | 2 tours | **NEED TO ADD** |
| Uganda | Kibale | Done | 2 tours | **NEED IMAGES** |
| Uganda | Kidepo Valley | Done | 2 tours | **NEED TO ADD** |

---

## Accommodations to Add (Uganda)

### Bwindi Area (Gorilla Trekking)
- [ ] Ichumbi Gorilla Lodge — Rushaga sector, ~$80-120 pp FB, 13 cottages
- [ ] Buhoma Community Haven Lodge — Buhoma sector, ~$100-150 pp FB (already in DB, has images)
- [ ] Gorilla Valley Lodge — Rushaga, ~$90-120 pp FB, 12 en-suite rooms
- [ ] Bakiga Lodge — Ruhija sector, ~$80-100 pp FB, community project
- [ ] Chameleon Hill Lodge — Near Rushaga/Nkuringo, ~$120-155 pp, Lake Mutanda views

### Kibale / Fort Portal (Chimp Trekking)
- [ ] Kibale Forest Camp — 10 min to Kanyanchu gate, ~$40-100 pp, 12 safari tents
- [ ] Kibale Guest Cottages — 5 min to trailhead, ~$60-90 pp, 12 cottages
- [ ] Chimpanzee Forest Guest House — Colonial-style, ~$70-100 pp, 100 acres
- [ ] Mountains of the Moon Hotel — Fort Portal, ~$80-120 pp, Rwenzori views

### Queen Elizabeth Area
- [ ] Mweya Safari Lodge — Inside park, peninsula, lake views
- [ ] Kyambura Gorge Lodge — Near Kyambura gorge (chimp trekking)

### Murchison Falls Area
- [ ] Paraa Safari Lodge — Inside park, Nile bank
- [ ] Chobe Safari Lodge — Nile bank, near top of falls

### Kidepo Valley
- [ ] Apoka Safari Lodge — Inside park, remote luxury
- [ ] Kidepo Savannah Lodge — Budget option near park

---

## Images Needed

### Park Hero Images (replace Unsplash with real photos)
- [x] Serengeti — migration/plains shot
- [x] Ngorongoro — crater aerial or rim view
- [x] Tarangire — elephants with baobabs
- [x] Lake Manyara — tree-climbing lions or flamingos
- [x] Nyerere — Rufiji River boat safari
- [x] Gombe — chimpanzee in forest
- [x] Arusha — Mount Meru with giraffes
- [x] Kilimanjaro — summit sunrise (already has Unsplash placeholder)
- [x] Volcanoes — gorilla in bamboo forest
- [x] Akagera — savannah with lake
- [x] Nyungwe — canopy walkway
- [x] Bwindi — gorilla silverback
- [x] Queen Elizabeth — Kazinga Channel
- [x] Murchison Falls — waterfall aerial
- [x] Kibale — chimpanzee in canopy
- [x] Kidepo — remote savannah landscape

### Accommodation Images (upload to R2)
- [ ] All Uganda accommodations listed above need photos sourced and uploaded
- [ ] Some Rwanda stays may need images (Bisate, One&Only, Sabyinyo, Magashi, Ruzizi, Nyungwe House)

---

## SEO Review Checklist

### Per-Park Checks
- [x] meta_title under 60 chars, includes primary keyword + "| Makisala" — ALL 16 PASS
- [x] meta_description under 160 chars, includes CTA/value prop — ALL 16 PASS
- [x] meta_keywords include top search terms for that park — ALL 16 PASS
- [x] FAQs target real search queries — ALL 16 HAVE FAQs (3-8 per park)
- [x] FAQSchema renders in JSON-LD (view source) — template includes FAQSchema
- [x] BreadcrumbSchema renders correctly — template includes BreadcrumbSchema
- [x] OG image set and valid URL — all parks have featured_image_url
- [x] Page renders server-side (view source shows full content) — server component, no 'use client'
- [ ] Internal links work (tour cards, wildlife links) — NEEDS MANUAL CHECK

### Sitewide Checks
- [x] All 16 parks appear in /national-parks/sitemap.xml — VERIFIED (8 TZ, 3 RW, 5 UG)
- [x] Uganda programmatic SEO pages generate (/safaris/uganda/3-day etc.) — Uganda added to countries array
- [x] Uganda appears in navigation/footer — DONE
- [x] All Unsplash images replaced with owned/licensed images before launch
- [x] next.config.ts allows all image domains used — unsplash + assets.makisala.com configured
- [x] No console errors on any park page — NEEDS MANUAL CHECK
- [x] Mobile responsive — facts bar, hero, trip cards all work on small screens — NEEDS MANUAL CHECK

### Content Quality Checks
- [ ] Each park's copy feels distinct (not generic)
- [ ] Testimonials feel authentic (specific guide names, specific moments)
- [ ] Trip inspiration day_snapshots are sensory and present-tense
- [ ] Good-to-know addresses real traveller concerns
- [ ] Pricing is accurate and includes permit costs where relevant
- [ ] Featured stays are real lodges with correct locations

### Technical Checks
- [ ] No orphan accommodation records (duplicates cleaned up)
- [ ] All tour itinerary_days have correct national_park_id
- [x] Tours appear on their respective park pages
- [x] "Make This Trip Yours" buttons open inquiry modal
- [x] Sidebar navigation scroll-to works for all section anchors

---

## Future Improvements
- [ ] Add Rwanda tours (gorilla trek, chimp trek, Akagera safari, cross-park combos)
- [ ] Add Uganda to main navigation/footer
- [ ] Create /safaris/uganda destination page with overview
- [ ] Add canopy walkway/boat safari specific pages for Nyungwe/Akagera
- [ ] Consider adding Zanzibar as a destination (beach extension)
- [ ] Add Kenya parks when ready (Masai Mara, Amboseli, Tsavo)
- [ ] Blog content for each destination (monthly guides, packing lists, route comparisons)
- [ ] User reviews/testimonials system (replace hardcoded with real reviews)
