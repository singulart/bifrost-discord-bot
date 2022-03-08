import { DiscordClientProvider, Once } from '@discord-nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageEmbed, TextChannel } from 'discord.js';
import moment from 'moment';
import { SalpLiteIssued, SalpLiteRedeemed, Sdk } from 'src/types';
import { botConfig } from '../config';

@Injectable()
export class BifrostService {
  private readonly logger = new Logger(BifrostService.name);

  constructor(
    @Inject("BifrostGqlSdk") private readonly sdk: Sdk,
    private readonly discordProvider: DiscordClientProvider,
  ) { }

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

    const mintEvents = await this.sdk.BifrostMinted({ dateFrom: createdAt });
    this.logger.log(`Total mint events: ${mintEvents.salpLiteIssueds?.totalCount}`);
    mintEvents.salpLiteIssueds?.nodes.forEach(async element => {
      const channel: TextChannel = this.discordProvider.getClient().channels.cache.get(botConfig.mintChannel) as TextChannel;
      const sentMessage = await channel.send({
        embeds: [this.createMintEmbed(element as SalpLiteIssued)]
      });
      this.logger.debug(`Announced ${sentMessage.id}`);        
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async queryRedemptions(): Promise<void> {
    const createdAgo: number = botConfig.createdAgo;
    const createdAgoUnit: string = botConfig.createdAgoUnit;
    const createdAt = moment().utc().subtract(createdAgo, createdAgoUnit as moment.unitOfTime.DurationConstructor);
    const formattedDate = createdAt.format("YYYY-DD-MMMTHH:mm:ssZ");
    this.logger.log(`Looking for redemption events since ${formattedDate}`);

    const mintEvents = await this.sdk.BifrostRedeemed({ dateFrom: createdAt });
    this.logger.log(`Total redemption events: ${mintEvents.salpLiteRedeemeds?.totalCount}`);
    mintEvents.salpLiteRedeemeds?.nodes.forEach(async element => {
      const channel: TextChannel = this.discordProvider.getClient().channels.cache.get(botConfig.mintChannel) as TextChannel;
      const sentMessage = await channel.send({
        embeds: [this.createRedemptionEmbed(element as SalpLiteRedeemed)]
      });
      this.logger.debug(`Announced ${sentMessage.id}`);        
    });
  }

  createMintEmbed(mintEvent: SalpLiteIssued): MessageEmbed {
    return this.createAnnouncementEmbed(mintEvent, 'redemption')
  }

  createRedemptionEmbed(mintEvent: SalpLiteRedeemed): MessageEmbed {
    return this.createAnnouncementEmbed(mintEvent, 'mint')
  }

  createAnnouncementEmbed(mintEvent: SalpLiteIssued | SalpLiteRedeemed, evetType: string): MessageEmbed {
    const announcementEmbed = new MessageEmbed()
    .setTitle(`🌿 New ${evetType} event`)
    .addField('Account', `${mintEvent.account}`, true)
    .addField('Parachain', `${mintEvent.paraId}`, true)
    .addField('Block #', `${mintEvent.blockHeight}`, true)
    .addField('Amount', `${mintEvent.balance}`, true)
    .setTimestamp(mintEvent.blockTimestamp);

    return announcementEmbed;
  }


}