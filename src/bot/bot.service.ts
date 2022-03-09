import { DiscordClientProvider, Once } from '@discord-nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChannelManager, MessageEmbed, TextChannel } from 'discord.js';
import { SalpLiteIssued, SalpLiteRedeemed, Sdk } from 'src/types';
import { botConfig } from '../config';
import moment from 'moment';

@Injectable()
export class BifrostService {
  private readonly logger = new Logger(BifrostService.name);

  private readonly dateFormat = "YYYY-DD-MMMTHH:mm:ssZ";

  constructor(
    @Inject("BifrostGqlSdk") private readonly sdk: Sdk,
    private readonly discordProvider: DiscordClientProvider,
  ) { }

  @Once('ready')
  async onReady(): Promise<void> {
    this.logger.log(
      `Logged in as ${this.discordProvider.getClient()?.user?.tag}!`,
    );
    let channels: ChannelManager = this.discordProvider.getClient().channels;
    await channels.fetch(botConfig.mintChannel);
    await channels.fetch(botConfig.redemptionChannel);
  }

  @Cron(botConfig.frequency)
  async queryMints(): Promise<void> {
    const createdAt = moment().utc().subtract(botConfig.createdAgo, botConfig.createdAgoUnit as moment.unitOfTime.DurationConstructor);
    this.logger.log(`Looking for mint events since ${createdAt.format(this.dateFormat)}`);

    const mintEvents = await this.sdk.BifrostMinted({ dateFrom: createdAt });
    this.logger.log(`Total mint events: ${mintEvents.salpLiteIssueds?.totalCount}`);
    mintEvents.salpLiteIssueds?.nodes.forEach(async element => {
      const channel = this.getChannel(botConfig.mintChannel);
      const sentMessage = await channel.send({
        embeds: [this.createMintEmbed(element as SalpLiteIssued)]
      });
      this.logger.debug(`Announced ${sentMessage.id}`);        
    });
  }

  @Cron(botConfig.frequency)
  async queryRedemptions(): Promise<void> {
    const createdAt = moment().utc().subtract(botConfig.createdAgo, botConfig.createdAgoUnit as moment.unitOfTime.DurationConstructor);
    this.logger.log(`Looking for redemption events since ${createdAt.format(this.dateFormat)}`);

    const redemptionEvents = await this.sdk.BifrostRedeemed({ dateFrom: createdAt });
    this.logger.log(`Total redemption events: ${redemptionEvents.salpLiteRedeemeds?.totalCount}`);
    redemptionEvents.salpLiteRedeemeds?.nodes.forEach(async element => {
      const channel = this.getChannel(botConfig.redemptionChannel);
      const sentMessage = await channel.send({
        embeds: [this.createRedemptionEmbed(element as SalpLiteRedeemed)]
      });
      this.logger.debug(`Announced ${sentMessage.id}`);        
    });
  }

  getChannel(channel: string): TextChannel {
    return this.discordProvider.getClient().channels.cache.get(channel) as TextChannel;
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