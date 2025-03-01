## API Report File for "@mpiroc-org/appsync"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import * as cdk from '@aws-cdk/core';
import { DocumentNode } from 'graphql';
import { GraphQLField } from 'graphql';
import { GraphQLNamedType } from 'graphql';
import { GraphQLObjectType } from 'graphql';
import * as iam from '@aws-cdk/aws-iam';

// @alpha (undocumented)
export class AppSyncAPI<TSource, TContext> extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, { name, source, authenticationType, awsRegion, }: IAppSyncAPIProps);
    // (undocumented)
    readonly role: iam.Role;
}

// @alpha (undocumented)
export interface IAppSyncAPIProps {
    // (undocumented)
    authenticationType: `API_KEY` | `AWS_IAM` | `AMAZON_COGNITO_USER_POOLS` | `OPENID_CONNECT`;
    // (undocumented)
    awsRegion: string;
    // (undocumented)
    name: string;
    // (undocumented)
    source: DocumentNode;
}

// @alpha (undocumented)
export interface ITransformSchemaResult<TSource, TContext> {
    // Warning: (ae-forgotten-export) The symbol "IAppSyncContext" needs to be exported by the entry point index.d.ts
    //
    // (undocumented)
    context: IAppSyncContext<TSource, TContext>;
    // (undocumented)
    source: string;
}

// @alpha (undocumented)
export function transformSchema<TSource, TContext>(root: DocumentNode): ITransformSchemaResult<TSource, TContext>;


// (No @packageDocumentation comment for this package)

```
