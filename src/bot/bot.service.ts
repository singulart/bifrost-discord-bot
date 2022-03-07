import { DiscordClientProvider, Once } from '@discord-nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
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

  async queryMints(): Promise<any | null> {
    return (await this.sdk.BifrostMinted({dateFrom: new Date()})).salpLiteIssueds?.totalCount
  }

}