import {
    GraphQLArgument,
    GraphQLField,
    GraphQLInputType,
    GraphQLInt,
    GraphQLInterfaceType,
    GraphQLNamedType,
    GraphQLObjectType,
    GraphQLString,
    isObjectType,
    isListType,
    isNonNullType,
    GraphQLOutputType,
    isNullableType,
    isOutputType,
} from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { commonNames, getModelNames } from '../names'
import {
    placeholderEnum,
    placeholderInputObject,
    placeholderObject,
    toCamelCase,
    getUnderlyingNamedType
} from '../util'

import {
    IAppSyncContext,
    IConnectionDirectiveArgs,
    IModelNames,
} from '../interfaces'

/**
 * @internal
 */
export const typesToPrune: string[] = []

function createFieldArgument(name: string, type: GraphQLInputType): GraphQLArgument {
    return {
        name,
        description: ``,
        type,
        defaultValue: undefined,
        extensions: undefined,
        astNode: undefined
    }
}

function transformSchema<TSource, TContext>(
    { context, args, modelType, field, targetType }: {
        context: IAppSyncContext<TSource, TContext>
        args: IConnectionDirectiveArgs
        modelType: GraphQLObjectType
        field: GraphQLField<TSource, TContext>
        targetType: GraphQLOutputType
    }
): GraphQLField<TSource, TContext> {
    // The type definition for GraphQLField.args is incorrect--args can be undefined.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (field.args?.length > 0) {
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
        throw new Error(`The @connection directive may only be applied to fields with no arguments`)
    }

    if (isNonNullType(targetType)) {
        // This should always be true.
        if (isNullableType(targetType.ofType) && isOutputType(targetType.ofType)) {
            return transformSchema({
                context,
                args,
                modelType,
                field,
                targetType: targetType.ofType,
            })
        } else {
            throw new Error(`Unexpected type: ${targetType.ofType}`)
        }
    }

    const namedTargetType: GraphQLNamedType | undefined = getUnderlyingNamedType(targetType)
    if (!namedTargetType) {
        throw new Error(`Could not find underlying named type for list ${targetType}`)
    }

    const names: IModelNames = getModelNames(modelType.name)
    context.connections.push({
        modelType,
        createInputTypeName: names.createInput,
        updateInputTypeName: names.updateInput,
        field, // Use original rather than transformed field.
        idFieldName: toCamelCase(`${modelType.name}${namedTargetType.name}Id`),
        name: args.name ?? `$${modelType.name}${namedTargetType.name}`,
        args: args
    })

    if (isObjectType(targetType)) {
        return field
    }

    if (isListType(targetType)) {
        const { modelConnection, modelFilterInput } = getModelNames(namedTargetType.name)

        return {
            name: field.name,
            description: field.description,
            type: placeholderObject(modelConnection),
            args: [
                createFieldArgument(`filter`, placeholderInputObject(modelFilterInput)),
                createFieldArgument(`sortDirection`, placeholderEnum(commonNames.sortDirection)),
                createFieldArgument(`limit`, GraphQLInt),
                createFieldArgument(`nextToken`, GraphQLString)
            ],
            extensions: field.extensions
        }
    }

    throw new Error(`The @connection directive may only be applied to fields that return an object, list, non-null object, or non-null list`)
}

/**
 * @internal
 */
export class ConnectionDirective<TSource, TContext> extends SchemaDirectiveVisitor {
    public visitFieldDefinition(
        field: GraphQLField<TSource, TContext>,
        { objectType }: {
            objectType: GraphQLObjectType | GraphQLInterfaceType
        }
    ): GraphQLField<TSource, TContext> {
        if (!isObjectType(objectType)) {
            throw new Error(`The @connection directive may only be applied to fields that belong to an object type`)
        }

        return transformSchema({
            context: this.context as IAppSyncContext<TSource, TContext>,
            args: this.args as IConnectionDirectiveArgs,
            modelType: objectType,
            field,
            targetType: field.type,
        })
    }
}
