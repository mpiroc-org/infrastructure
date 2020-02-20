import * as cdk from '@aws-cdk/core'
import * as appsync from '@aws-cdk/aws-appsync'
import * as iam from '@aws-cdk/aws-iam'
import * as graphql from 'graphql'

import {
    DocumentNode,
    isListType,
    isNonNullType,
} from 'graphql'
import { ITransformSchemaResult, transformSchema } from '../transform'
import { getConnectionItemTemplates, getConnectionListTemplates } from '../templates'
import { getUnderlyingNamedType } from '../transform/util'
import { AppSyncModel } from './appsync-model'
import { IAppSyncConnection, IMappingTemplatePair } from '../transform/interfaces'

/**
 * @alpha
 */
export interface IAppSyncAPIProps {
    name: string
    source: DocumentNode
    authenticationType: `API_KEY` | `AWS_IAM` | `AMAZON_COGNITO_USER_POOLS` | `OPENID_CONNECT`
    awsRegion: string
}

/* eslint-disable no-new */

function addConnectionResolver<TSource, TContext>(
    models: Map<string, AppSyncModel<TSource, TContext>>,
    { modelType, field }: IAppSyncConnection<TSource, TContext>,
): appsync.CfnResolver {
    function getModel(name: string): AppSyncModel<TSource, TContext> {
        const model: AppSyncModel<TSource, TContext> | undefined = models.get(name)
        if (!model) {
            throw new Error(`Expected data source for model '${modelType.name}', but none was found.`)
        }

        return model
    }

    const underlyingFieldType: graphql.GraphQLNamedType | undefined = getUnderlyingNamedType(field.type)
    if (!underlyingFieldType) {
        throw new Error(`Could not determine underlying named type for type '${field.type}'`)
    }

    const model: AppSyncModel<TSource, TContext> = getModel(underlyingFieldType.name)

    if (isListType(field.type) || isNonNullType(field.type) && isListType(field.type)) {
        const templates: IMappingTemplatePair = getConnectionListTemplates(modelType, underlyingFieldType)
        
        return model.addResolver(modelType.name, field.name, templates)
    } else {
        const templates: IMappingTemplatePair = getConnectionItemTemplates(modelType, underlyingFieldType)

        return model.addResolver(modelType.name, field.name, templates)
    }
}

/**
 * @alpha
 */
export class AppSyncAPI<TSource, TContext> extends cdk.Construct {
    public readonly role: iam.Role

    public constructor(scope: cdk.Construct, id: string, {
        name,
        source,
        authenticationType,
        awsRegion,
    }: IAppSyncAPIProps) {
        super(scope, id)

        const transformed: ITransformSchemaResult<TSource, TContext> = transformSchema(source)
        const definition: string = transformed.source

        const api: appsync.CfnGraphQLApi = new appsync.CfnGraphQLApi(this, `api`, {
            authenticationType,
            name,
        })
        const apiId: string = api.attrApiId

        new appsync.CfnApiKey(this, `apiKey`, { apiId })

        const schema: appsync.CfnGraphQLSchema = new appsync.CfnGraphQLSchema(this, `schema`, {
            apiId,
            definition,
        })
        schema.addDependsOn(api)

        this.role = new iam.Role(this, `role`, {
            assumedBy: new iam.ServicePrincipal(`appsync.amazonaws.com`)
        })

        const models: Map<string, AppSyncModel<TSource, TContext>> = transformed.context.models
            .reduce(
                (result, model) => {
                    result.set(
                        model.names.main,
                        new AppSyncModel(this, model.names.main, {
                            schema,
                            awsRegion,
                            names: model.names,
                            role: this.role,
                            context: transformed.context,
                        })
                    )
                    return result
                },
                new Map<string, AppSyncModel<TSource, TContext>>()
            )

        for (const connection of transformed.context.connections) {
            addConnectionResolver(models, connection)
        }
    }
}

/* eslint-enable no-new */
