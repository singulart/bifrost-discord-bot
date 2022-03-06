import { DiscordModule, DiscordModuleOption } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Intents, Message } from 'discord.js';
import { botConfig } from '../config';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
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
      inject: [ConfigService],
    }),
  ],
  providers: []
})
export class BotModule {}