import { describe, expect, test } from 'bun:test';
import { buildCheckoutLineItems, computeTotals } from '@/lib/invoices/seed-from-proposal';
import type { AddOnLine } from '@/lib/booking-addons';

const rows = [
  { id: 'r-1', count: 2, type: 'Adult', unitPrice: 2500 },
  { id: 'r-2', count: 1, type: 'Child', unitPrice: 1500 },
];

describe('buildCheckoutLineItems', () => {
  test('turns pricing rows into per-group line items', () => {
    const items = buildCheckoutLineItems(rows, []);
    expect(items).toEqual([
      { id: 'row-r-1', name: 'Adult', quantity: 2, unitPriceCents: 250000 },
      { id: 'row-r-2', name: 'Child', quantity: 1, unitPriceCents: 150000 },
    ]);
  });

  test('breaks a per-person add-on into quantity x unit', () => {
    // 550 per person for 2 travelers: the invoice shows 2 x $550, not 1 x $1100.
    const addOns: AddOnLine[] = [
      {
        kind: 'activity',
        id: 'act-1',
        label: 'Balloon safari (Day 2)',
        detail: 'per person x 2',
        amount: 1100,
        unitAmount: 550,
        quantity: 2,
        onRequest: false,
      },
    ];
    const items = buildCheckoutLineItems(rows, addOns);
    expect(items).toHaveLength(3);
    expect(items[2]).toEqual({
      id: 'activity-act-1',
      name: 'Optional activity',
      description: 'Balloon safari (Day 2)',
      quantity: 2,
      unitPriceCents: 55000,
    });
  });

  test('leads each add-on line with its category and drops the free-text basis', () => {
    const addOns: AddOnLine[] = [
      {
        kind: 'alternative',
        id: 'alt-1',
        label: 'Day 1: Gran Melia instead of Buhoma Lodge',
        detail: 'Per person', // operator free-text; must not reach the invoice
        amount: 300,
        unitAmount: 300,
        quantity: 1, // flat basis: charged once
        onRequest: false,
      },
      {
        kind: 'extra',
        id: 'ex-1',
        label: 'Airport Transfer',
        detail: 'per group',
        amount: 50,
        unitAmount: 50,
        quantity: 1,
        onRequest: false,
      },
    ];
    const items = buildCheckoutLineItems([], addOns);
    expect(items[0]).toEqual({
      id: 'alternative-alt-1',
      name: 'Alternative accommodation',
      description: 'Day 1: Gran Melia instead of Buhoma Lodge',
      quantity: 1,
      unitPriceCents: 30000,
    });
    expect(items[1]).toMatchObject({
      name: 'Optional extra',
      description: 'Airport Transfer',
      quantity: 1,
    });
  });

  test('on-request add-ons contribute 0 and carry a note', () => {
    const addOns: AddOnLine[] = [
      {
        kind: 'activity',
        id: 'act-2',
        label: 'Private guide (Day 3)',
        detail: null,
        amount: 0,
        unitAmount: 0,
        quantity: 1,
        onRequest: true,
      },
    ];
    const items = buildCheckoutLineItems([], addOns);
    expect(items[0]).toMatchObject({
      name: 'Optional activity',
      unitPriceCents: 0,
      description: 'Private guide (Day 3) · Price to be confirmed by the operator',
    });
  });

  test('drops empty/zero-count rows', () => {
    const items = buildCheckoutLineItems(
      [{ id: 'r-0', count: 0, type: 'Infant', unitPrice: 0 }],
      [],
    );
    expect(items).toHaveLength(0);
  });

  test('totals match the base itinerary plus selected add-ons', () => {
    // Base 2*2500 + 1*1500 = 6500, plus a per-person extra 3 x 300 = 900.
    const addOns: AddOnLine[] = [
      {
        kind: 'extra',
        id: 'ex-1',
        label: 'Insurance',
        detail: 'per person x 3',
        amount: 900,
        unitAmount: 300,
        quantity: 3,
        onRequest: false,
      },
    ];
    const items = buildCheckoutLineItems(rows, addOns);
    const { subtotalCents, totalCents } = computeTotals(items, null);
    expect(subtotalCents).toBe(740000);
    expect(totalCents).toBe(740000);
  });
});
