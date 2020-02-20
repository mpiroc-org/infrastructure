import {
    DocumentNode,
    GraphQLSchema,
    GraphQLSchemaConfig,
    GraphQLNamedType,
    GraphQLOutputType,
    isInputObjectType,
    GraphQLInputFieldMap,
    isListType,
    isNonNullType,
    GraphQLID,
    GraphQLInputObjectType,
    print,
} from 'graphql'
import { makeExecutableSchema, SchemaDirectiveVisitor } from 'graphql-tools'
import { mergeTypeDefs } from './util'
import {
    ConnectionDirective,
    typesToPrune as connectionTypesToPrune,
} from './visitors/connection'
import { amplifyDefinitions } from './definitions'
import {
    ModelDirective,
    typesToPrune as modelTypesToPrune,
    addModelInputTypes,
} from './visitors/model'
import { IAppSyncContext, IAppSyncConnection } from './interfaces'
import { addSubscribeDirectives } from './appsync'

// TODO: Don't rely on non-public API.
import { healSchema } from 'graphql-tools/dist/schemaVisitor'

const typesToPrune: Set<string> = new Set(modelTypesToPrune.concat(connectionTypesToPrune))

/**
 * @alpha
 */
export interface ITransformSchemaResult<TSource, TContext> {
    source: string
    context: IAppSyncContext<TSource, TContext>
}

function getInputType(schema: GraphQLSchema, name: string): GraphQLInputObjectType {
    const inputType: GraphQLNamedType | undefined | null = schema.getType(name)
    if (!inputType) {
        throw new Error(`Error: ID field should be added AFTER the model directive on the owning type has been transformed.`)
    }
    if (!isInputObjectType(inputType)) {
        throw new Error(`Found type ${inputType}, but it is not an input object`)
    }

    return inputType
}

function addIdField(type: GraphQLInputObjectType, idFieldName: string): void {
    const fields: GraphQLInputFieldMap = type.getFields()
    fields[idFieldName] = {
        name: idFieldName,
        type: GraphQLID,
        extensions: undefined
    }
}

function addIdFields<TSource, TContext>(schema: GraphQLSchema, connection: IAppSyncConnection<TSource, TContext>): void {
    const fieldType: GraphQLOutputType = connection.field.type
    if (isListType(fieldType) || isNonNullType(fieldType) && isListType(fieldType.ofType)) {
        return
    }
    const type: GraphQLNamedType | undefined | null = schema.getType(connection.modelType.name)
    if (!type) {
        throw new Error(`Could not find type '${connection.modelType.name}'`)
    }

    const createInputType: GraphQLInputObjectType = getInputType(schema, connection.createInputTypeName)
    const updateInputType: GraphQLInputObjectType = getInputType(schema, connection.updateInputTypeName)

    addIdField(createInputType, connection.idFieldName)
    addIdField(updateInputType, connection.idFieldName)
}


/**
 * @param root - The root node of the document to transform.
 * @alpha
 */
export function transformSchema<TSource, TContext>(root: DocumentNode): ITransformSchemaResult<TSource, TContext> {
    const schema: GraphQLSchema = makeExecutableSchema({
        typeDefs: mergeTypeDefs(...amplifyDefinitions, root)
    })

    const context: IAppSyncContext<TSource, TContext> = {
        models: [],
        connections: [],
        subscriptionMap: {},
    }

    SchemaDirectiveVisitor.visitSchemaDirectives(
        schema,
        {
            model: ModelDirective,
            connection: ConnectionDirective,
        },
        context
    )

    for (const model of context.models) {
        addModelInputTypes(model.context)
    }

    for (const connection of context.connections) {
        const fieldType: GraphQLOutputType = connection.field.type
        if (!isListType(fieldType) && !(isNonNullType(fieldType) && isListType(fieldType))) {
            addIdFields(schema, connection)
        }
    }

    const config: GraphQLSchemaConfig & { types: GraphQLNamedType[] } = healSchema(schema).toConfig()

    const prunedSchema: GraphQLSchema = new GraphQLSchema({
        ...config,
        types: config.types.filter(type => !typesToPrune.has(type.name)),
        directives: [],
    })

    return {
        source: print(addSubscribeDirectives(prunedSchema, context.subscriptionMap)),
        context
    }
}
