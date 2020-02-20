import {
    GraphQLBoolean,
    GraphQLInt,
    GraphQLObjectType,
    GraphQLNamedType,
    GraphQLNonNull,
    isObjectType,
    GraphQLFieldMap,
    GraphQLList,
    GraphQLString,
    GraphQLInputFieldConfigMap,
    GraphQLInputType,
    GraphQLInputObjectType,
    GraphQLOutputType,
    isLeafType,
    isNamedType,
    isNonNullType,
    GraphQLID,
    GraphQLField,
    GraphQLArgument,
} from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import {
    createSortDirectionType,
    createAttributeTypesType,
    createSizeInputType,
    createStringInputType,
    createIdInputType,
    createIntInputType,
    createFloatInputType,
    createBooleanInputType
} from '../common'
import {
    ITypeMap,
    IAppSyncContext,
    IModelContext,
    IModelNames,
} from '../interfaces'
import { getModelNames } from '../names'
import {
    AWSTimestampType,
    placeholderObject,
    placeholderInputObject,
    getMissingInputTypes,
    toNullableType,
    getModelInputType,
    createArgument,
    createField,
} from '../util'

/**
 * @internal
 */
export const typesToPrune: string[] = [
    `ModelMutationMap`,
    `ModelQueryMap`,
    `ModelSubscriptionMap`,
    `ModelSubscriptionLevel`
]

function _createInputFields<TSource, TContext>(
    context: IModelContext,
    {
        factory,
        transform = type => type
    }: {
        factory: (context: IModelContext, field: GraphQLField<TSource, TContext>) => GraphQLInputType | undefined
        transform?: (type: GraphQLInputType) => GraphQLInputType
    }
): GraphQLInputFieldConfigMap {
    const { missingTypes, types, type } = context
    const transformedType: GraphQLObjectType = types[type.name] as GraphQLObjectType

    const fields: GraphQLInputFieldConfigMap = Object.entries(transformedType.getFields())
        .filter(([ key ]) => key !== `id` && !key.startsWith(`_`))
        .reduce<GraphQLInputFieldConfigMap>(
            (result, [ key, field ]) => {
                const fieldInputType: GraphQLInputType | undefined = factory(context, field)
                if (fieldInputType) {
                    result[key] = { type: transform(fieldInputType) }

                    for (const missingType of getMissingInputTypes(field)) {
                        missingTypes.add(missingType)
                    }
                }

                return result
            },
            {}
        )
    
    return fields
}

function _createInputTypePlaceholder<TSource, TContext>(
    { missingTypes }: Pick<IModelContext, 'missingTypes'>,
    field: GraphQLField<TSource, TContext>,
): GraphQLInputType | undefined {
    // The type definition for GraphQLField.args is incorrect--args can be undefined.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (field.args?.length > 0) {
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
        return undefined
    }

    const { type } = field

    if (isLeafType(type)) {
        return type
    }

    if (isNonNullType(type)) {
        const innerPlaceholder: GraphQLInputType | undefined = _createInputTypePlaceholder(
            { missingTypes },
            {
                ...field,
                type: type.ofType
            }
        )

        return innerPlaceholder ? new GraphQLNonNull(innerPlaceholder) : undefined
    }

    if (isObjectType(type)) {
        for (const missingInputType of getMissingInputTypes(field)) {
            missingTypes.add(missingInputType)
        }

        return placeholderInputObject(`${type.name}Input`)
    }

    return undefined
}

function _createInputType<TSource, TContext>(
    { missingTypes }: Pick<IModelContext, 'missingTypes'>,
    type: GraphQLObjectType
): GraphQLInputObjectType | undefined {
    const name: string = `${type.name}Input`
    const fields: GraphQLFieldMap<TSource, TContext> = type.getFields()
    const inputFields: GraphQLInputFieldConfigMap = Object.keys(fields)
        .reduce<GraphQLInputFieldConfigMap>(
            (result, key) => {
                const field: GraphQLField<TSource, TContext> = fields[key]

                const fieldInputType: GraphQLInputType | undefined = _createInputTypePlaceholder({ missingTypes }, field)
                if (fieldInputType) {
                    result[key] = { type: fieldInputType }
                }

                return result
            },
            {}
        )
    
    return new GraphQLInputObjectType({
        name,
        fields: inputFields
    })
}

function addType<TResult extends (GraphQLNamedType | undefined)>(
    { types }: Pick<IModelContext, 'types'>,
    { type, overwrite }: {
        type: TResult
        overwrite?: boolean
    }
): GraphQLNamedType | undefined {
    if (isNamedType(type) && (overwrite || !types[type.name])) {
        types[type.name] = type
    }

    return type
}

function createMainType<TSource, TContext>(
    { type }: Pick<IModelContext, 'type'>
): GraphQLObjectType {
    const fields: GraphQLFieldMap<TSource, TContext> = type.getFields()

    fields[`_version`] = createField(`_version`, new GraphQLNonNull(GraphQLInt))
    fields[`_deleted`] = createField(`_deleted`, GraphQLBoolean)
    fields[`_lastChangedAt`] = createField(`_lastChangedAt`, new GraphQLNonNull(AWSTimestampType))

    return type
}

function createModelConnectionType({ names }: Pick<IModelContext, 'names'>): GraphQLObjectType {
    return new GraphQLObjectType({
        name: names.modelConnection,
        fields: {
            items: { type: new GraphQLList(placeholderObject(names.main)) },
            nextToken: { type: GraphQLString },
            startedAt: { type: AWSTimestampType }
        }
    })
}

function createCreateInputType(context: IModelContext): GraphQLInputObjectType {
    const { names } = context
    const fields: GraphQLInputFieldConfigMap = _createInputFields(
        context,
        {
            factory: _createInputTypePlaceholder
        }
    )

    return new GraphQLInputObjectType({
        name: names.createInput,
        fields: {
            ...fields,
            id: { type: GraphQLID },
            _version: { type: GraphQLInt }
        }
    })
}

function createUpdateInputType(context: IModelContext): GraphQLInputObjectType {
    const { names } = context
    const fields: GraphQLInputFieldConfigMap = _createInputFields(
        context,
        {
            factory: _createInputTypePlaceholder,
            transform: toNullableType
        }
    )

    return new GraphQLInputObjectType({
        name: names.updateInput,
        fields: {
            ...fields,
            id: { type: new GraphQLNonNull(GraphQLID) },
            _version: { type: GraphQLInt }
        }
    })
}

function createDeleteInputType({ names }: Pick<IModelContext, 'names'>): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: names.deleteInput,
        fields: {
            id: { type: GraphQLID },
            _version: { type: GraphQLInt }
        }
    })
}

function createModelFilterInputType(context: IModelContext): GraphQLInputObjectType {
    const fields: GraphQLInputFieldConfigMap = _createInputFields(
        context,
        {
            factory: (_context, field) => getModelInputType(field),
            transform: toNullableType
        }
    )

    const { names } = context
    const result: GraphQLInputObjectType = new GraphQLInputObjectType({
        name: names.modelFilterInput,
        fields: () => {
            const idInputType: GraphQLInputType | undefined = getModelInputType({
                name: `id`,
                description: ``,
                type: GraphQLID,
                args: [],
                extensions: {}
            })
            if (!idInputType) {
                throw new Error(`Could not find model input type for the 'ID' scalar type`)
            }

            return {
                ...fields,
                id: { type: idInputType },
                and: { type: new GraphQLList(result) },
                or: { type: new GraphQLList(result) },
                not: { type: result }
            } as GraphQLInputFieldConfigMap
        }
    })

    return result
}

function createModelConditionInputType(context: IModelContext): GraphQLInputObjectType {
    const { names } = context
    const fields: GraphQLInputFieldConfigMap = _createInputFields(
        context,
        {
            factory: (_context, field) => getModelInputType(field),
            transform: toNullableType
        }
    )

    const result: GraphQLInputObjectType = new GraphQLInputObjectType({
        name: names.modelConditionInput,
        fields: () => ({
            ...fields,
            and: { type: new GraphQLList(result) },
            or: { type: new GraphQLList(result) },
            not: { type: result }
        })
    })

    return result
}

function getMandatoryObjectType(types: ITypeMap, name: string): GraphQLObjectType {
    if (!types[name]) {
        types[name] = new GraphQLObjectType({
            name,
            fields: {}
        })
    }

    const result: GraphQLNamedType | undefined = types[name]
    if (!isObjectType(result)) {
        throw new Error(`type '${name}' is not an object type`)
    }

    return result
}

function createQueryType<TSource, TContext>(
    { types, names }: Pick<IModelContext, 'types' | 'names'>
): GraphQLObjectType {
    const query: GraphQLObjectType = getMandatoryObjectType(types, names.query.name)
    const fields: GraphQLFieldMap<TSource, TContext> = query.getFields()

    function addField(name: string, type: GraphQLOutputType, args: GraphQLArgument[]): void {
        fields[name] = createField(name, type, args)
    }
    
    addField(names.query.get, placeholderObject(names.main), [
        createArgument(`id`, new GraphQLNonNull(GraphQLID))
    ])
    addField(names.query.list, placeholderObject(names.modelConnection), [
        createArgument(`filter`, placeholderInputObject(names.modelFilterInput)),
        createArgument(`limit`, GraphQLInt),
        createArgument(`nextToken`, GraphQLString),
    ])
    addField(names.query.sync, placeholderObject(names.modelConnection), [
        createArgument(`filter`, placeholderInputObject(names.modelFilterInput)),
        createArgument(`limit`, GraphQLInt),
        createArgument(`nextToken`, GraphQLString),
        createArgument(`lastSync`, AWSTimestampType),
    ])

    return query
}

function createMutationType<TSource, TContext>(
    { types, names }: Pick<IModelContext, 'types' | 'names'>
): GraphQLNamedType {
    const mutation: GraphQLObjectType = getMandatoryObjectType(types, names.mutation.name)
    const fields: GraphQLFieldMap<TSource, TContext> = mutation.getFields()
    function addField(name: string, type: GraphQLOutputType, args: GraphQLArgument[]): void {
        fields[name] = createField(name, type, args)
    }

    addField(names.mutation.create, placeholderObject(names.main), [
        createArgument(`input`, new GraphQLNonNull(placeholderInputObject(names.createInput))),
        createArgument(`condition`, placeholderInputObject(names.modelConditionInput))
    ])
    addField(names.mutation.update, placeholderObject(names.main), [
        createArgument(`input`, new GraphQLNonNull(placeholderInputObject(names.updateInput))),
        createArgument(`condition`, placeholderInputObject(names.modelConditionInput))
    ])
    addField(names.mutation.delete, placeholderObject(names.main), [
        createArgument(`input`, new GraphQLNonNull(placeholderInputObject(names.deleteInput))),
        createArgument(`condition`, placeholderInputObject(names.modelConditionInput))
    ])

    return mutation
}

function createSubscriptionType<TSource, TContext>(
    { types, names }: Pick<IModelContext, 'types' | 'names'>,
    context: Pick<IAppSyncContext<TSource, TContext>, 'subscriptionMap'>
): GraphQLNamedType {
    const subscription: GraphQLObjectType = getMandatoryObjectType(types, names.subscription.name)
    const fields: GraphQLFieldMap<TSource, TContext> = subscription.getFields()

    function addField(name: string, type: GraphQLOutputType, mutationName: string): void {
        fields[name] = createField(name, type, [])

        const subscriptions: string[] = context.subscriptionMap[name] = context.subscriptionMap[name] ?? []

        subscriptions.push(mutationName)
    }

    addField(names.subscription.onCreate, placeholderObject(names.main), names.mutation.create)
    addField(names.subscription.onUpdate, placeholderObject(names.main), names.mutation.update)
    addField(names.subscription.onDelete, placeholderObject(names.main), names.mutation.delete)

    return subscription
}

/**
 * @param context - The shared context used by instances of this visitor.
 * @internal
 */
export function addModelInputTypes(context: IModelContext): void {
    const { types, missingTypes } = context

    addType(context, { type: createCreateInputType(context) })
    addType(context, { type: createUpdateInputType(context) })
    addType(context, { type: createModelFilterInputType(context) })
    addType(context, { type: createModelConditionInputType(context) })

    for (const missingTypeName of missingTypes) {
        const type: GraphQLNamedType | undefined = types[missingTypeName]
        if (isObjectType(type)) {
            addType(context, { type: _createInputType(context, type) })
        } else {
            throw new Error(`expected object type, but ${missingTypeName} is not an object type`)
        }
    }
}

/**
 * @internal
 */
export class ModelDirective<TSource, TContext> extends SchemaDirectiveVisitor {
    public visitObject(_object: GraphQLObjectType): GraphQLObjectType {
        if (!isObjectType(this.visitedType)) {
            throw new Error(`model type must be an object type`)
        }

        const type: GraphQLObjectType = this.visitedType
        const names: IModelNames = getModelNames(type.name)
        const modelContext: IModelContext = {
            missingTypes: new Set(),
            types: this.schema.getTypeMap(),
            type,
            names,
        }
        const context: IAppSyncContext<TSource, TContext> = this.context as IAppSyncContext<TSource, TContext>
        context.models.push({
            context: modelContext,
            names,
        })

        // Common types
        addType(modelContext, { type: createSortDirectionType() })
        addType(modelContext, { type: createAttributeTypesType() })
        addType(modelContext, { type: createSizeInputType() })
        addType(modelContext, { type: createStringInputType() })
        addType(modelContext, { type: createIdInputType() })
        addType(modelContext, { type: createIntInputType() })
        addType(modelContext, { type: createFloatInputType() })
        addType(modelContext, { type: createBooleanInputType() })

        // Model types
        const result: GraphQLObjectType = addType(modelContext, { type: createMainType(modelContext), overwrite: true }) as GraphQLObjectType
        addType(modelContext, { type: createModelConnectionType(modelContext) })
        addType(modelContext, { type: createDeleteInputType(modelContext) })
        addType(modelContext, { type: createQueryType(modelContext), overwrite: true })
        addType(modelContext, { type: createMutationType(modelContext), overwrite: true })
        addType(modelContext, { type: createSubscriptionType(modelContext, context), overwrite: true })

        return result
    }
}
