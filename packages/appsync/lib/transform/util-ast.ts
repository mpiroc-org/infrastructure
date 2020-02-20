// TODO: Move to separate GraphQL utility package
import {
    GraphQLType,
    isNonNullType,
    isListType,
    TypeNode,
} from 'graphql'
import {
    ListType,
    Name,
    NamedType
} from './kinds'

/**
 * @param type The type to convert to a TypeNode.
 * @internal
 */
export function fromType(type: GraphQLType): TypeNode {
    if (isNonNullType(type)) {
        if (isListType(type.ofType)) {
            return ListType({ type: fromType(type.ofType.ofType)})
        }

        return NamedType({ name: Name({ value: type.ofType.name }) })
    }

    if (isListType(type)) {
        return ListType({ type: fromType(type.ofType) })
    }

    return NamedType({ name: Name({ value: type.name })})
}
