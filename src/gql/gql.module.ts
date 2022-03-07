import { GraphQLClientInject, GraphQLRequestModule } from '@golevelup/nestjs-graphql-request';
import { Module } from '@nestjs/common';
import { getSdk } from 'src/types';
import { botConfig } from '../config';
import { GraphQLClient } from 'graphql-request';

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
  providers: [
    {
      // you can provide whatever key you want. use it in conjunction with @Inject("BifrostGqlSdk") to get the SDK instance in your controllers/services
      provide: 'BifrostGqlSdk',
      inject: [GraphQLClientInject],
      useFactory: (client: GraphQLClient) => getSdk(client),
    },
  ],
  exports: ['BifrostGqlSdk']
})
export class GraphQLModule {}