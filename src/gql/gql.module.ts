import { GraphQLRequestModule } from '@golevelup/nestjs-graphql-request';
import { Module } from '@nestjs/common';
import { botConfig } from '../config';

@Module({
  imports: [
    GraphQLRequestModule.forRoot(GraphQLRequestModule, {
      // Exposes configuration options based on the graphql-request package
      endpoint: botConfig.endpoint,
      options: {
        headers: {
          'content-type': 'application/json'
        },
      },
    }),
  ],
})
export class GraphQLModule {}