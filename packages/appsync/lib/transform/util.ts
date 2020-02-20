import {
    GraphQLArgument,
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLField,
    GraphQLFieldMap,
    GraphQLFloat,
    GraphQLID,
    GraphQLInputObjectType,
    GraphQLInputType,
    GraphQLInt,
    GraphQLNamedType,
    GraphQLNonNull,
    GraphQLNullableType,
    GraphQLObjectType,
    GraphQLOutputType,
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLString,
    isInputType,
    isLeafType,
    isNamedType,
    isNonNullType,
    isObjectType,
    isWrappingType,
} from 'graphql'
import { ITypedef, ITypeDefinitions, makeExecutableSchema } from 'graphql-tools'
import { ITypeMap } from './interfaces'
import { commonNames } from './names'
import { appsyncDefinitions } from './definitions'

/**
 * @internal
 */
export const AWSTimestampType: GraphQLScalarType = new GraphQLScalarType({
    ...GraphQLInt.toConfig(),
    name: `AWSTimestamp`,
    description: `The AWSTimestamp scalar type represents the number of seconds that have elapsed since 1970-01-01T00:00Z. Timestamps are serialized and deserialized as numbers. Negative values are also accepted and these represent the number of seconds till 1970-01-01T00:00Z.`
})


/**
 * @param name - The name of the placeholder object type.
 * @internal
 */
export function placeholderObject(name: string): GraphQLObjectType {
    return new GraphQLObjectType({
        name,
        fields: {}
    })
}

/**
 * @param name - The name of the placeholder input object type.
 * @internal
 */
export function placeholderInputObject(name: string): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name,
        fields: {}
    })
}

/**
 * @param name - The name of the placeholder enum type.
 * @internal
 */
export function placeholderEnum(name: string): GraphQLEnumType {
    return new GraphQLEnumType({
        name,
        values: {}
    })
}

/**
 * @param typeDefs The type definitions to merge into a single definition.
 * @internal
 */
export function mergeTypeDefs(...typeDefs: ITypeDefinitions[]): ITypeDefinitions {
    function toArray(typeDefs: ITypeDefinitions): ITypedef[] {
        return Array.isArray(typeDefs) ? typeDefs : [ typeDefs ]
    }

    const result: ITypedef[] = typeDefs.reduce<ITypedef[]>(
        (result, current) => result.concat(toArray(current)),
        []
    )

    return result.length === 1 ? result[0] : result
}

/**
 * @param typeDefs - The type definitions from which to generate a schema.
 * @internal
 */
export function buildSchema(typeDefs: ITypeDefinitions): GraphQLSchema {
    return makeExecutableSchema({
        typeDefs: mergeTypeDefs(...appsyncDefinitions, typeDefs)
    })
}

/**
 * @param type The type to convert to a nullable type.
 * @internal
 */
export function toNullableType(type: GraphQLInputType): GraphQLInputType {
    if (isNonNullType(type)) {
        return type.ofType
    }

    return type
}

/**
 * @param singular The singular form of the word to pluralize.
 * @internal
 */
export function pluralize(singular: string): string {
    // TODO: Replace placeholder implementation with real implementation, or use third-party package.
    return `${singular}s`
}

/**
 * @param pascalCase The PascalCase form of the identifier to convert to camelCase.
 * @internal
 */
export function toCamelCase(pascalCase: string): string {
    return `${pascalCase.substring(0, 1).toLowerCase()}${pascalCase.substring(1)}`
}


/**
 * @param field - The field whose input type to get.
 * @internal
 */
export function getModelInputType<TSource, TContext>(
    field: GraphQLField<TSource, TContext>
): GraphQLInputType | undefined {
    const { type } = field

    if (!isInputType(type)) {
        return undefined
    }

    switch(toNullableType(type)) {
        case GraphQLID:
            return placeholderInputObject(commonNames.idInput)
        case GraphQLString:
            return placeholderInputObject(commonNames.stringInput)
        case GraphQLInt:
            return placeholderInputObject(commonNames.intInput)
        case GraphQLFloat:
            return placeholderInputObject(commonNames.floatInput)
        case GraphQLBoolean:
            return placeholderInputObject(commonNames.booleanInput)
        default:
            return undefined
    }
}

/**
 * @param name The name of the argument
 * @param type The GraphQL type of the argument
 * @internal
 */
export function createArgument(name: string, type: GraphQLInputType): GraphQLArgument {
    return {
        name,
        type,
        description: undefined,
        defaultValue: undefined,
        extensions: undefined,
        astNode: undefined
    }
}

/**
 * @param name The name of the field.
 * @param type The return type of the field.
 * @param args The arguments for the field.
 * @internal
 */
export function createField<TSource, TContext>(
    name: string,
    type: GraphQLOutputType,
    args: GraphQLArgument[] = [],
): GraphQLField<TSource, TContext> {
    return {
        name,
        type,
        args,
        description: undefined,
        extensions: undefined,
    }
}

/**
 * @param options - The options for the new input object type.
 * @internal
 */
export function createInputObjectTypePlaceholder(
    options: {
        type: GraphQLOutputType
        types: ITypeMap
    }
): GraphQLInputType | undefined {
    const { type, types } = options
    if (isLeafType(type)) {
        return type
    }

    if (isNonNullType(type)) {
        const innerType: GraphQLNullableType | undefined = createInputObjectTypePlaceholder({
            type: type.ofType,
            types
        })

        if (innerType) {
            return new GraphQLNonNull(innerType)
        }

        return undefined
    }

    if (isObjectType(type)) {
        return placeholderInputObject(`${type.name}Input`)
    }

    return undefined
}

/**
 * @param field - The field whose types (directly or indirectly referenced) to check.
 * @internal
 */
export function getMissingInputTypes<TSource, TContext>(field: GraphQLField<TSource, TContext>): string[] {
    // The type definition for GraphQLField.args is incorrect--args can be undefined.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (field.args?.length > 0) {
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
        return []
    }

    const type: GraphQLOutputType = field.type

    if (isNonNullType(type)) {
        return getMissingInputTypes(type.ofType)
    }

    if (isObjectType(type)) {
        const fields: GraphQLFieldMap<TSource, TContext> = type.getFields()
        return Object.keys(fields)
            .reduce<string[]>(
                (result, key) => result.concat(getMissingInputTypes(fields[key])),
                [ type.name ]
            )
    }

    return []
}

/**
 * @param type - The (possibly wrapped) type to unwrap.
 * @internal
 */
export function getUnderlyingNamedType(type: GraphQLOutputType): GraphQLNamedType | undefined {
    if (isWrappingType(type)) {
        return getUnderlyingNamedType(type.ofType)
    }

    if (isNamedType(type)) {
        return type
    }

    return undefined
}
