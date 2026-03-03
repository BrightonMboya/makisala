const databaseUrl = new sst.Secret("DatabaseUrl");

new sst.cloudflare.Cron("ProposalCompletion", {
  schedule: "0 0 * * *", // midnight UTC
  job: {
    handler: "workers/proposal-completion.ts",
    link: [databaseUrl],
  },
});
