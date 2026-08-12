import { isCJKLanguage } from './theme';

/**
 * UI chrome for the proposal PDF: section headings, meta labels, and boilerplate
 * sentences that aren't part of the operator's authored copy and so never pass
 * through translateProposalContent (see lib/translation.ts). Proposal content
 * itself is translated dynamically at the DB layer; this is the fixed strings
 * around it, translated statically since the set of them barely changes.
 *
 * Deliberately not touched here: meal names (Breakfast/Lunch/Dinner/None) and the
 * accommodation placeholders ('To be confirmed', 'Last day, no accommodation') —
 * both are stored on Day as English sentinels and exact-matched elsewhere
 * (DiscoveryTheme.tsx, helpers.ts's NO_ACCOMMODATION) to decide what to render.
 * Translating them here would desync those checks and silently break icon/section
 * detection. That's a pre-existing gap shared by every language this app already
 * supports, not something new to zh.
 */
export interface Labels {
  tourType: string;
  tourLength: string;
  startTour: string;
  endTour: string;
  quoteFor: (name: string) => string;
  dearName: (name: string) => string;
  /** "Day {n}" chip/eyebrow — a compact badge, distinct from the `day` legend header. */
  dayChip: (day: number) => string;
  hopeToHear: string;
  bestRegards: string;
  summary: string;
  start: string;
  end: string;
  dayByDay: string;
  stay: string;
  mealsLabel: string;
  none: string;
  highlights: string;
  accommodation: string;
  activities: string;
  noAccommodationNight: string;
  mealPlanDay: (day: number) => string;
  altAvailable: (count: number) => string;
  rooms: string;
  travelers: string;
  pricing: string;
  proposalFor: (name: string) => string;
  proposal: string;
  breakdownOfCosts: string;
  totalIn: (currency: string) => string;
  perPerson: string;
  optionalNotIncluded: string;
  confirmProposal: string;
  opensOnline: string;
  included: string;
  excluded: string;
  paymentTerms: string;
  alternativeAccommodations: string;
  accommodationDay: (day: number) => string;
  mealPlanColon: string;
  booked: string;
  roomsColon: string;
  aboutUs: string;
  weOrg: (name: string) => string;
  reviewedOn: string;
  reviewsSuffix: string;
  contactUs: string;
  address: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  followUsOn: string;
  map: string;
  routeOverview: string;
  destination: string;
  day: string;
  noAccommodation: string;
  goPin: string;
  endPin: string;
  pageFooter: (pageNumber: number) => string;
}

const en: Labels = {
  tourType: 'Tour Type',
  tourLength: 'Tour Length',
  startTour: 'Start Tour',
  endTour: 'End Tour',
  quoteFor: (name) => `Quote for ${name}`,
  dearName: (name) => `Dear ${name},`,
  dayChip: (day) => `Day ${day}`,
  hopeToHear: 'We hope to hear from you soon.',
  bestRegards: 'Best regards,',
  summary: 'Summary',
  start: 'Start',
  end: 'End',
  dayByDay: 'Day by Day',
  stay: 'Stay',
  mealsLabel: 'Meals',
  none: 'None',
  highlights: 'Highlights',
  accommodation: 'Accommodation',
  activities: 'Activities',
  noAccommodationNight: 'No accommodation on this night.',
  mealPlanDay: (day) => `Meal Plan: Day ${day}`,
  altAvailable: (count) =>
    `${count} alternative${count === 1 ? '' : 's'} for this night. See Alternative Accommodations.`,
  rooms: 'Rooms: ',
  travelers: 'Travelers',
  pricing: 'Pricing',
  proposalFor: (name) => `Proposal for ${name}`,
  proposal: 'Proposal',
  breakdownOfCosts: 'Breakdown of Costs',
  totalIn: (currency) => `Total in ${currency}`,
  perPerson: 'per person',
  optionalNotIncluded: 'Optional, not included',
  confirmProposal: 'Confirm Proposal',
  opensOnline: 'Opens your proposal online to confirm these dates.',
  included: 'Included',
  excluded: 'Excluded',
  paymentTerms: 'Payment Terms',
  alternativeAccommodations: 'Alternative Accommodations',
  accommodationDay: (day) => `Accommodation · Day ${day}`,
  mealPlanColon: 'Meal Plan:',
  booked: 'Booked',
  roomsColon: 'Rooms:',
  aboutUs: 'About Us',
  weOrg: (name) => `We, ${name}`,
  reviewedOn: 'Reviewed on',
  reviewsSuffix: 'reviews',
  contactUs: 'Contact Us',
  address: 'Address',
  country: 'Country',
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  followUsOn: 'Follow us on',
  map: 'Map',
  routeOverview: 'Route overview per day',
  destination: 'Destination',
  day: 'Day',
  noAccommodation: 'No accommodation',
  goPin: 'GO',
  endPin: 'END',
  pageFooter: (pageNumber) => `Page ${pageNumber}`,
};

const zh: Labels = {
  tourType: '行程类型',
  tourLength: '行程天数',
  startTour: '出发日期',
  endTour: '结束日期',
  quoteFor: (name) => `为 ${name} 定制的报价`,
  dearName: (name) => `亲爱的 ${name}：`,
  dayChip: (day) => `第 ${day} 天`,
  hopeToHear: '期待您的回复。',
  bestRegards: '此致敬礼，',
  summary: '行程概览',
  start: '出发',
  end: '结束',
  dayByDay: '每日行程',
  stay: '住宿',
  mealsLabel: '餐食',
  none: '无',
  highlights: '行程亮点',
  accommodation: '住宿',
  activities: '活动安排',
  noAccommodationNight: '当晚无住宿安排。',
  mealPlanDay: (day) => `第 ${day} 天餐食安排`,
  altAvailable: (count) =>
    `当晚有 ${count} 个备选住宿，详见“备选住宿”章节。`,
  rooms: '房型：',
  travelers: '出行人数',
  pricing: '价格',
  proposalFor: (name) => `${name} 的报价单`,
  proposal: '报价单',
  breakdownOfCosts: '费用明细',
  totalIn: (currency) => `总计（${currency}）`,
  perPerson: '每人',
  optionalNotIncluded: '自选项目（不含）',
  confirmProposal: '确认报价',
  opensOnline: '在线打开报价单以确认行程日期。',
  included: '包含项目',
  excluded: '不含项目',
  paymentTerms: '付款条款',
  alternativeAccommodations: '备选住宿',
  accommodationDay: (day) => `住宿 · 第 ${day} 天`,
  mealPlanColon: '餐食安排：',
  booked: '已预订',
  roomsColon: '房型：',
  aboutUs: '关于我们',
  weOrg: (name) => `${name} 团队`,
  reviewedOn: '用户评价',
  reviewsSuffix: '条评价',
  contactUs: '联系我们',
  address: '地址',
  country: '国家',
  phone: '电话',
  email: '邮箱',
  website: '网站',
  followUsOn: '关注我们：',
  map: '地图',
  routeOverview: '每日路线概览',
  destination: '目的地',
  day: '天数',
  noAccommodation: '无住宿',
  goPin: '起',
  endPin: '终',
  pageFooter: (pageNumber) => `第 ${pageNumber} 页`,
};

const DICTS: Record<string, Labels> = { en, zh };

/** Resolves the PDF chrome dictionary for a content language, falling back to English. */
export function getLabels(language: string): Labels {
  return DICTS[isCJKLanguage(language) ? 'zh' : 'en'] ?? en;
}
