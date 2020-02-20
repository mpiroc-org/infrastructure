import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLOutputType,
    GraphQLInputType,
    GraphQLField,
    GraphQLFieldMap,
    GraphQLInputField,
    GraphQLInputFieldMap,
} from 'graphql'

export function getField<TSource, TContext>(owner: GraphQLObjectType, name: string): GraphQLField<TSource, TContext>
export function getField<TSource, TContext>(owner: GraphQLInputObjectType, name: string): GraphQLInputField
export function getField<TSource, TContext>(owner: GraphQLObjectType | GraphQLInputObjectType, name: string): GraphQLField<TSource, TContext> | GraphQLInputField
export function getField<TSource, TContext>(owner: GraphQLObjectType | GraphQLInputObjectType, name: string): GraphQLField<TSource, TContext> | GraphQLInputField {
    const fields: GraphQLFieldMap<TSource, TContext> | GraphQLInputFieldMap = owner.getFields()
    const field: GraphQLField<TSource, TContext> | GraphQLInputField = fields[name]

    expect(field).toBeTruthy()

    return field
}

export function getFieldType<TSource, TContext>(owner: GraphQLObjectType, name: string): GraphQLOutputType
export function getFieldType<TSource, TContext>(owner: GraphQLInputObjectType, name: string): GraphQLInputType
export function getFieldType<TSource, TContext>(owner: GraphQLObjectType | GraphQLInputObjectType, name: string): GraphQLOutputType | GraphQLInputType {
    const field: GraphQLField<TSource, TContext> | GraphQLInputField = getField(owner, name)

    expect(field.name).toStrictEqual(name)

    return field.type
}
