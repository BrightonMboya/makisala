import { router } from './init';
import { clientsRouter } from './routers/clients';
import { nationalParksRouter } from './routers/nationalParks';
import { activitiesRouter } from './routers/activities';
import { extrasRouter } from './routers/extras';
import { onboardingRouter } from './routers/onboarding';
import { accommodationsRouter } from './routers/accommodations';
import { commentsRouter } from './routers/comments';
import { notesRouter } from './routers/notes';
import { storageRouter } from './routers/storage';
import { contentLibraryRouter } from './routers/contentLibrary';
import { settingsRouter } from './routers/settings';
import { toursRouter } from './routers/tours';
import { proposalsRouter } from './routers/proposals';
import { invoicesRouter } from './routers/invoices';
import { translationsRouter } from './routers/translations';
import { rateCardsRouter } from './routers/rateCards';
import { pricingRouter } from './routers/pricing';
import { paymentMethodsRouter } from './routers/paymentMethods';
export const appRouter = router({
  clients: clientsRouter,
  nationalParks: nationalParksRouter,
  activities: activitiesRouter,
  extras: extrasRouter,
  onboarding: onboardingRouter,
  accommodations: accommodationsRouter,
  comments: commentsRouter,
  notes: notesRouter,
  storage: storageRouter,
  contentLibrary: contentLibraryRouter,
  settings: settingsRouter,
  tours: toursRouter,
  proposals: proposalsRouter,
  invoices: invoicesRouter,
  translations: translationsRouter,
  rateCards: rateCardsRouter,
  pricing: pricingRouter,
  paymentMethods: paymentMethodsRouter,
});

export type AppRouter = typeof appRouter;
