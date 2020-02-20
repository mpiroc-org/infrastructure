/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-non-null-assertion */


import {
    parse,
    GraphQLSchema,
    GraphQLNamedType,
} from 'graphql'
import { expectType, CollectionMismatchError } from '../test-utils/types'
import { transformSchema } from '../../lib/transform'
import * as example from '../test-utils/example-schema'
import { intersection, union } from '@mpiroc-org/iterable'
import { buildSchema } from '../../lib/transform/util'

describe(`resolveSchema`, () => {
describe(`example schema`, () => {
    const source: string = transformSchema(example.input).source
    const actualSchema: GraphQLSchema = buildSchema(parse(source))
    const expectedSchema: GraphQLSchema = buildSchema(example.output)

    it(`has all expected types and no unexpected types`, () => {
        const actualNames: Set<string> = new Set(Object.keys(actualSchema.getTypeMap()))
        const expectedNames: Set<string> = new Set(Object.keys(expectedSchema.getTypeMap()))

        try {
            expect(intersection(actualNames, expectedNames).size).toEqual(union(actualNames, expectedNames).size)
        } catch(err) {
            throw new CollectionMismatchError(err, actualNames, expectedNames)
        }
    })

    for (const key of Object.keys(expectedSchema.getTypeMap())) {
        it(`has expected type ${key}`, () => {
            const actualType: GraphQLNamedType | undefined | null = actualSchema.getType(key)
            const expectedType: GraphQLNamedType | undefined | null = expectedSchema.getType(key)

            if (!actualType) {
                fail(`actual schema did not contain type ${key}`)
            }

            if (!expectedType) {
                fail(`expected schema did not contain type ${key}`)
            }

            expectType(actualType, expectedType)
        })
    }
})
})

/* eslint-enable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-non-null-assertion */