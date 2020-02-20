import * as cdk from '@aws-cdk/core'
import * as appsync from '@aws-cdk/aws-appsync'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as iam from '@aws-cdk/aws-iam'

import { isListType } from 'graphql'
import {
    IModelNames,
    IMappingTemplatePair,
    IAppSyncContext,
} from '../transform/interfaces'
import { MappingTemplates } from '../templates'

/**
 * @internal
 */
export interface IAppSyncModelProps<TSource, TContext> {
    schema: appsync.CfnGraphQLSchema
    awsRegion: string
    names: IModelNames
    role: iam.Role
    context: IAppSyncContext<TSource, TContext>
}

/* eslint-disable no-new */

/**
 * @internal
 */
export class AppSyncModel<TSource, TContext> extends cdk.Construct {
    private readonly _schema: appsync.CfnGraphQLSchema
    private readonly _table: dynamodb.Table
    private readonly _dataSource: appsync.CfnDataSource
    private readonly _names: IModelNames

    public constructor(scope: cdk.Construct, id: string, {
        schema,
        names,
        awsRegion,
        role,
        context,
    }: IAppSyncModelProps<TSource, TContext>) {
        super(scope, id)

        this._schema = schema
        this._names = names

        this._table = new dynamodb.Table(this, `table`, {
            tableName: this._names.main,
            partitionKey: {
                name: `id`,
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            timeToLiveAttribute: `_ttl`,
        })

        for (const connection of context.connections.filter(connection => connection.modelType.name === this._names.main)) {
            if (!isListType(connection.field.type)) {
                const indexName: string = `gsi-${connection.name}`
                const partitionKeyName: string = connection.idFieldName

                this._table.addGlobalSecondaryIndex({
                    indexName,
                    partitionKey: {
                        name: partitionKeyName,
                        type: dynamodb.AttributeType.STRING
                    }
                })
            }
        }

        this._table.grantReadWriteData(role)

        this._dataSource = new appsync.CfnDataSource(this, `dataSource`, {
            apiId: this._schema.apiId,
            name: this._names.main,
            type: `AMAZON_DYNAMODB`,
            description: ``,
            dynamoDbConfig: {
                awsRegion,
                tableName: this._table.tableName,
                versioned: true,
            },
            serviceRoleArn: role.roleArn,
        })
        this._dataSource.addDependsOn(this._schema)

        const {
            query,
            mutation
        } = new MappingTemplates(this._names.main)

        this.addResolver(this._names.query.name, this._names.query.get, query.get)
            .addDependsOn(this._dataSource)
        this.addResolver(this._names.query.name, this._names.query.list, query.list)
            .addDependsOn(this._dataSource)
        this.addResolver(this._names.query.name, this._names.query.sync, query.sync)
            .addDependsOn(this._dataSource)

        this.addResolver(this._names.mutation.name, this._names.mutation.create, mutation.create)
            .addDependsOn(this._dataSource)
        this.addResolver(this._names.mutation.name, this._names.mutation.update, mutation.update)
            .addDependsOn(this._dataSource)
        this.addResolver(this._names.mutation.name, this._names.mutation.delete, mutation.delete)
            .addDependsOn(this._dataSource)
    }

    public addResolver(
        typeName: string,
        fieldName: string,
        templates: IMappingTemplatePair
    ): appsync.CfnResolver {
        const resolver: appsync.CfnResolver = new appsync.CfnResolver(this, fieldName, {
            apiId: this._schema.apiId,
            dataSourceName: this._dataSource.name,
            typeName,
            fieldName,
            requestMappingTemplate: templates.request,
            responseMappingTemplate: templates.response,
            kind: `UNIT`,
            syncConfig: {
                conflictDetection: `VERSION`,
                conflictHandler: `AUTOMERGE`,
            },
        })

        resolver.addDependsOn(this._dataSource)

        return resolver
    }
}

/* eslint-enable no-new */