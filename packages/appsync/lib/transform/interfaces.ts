import {
    GraphQLNamedType,
    GraphQLObjectType,
    GraphQLField,
} from 'graphql'

/**
 * @internal
 */
export interface ITypeMap {
    [key: string]: GraphQLNamedType | undefined
}

/**
 * @internal
 */
export interface IAppSyncContext<TSource, TContext> {
    readonly models: IAppSyncModel[]
    readonly connections: IAppSyncConnection<TSource, TContext>[]
    readonly subscriptionMap: {
        [subscriptionName: string]: string[] | undefined
    }
}

/**
 * @internal
 */
export interface IAppSyncModel {
    names: IModelNames
    context: IModelContext
}

/**
 * @internal
 */
export interface IMappingTemplatePair {
    request: string
    response: string
}

/**
 * @internal
 */
export interface IAppSyncConnection<TSource, TContext> {
    modelType: GraphQLObjectType
    createInputTypeName: string
    updateInputTypeName: string
    field: GraphQLField<TSource, TContext>
    idFieldName: string
    name: string
    args: IConnectionDirectiveArgs
}

/**
 * @internal
 */
export interface IConnectionDirectiveArgs {
    name?: string
    fields?: string[]
}

/**
 * @internal
 */
export interface ICommonNames {
    sortDirection: string
    attributeTypes: string
    sizeInput: string
    stringInput: string
    idInput: string
    intInput: string
    floatInput: string
    booleanInput: string
}

/**
 * @internal
 */
export interface IModelNames {
    main: string
    modelConnection: string
    createInput: string
    updateInput: string
    deleteInput: string
    modelFilterInput: string
    modelConditionInput: string
    query: {
        name: string
        get: string
        list: string
        sync: string
    }
    mutation: {
        name: string
        create: string
        update: string
        delete: string
    }
    subscription: {
        name: string
        onCreate: string
        onUpdate: string
        onDelete: string
    }
}

/**
 * @internal
 */
export interface IModelContext {
    type: GraphQLObjectType
    types: ITypeMap
    missingTypes: Set<string>
    names: IModelNames
}
