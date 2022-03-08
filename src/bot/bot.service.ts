import { DiscordClientProvider, Once } from '@discord-nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { Sdk } from 'src/types';
import { botConfig } from '../config';

@Injectable()
export class BifrostService {
  private readonly logger = new Logger(BifrostService.name);

  constructor(
      @Inject("BifrostGqlSdk") private readonly sdk: Sdk, 
      private readonly discordProvider: DiscordClientProvider,
  ) {}

  @Once('ready')
  async onReady(): Promise<void> {
    this.logger.log(
      `Logged in as ${this.discordProvider.getClient()?.user?.tag}!`,
    );
    await this.discordProvider.getClient().channels.fetch(botConfig.mintChannel);
    await this.discordProvider.getClient().channels.fetch(botConfig.redemptionChannel);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async queryMints(): Promise<any | null> {
    const createdAgo: number = botConfig.createdAgo;
    const createdAgoUnit: string = botConfig.createdAgoUnit;
    const createdAt = moment().utc().subtract(createdAgo, createdAgoUnit as moment.unitOfTime.DurationConstructor);
    const formattedDate = createdAt.format("YYYY-DD-MMMTHH:mm:ssZ");
    this.logger.log(`Looking for mint events since ${formattedDate}`);

    const mintEvents = await this.sdk.BifrostMinted({dateFrom: new Date()});
    this.logger.log(`Total mint events: ${mintEvents.salpLiteIssueds?.totalCount}`);
  }
}