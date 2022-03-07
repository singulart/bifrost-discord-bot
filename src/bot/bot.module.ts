import { DiscordModule, DiscordModuleOption } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Intents, Message } from 'discord.js';
import { GraphQLModule } from 'src/gql/gql.module';
import { botConfig } from '../config';
import { BifrostService } from './bot.service';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      imports: [ConfigModule, GraphQLModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('TOKEN'),
        commands: ['**/*.command.js'],
        discordClientOptions: {
          intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
        },
        removeGlobalCommands: true,
        registerCommandOptions: [
          {
            forGuild: botConfig.server,
            allowFactory: (message: Message) =>
              !message.author.bot && message.content === '!deploy',
            removeCommandsBefore: true,
          },
        ],
      } as DiscordModuleOption),
      inject: [ConfigService, 'BifrostGqlSdk'],
    }),
    GraphQLModule
  ],
  providers: [BifrostService]
})
export class BotModule {}