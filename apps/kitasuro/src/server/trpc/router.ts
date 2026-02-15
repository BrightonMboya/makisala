import { router } from './init';
import { clientsRouter } from './routers/clients';
import { nationalParksRouter } from './routers/nationalParks';
import { activitiesRouter } from './routers/activities';
import { onboardingRouter } from './routers/onboarding';
import { accommodationsRouter } from './routers/accommodations';
import { commentsRouter } from './routers/comments';
import { notesRouter } from './routers/notes';
import { storageRouter } from './routers/storage';
import { contentLibraryRouter } from './routers/contentLibrary';
import { settingsRouter } from './routers/settings';
import { toursRouter } from './routers/tours';
import { proposalsRouter } from './routers/proposals';

export const appRouter = router({
  clients: clientsRouter,
  nationalParks: nationalParksRouter,
  activities: activitiesRouter,
  onboarding: onboardingRouter,
  accommodations: accommodationsRouter,
  comments: commentsRouter,
  notes: notesRouter,
  storage: storageRouter,
  contentLibrary: contentLibraryRouter,
  settings: settingsRouter,
  tours: toursRouter,
  proposals: proposalsRouter,
});

export type AppRouter = typeof appRouter;
