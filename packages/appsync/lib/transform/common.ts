import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLFloat,
    GraphQLID,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLList,
    GraphQLString
} from 'graphql'
import { commonNames } from './names'
import { placeholderInputObject } from './util'

/**
 * @internal
 */
export function createSortDirectionType(): GraphQLEnumType {
    return new GraphQLEnumType({
        name: commonNames.sortDirection,
        values: {
            ASC: {},
            DESC: {}
        }
    })
}

/**
 * @internal
 */
export function createAttributeTypesType(): GraphQLEnumType {
    return new GraphQLEnumType({
        name: commonNames.attributeTypes,
        values: {
            binary: {},
            binarySet: {},
            bool: {},
            list: {},
            map: {},
            number: {},
            numberSet: {},
            string: {},
            stringSet: {},
            _null: {}
        }
    })
}

/**
 * @internal
 */
export function createSizeInputType(): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: commonNames.sizeInput,
        fields: {
            ne: { type: GraphQLInt },
            eq: { type: GraphQLInt },
            le: { type: GraphQLInt },
            lt: { type: GraphQLInt },
            ge: { type: GraphQLInt },
            gt: { type: GraphQLInt },
            between: { type: new GraphQLList(GraphQLInt) },
        }
    })
}

/**
 * @internal
 */
export function createStringInputType(): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: commonNames.stringInput,
        fields: {
            ne: { type: GraphQLString },
            eq: { type: GraphQLString },
            le: { type: GraphQLString },
            lt: { type: GraphQLString },
            ge: { type: GraphQLString },
            gt: { type: GraphQLString },
            contains: { type: GraphQLString },
            notContains: { type: GraphQLString },
            between: { type: new GraphQLList(GraphQLString) },
            beginsWith: { type: GraphQLString },
            attributeExists: { type: GraphQLBoolean },
            attributeType: { type: placeholderInputObject(commonNames.attributeTypes) },
            size: { type: placeholderInputObject(commonNames.sizeInput) }
        }
    })
}

/**
 * @internal
 */
export function createIdInputType(): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: commonNames.idInput,
        fields: {
            ne: { type: GraphQLID },
            eq: { type: GraphQLID },
            le: { type: GraphQLID },
            lt: { type: GraphQLID },
            ge: { type: GraphQLID },
            gt: { type: GraphQLID },
            contains: { type: GraphQLID },
            notContains: { type: GraphQLID },
            between: { type: new GraphQLList(GraphQLID) },
            beginsWith: { type: GraphQLID },
            attributeExists: { type: GraphQLBoolean },
            attributeType: { type: placeholderInputObject(commonNames.attributeTypes) },
            size: { type: placeholderInputObject(commonNames.sizeInput) }
        }
    })
}

/**
 * @internal
 */
export function createIntInputType(): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: commonNames.intInput,
        fields: {
            ne: { type: GraphQLInt },
            eq: { type: GraphQLInt },
            le: { type: GraphQLInt },
            lt: { type: GraphQLInt },
            ge: { type: GraphQLInt },
            gt: { type: GraphQLInt },
            between: { type: new GraphQLList(GraphQLInt) },
            attributeExists: { type: GraphQLBoolean },
            attributeType: { type: placeholderInputObject(commonNames.attributeTypes) }
        }
    })
}

/**
 * @internal
 */
export function createFloatInputType(): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: commonNames.floatInput,
        fields: {
            ne: { type: GraphQLFloat },
            eq: { type: GraphQLFloat },
            le: { type: GraphQLFloat },
            lt: { type: GraphQLFloat },
            ge: { type: GraphQLFloat },
            gt: { type: GraphQLFloat },
            between: { type: new GraphQLList(GraphQLFloat) },
            attributeExists: { type: GraphQLBoolean },
            attributeType: { type: placeholderInputObject(commonNames.attributeTypes) }
        }
    })
}

/**
 * @internal
 */
export function createBooleanInputType(): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: commonNames.booleanInput,
        fields: {
            ne: { type: GraphQLBoolean },
            eq: { type: GraphQLBoolean },
            attributeExists: { type: GraphQLBoolean },
            attributeType: { type: placeholderInputObject(commonNames.attributeTypes) }
        }
    })
}
