# Onboarding Flow Implementation Plan

## Overview
Build an onboarding flow that replaces the dashboard content when an organization is missing required setup:
- Organization name (not default)
- Notification email configured
- Access to tours (shared templates or org-specific)

## Design Decisions
- **Tours**: Keep existing tours as shared templates (null organizationId), allow orgs to create their own (with organizationId)
- **Onboarding UI**: Replace dashboard content with checklist until all steps complete

---

## Phase 1: Schema Changes

### 1.1 Add organizationId to tours table

**File**: `packages/db/src/schema.ts`

```typescript
export const tours = pgTable('tours', {
  // ... existing fields
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  // null = shared template, uuid = org-specific
});
```

### 1.2 Update tours relations

```typescript
export const toursRelations = relations(tours, ({ one, many }) => ({
  days: many(itineraryDays),
  organization: one(organizations, {
    fields: [tours.organizationId],
    references: [organizations.id],
  }),
}));
```

### 1.3 Generate and run migration

```bash
cd packages/db
bun run generate
bun run push
```

---

## Phase 2: Update Tour Queries

### 2.1 Update getDashboardData()

**File**: `apps/kitasuro/src/app/itineraries/actions.ts`

Change tours query from:
```typescript
db.select({...}).from(tours)
```

To:
```typescript
db.select({...})
  .from(tours)
  .where(
    or(
      isNull(tours.organizationId),  // Shared templates
      eq(tours.organizationId, orgId) // Org-specific
    )
  )
  .orderBy(tours.tourName)
```

### 2.2 Update getToursList()

Same pattern - filter by org + shared templates.

---

## Phase 3: Onboarding Component

### 3.1 Create onboarding checker utility

**File**: `apps/kitasuro/src/lib/onboarding.ts`

```typescript
export interface OnboardingStatus {
  isComplete: boolean;
  steps: {
    organizationName: { complete: boolean; current: string };
    notificationEmail: { complete: boolean; current: string | null };
    hasTours: { complete: boolean; count: number };
  };
}

export function checkOnboardingStatus(org: Organization | null, toursCount: number): OnboardingStatus {
  const defaultNamePattern = /'s Agency$/;

  return {
    isComplete: boolean,
    steps: {
      organizationName: {
        complete: org?.name && !defaultNamePattern.test(org.name),
        current: org?.name || '',
      },
      notificationEmail: {
        complete: !!org?.notificationEmail,
        current: org?.notificationEmail,
      },
      hasTours: {
        complete: toursCount > 0,
        count: toursCount,
      },
    },
  };
}
```

### 3.2 Create Onboarding UI Component

**File**: `apps/kitasuro/src/app/(dashboard)/_components/onboarding.tsx`

Features:
- Welcome message with organization name
- 3 step cards with completion status
- Each card links to appropriate settings page or action
- Progress indicator (X of 3 complete)

UI Structure:
```
┌─────────────────────────────────────────┐
│  Welcome to Makisala!                   │
│  Complete these steps to get started    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✓ Set up your agency name       │   │
│  │   Current: "Safari Adventures"   │   │
│  │   [Go to Settings]               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ○ Add notification email         │   │
│  │   Receive proposal notifications │   │
│  │   [Configure Email]              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ○ Create your first tour        │   │
│  │   Or use our template library    │   │
│  │   [Browse Templates] [Create]    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 3.3 Integrate into Dashboard

**File**: `apps/kitasuro/src/app/(dashboard)/dashboard/page.tsx`

```typescript
export default function DashboardPage() {
  const { data: dashboardData } = useQuery({...});

  const onboardingStatus = checkOnboardingStatus(
    dashboardData?.organization,
    dashboardData?.tours?.length || 0
  );

  if (!onboardingStatus.isComplete) {
    return <Onboarding status={onboardingStatus} />;
  }

  // ... existing dashboard content
}
```

---

## Phase 4: Tours Management (Future Enhancement)

### 4.1 Add "Create Tour" capability to sidebar/settings

This allows organizations to create their own tours. For now, we'll rely on shared templates existing.

**Note**: Full tour creation UI is in `apps/makisala/src/app/cms/tour-builder/` - this could be adapted for kitasuro later.

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/db/src/schema.ts` | Add organizationId to tours, update relations |
| `apps/kitasuro/src/app/itineraries/actions.ts` | Filter tours by org + shared |
| `apps/kitasuro/src/lib/onboarding.ts` | NEW: Onboarding status checker |
| `apps/kitasuro/src/app/(dashboard)/_components/onboarding.tsx` | NEW: Onboarding UI component |
| `apps/kitasuro/src/app/(dashboard)/dashboard/page.tsx` | Integrate onboarding check |

---

## Implementation Order

1. Schema: Add organizationId to tours table
2. Migration: Generate and push migration
3. Queries: Update getDashboardData and getToursList to filter tours
4. Utility: Create onboarding status checker
5. Component: Build onboarding UI
6. Integration: Add onboarding check to dashboard

---

## Verification

1. **Schema**: Run `bun run studio` in packages/db to verify tours table has organizationId
2. **Queries**: Create a new proposal - should still see shared template tours
3. **Onboarding**:
   - New org with default name → shows onboarding
   - Set org name → step completes
   - Add notification email → step completes
   - When all complete → shows normal dashboard
4. **Edge cases**:
   - Org with no tours but templates exist → should pass hasTours check
   - Org with custom tours → should see both in dropdown
