import { CronExpression } from "@nestjs/schedule";

export const botConfig = {
    // ID of Discord server to deploy your bot to
    server: '852805158260965426',
    // ID of the channel to send notifications about mint events
    mintChannel: '951156427228078142',
    // ID of the channel to send notifications about redemption events
    redemptionChannel: '951156427228078142',
    // Subquery GraphQL endpoint to fetch the data from
    endpoint: 'http://localhost:3000',
    // the following two properties define the moment of time from which the data is queried
    createdAgo: 30,
    createdAgoUnit: "seconds",
    // Cron expression, defines the periodicity of queries made by the bot
    frequency: CronExpression.EVERY_30_SECONDS
  }
  