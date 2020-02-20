import {
    // Named Types
    GraphQLType,
    GraphQLNamedType,
    GraphQLWrappingType,
    GraphQLNullableType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLScalarType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    GraphQLEnumType,
    GraphQLInputObjectType,

    // Other Types
    GraphQLField,
    GraphQLFieldMap,
    GraphQLInputField,
    GraphQLInputFieldMap,
    GraphQLArgument,
    GraphQLEnumValue,
    
    // Type Predicate
    isListType,
    isNonNullType,
    isScalarType,
    isObjectType,
    isInterfaceType,
    isUnionType,
    isEnumType,
    isInputObjectType,
} from 'graphql'
import { difference } from '@mpiroc-org/iterable'

function formatMismatchError<TItem>(actual: Iterable<TItem>, expected: Iterable<TItem>): string {
    const actualSet: Set<TItem> = new Set(actual)
    const expectedSet: Set<TItem> = new Set(expected)
    const notFound: Set<TItem> = difference(expectedSet, actualSet)
    const notExpected: Set<TItem> = difference(actualSet, expectedSet)

    function formatSet<TItem>(set: Set<TItem>): string {
        return `[ ${Array.from(set).join(`, `)} ]`
    }

    return `Expected, but not found: ${formatSet(notFound)}\nFound, but not expected: ${formatSet(notExpected)}`
}

export class CollectionMismatchError extends Error {
    public constructor(inner: Error, actual: Iterable<string>, expected: Iterable<string>) {
        super(`${formatMismatchError(actual, expected)}\nMismatch Inner Stack:\n${inner.stack}`)
    }
}

function formatKindMismatchMessage(
    actual: GraphQLType,
    expected: GraphQLType,
    kind: string,
): string {
    return `Expected ${kind} type ${expected}, but received non-${kind} type ${actual}`
}

function breadcrumb(breadcrumbs: string[], name: string, action: () => unknown): void {
    breadcrumbs.push(name)
    action()
    const poppedName: string | undefined = breadcrumbs.pop()

    if (poppedName !== name) {
        throw new Error(`Breadcrumb mismatch: Expected to pop ${name}, but instead popped ${poppedName}`)
    }
}

function expectBoolean(
    actual: boolean | undefined,
    expected: boolean | undefined,
): void {
    expect(actual).toStrictEqual(expected)
}

function expectString(
    actual: string | null | undefined,
    expected: string | null | undefined,
): void {
    expect(actual ?? ``).toStrictEqual(expected ?? ``)
}

function expectNameAndDescription(
    actual: IHasNameAndDescription,
    expected: IHasNameAndDescription
): void {
    expectString(actual.name, expected.name)
    expectString(actual.description, expected.description)
}

function expectTypeCore(actual: GraphQLType, expected: GraphQLType, seen: Set<string>, breadcrumbs: string[]): void {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    if (isScalarType(expected)) {
        expectScalar(actual, expected, seen, breadcrumbs)
        return
    }

    if (isObjectType(expected)) {
        expectObject(actual, expected, seen, breadcrumbs)
        return
    }

    if (isInterfaceType(expected)) {
        expectInterface(actual, expected, seen, breadcrumbs)
        return
    }

    if (isUnionType(expected)) {
        expectUnion(actual, expected, seen, breadcrumbs)
        return
    }

    if (isEnumType(expected)) {
        expectEnum(actual, expected, seen, breadcrumbs)
        return
    }

    if (isListType(expected)) {
        expectList(actual, expected, seen, breadcrumbs)
        return
    }

    if (isNonNullType(expected)) {
        expectNonNull(actual, expected, seen, breadcrumbs)
        return
    }

    if (isInputObjectType(expected)) {
        expectInputObject(actual, expected, seen, breadcrumbs)
        return
    }
    /* eslint-enable @typescript-eslint/no-use-before-define */

    throw new Error(`Type ${expected} is an unknown kind of type`)
}

function expectArgument(
    actual: GraphQLArgument,
    expected: GraphQLArgument,
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    breadcrumb(breadcrumbs, `argument ${actual.name}`, () => {
        expectNameAndDescription(actual, expected)
        expectTypeCore(actual.type, expected.type, seen, breadcrumbs)
        expect(actual.defaultValue).toStrictEqual(expected.defaultValue)
    })
}

function expectArguments(
    actual: GraphQLArgument[],
    expected: GraphQLArgument[],
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    expect(actual.length).toStrictEqual(expected.length)

    expected.forEach(
        (current: GraphQLArgument, index: number) => expectArgument(actual[index], current, seen, breadcrumbs)
    )
}

function expectField<TSource, TContext>(
    actual: GraphQLField<TSource, TContext>,
    expected: GraphQLField<TSource, TContext>,
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    breadcrumb(breadcrumbs, `field ${actual.name}`, () => {
        expectNameAndDescription(actual, expected)
        expectArguments(actual.args, expected.args, seen, breadcrumbs)
        expectTypeCore(actual.type, expected.type, seen, breadcrumbs)
    })
}

function expectFields<TSource, TContext>(
    actual: GraphQLFieldMap<TSource, TContext>,
    expected: GraphQLFieldMap<TSource, TContext>,
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    expect(Object.keys(actual).length).toStrictEqual(Object.keys(expected).length)

    Object.keys(expected).forEach(
        (key: string) => expectField(actual[key], expected[key], seen, breadcrumbs)
    )
}

function expectNamedTypeDetails(
    actual: GraphQLNamedType,
    expected: GraphQLNamedType,
): void {
    expectNameAndDescription(actual, expected)
}

function expectScalar(actual: GraphQLType, expected: GraphQLScalarType, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isScalarType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `scalar`))
    }

    if (!seen.has(actual.name)) {
        seen.add(actual.name)
        breadcrumb(breadcrumbs, `scalar ${actual.name}`, () => {
            expectNamedTypeDetails(actual, expected)
        })
    }
}

function expectInterface(actual: GraphQLType, expected: GraphQLInterfaceType, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isInterfaceType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `interface`))
    }

    if (!seen.has(actual.name)) {
        seen.add(actual.name)
        breadcrumb(breadcrumbs, `interface ${actual.name}`, () => {
            expectNamedTypeDetails(actual, expected)
            expectFields(actual.getFields(), expected.getFields(), seen, breadcrumbs)
        })
    }
}

function expectInterfaces(
    actual: GraphQLInterfaceType[],
    expected: GraphQLInterfaceType[],
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    expect(actual.length).toStrictEqual(expected.length)

    expected.forEach(
        (current: GraphQLInterfaceType, index: number) => expectInterface(actual[index], current, seen, breadcrumbs)
    )
}

function expectObject(actual: GraphQLType, expected: GraphQLObjectType, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isObjectType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `object`))
    }

    if (!seen.has(actual.name)) {
        seen.add(actual.name)
        breadcrumb(breadcrumbs, `object ${actual.name}`, () => {
            expectNamedTypeDetails(actual, expected)
            expectInterfaces(actual.getInterfaces(), expected.getInterfaces(), seen, breadcrumbs)
            expectFields(actual.getFields(), expected.getFields(), seen, breadcrumbs)
        })
    }
}

function expectTypes(
    actual: GraphQLType[],
    expected: GraphQLType[],
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    expect(actual.length).toStrictEqual(expected.length)

    expected.forEach(
        (current, index) => expectTypeCore(actual[index], current, seen, breadcrumbs)
    )
}

function expectUnion(actual: GraphQLType, expected: GraphQLUnionType, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isUnionType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `union`))
    }

    if (!seen.has(actual.name)) {
        seen.add(actual.name)
        breadcrumb(breadcrumbs, `union ${actual.name}`, () => {
            expectNamedTypeDetails(actual, expected)
            expectTypes(actual.getTypes(), expected.getTypes(), seen, breadcrumbs)
        })
    }
}

function expectEnumValue(
    actual: GraphQLEnumValue,
    expected: GraphQLEnumValue,
): void {
    expectNameAndDescription(actual, expected)
    expect(actual.value).toStrictEqual(expected.value)
    expectBoolean(actual.isDeprecated, expected.isDeprecated)
    expectString(actual.deprecationReason, expected.deprecationReason)
}

function expectEnumValues(
    actual: GraphQLEnumValue[],
    expected: GraphQLEnumValue[],
): void {
    expect(actual.length).toStrictEqual(expected.length)

    expected.forEach(
        (current: GraphQLEnumValue, index: number) => expectEnumValue(actual[index], current)
    )
}

function expectEnum(actual: GraphQLType, expected: GraphQLEnumType, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isEnumType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `enum`))
    }

    if (!seen.has(actual.name)) {
        seen.add(actual.name)
        breadcrumb(breadcrumbs, `enum ${actual.name}`, () => {
            expectNamedTypeDetails(actual, expected)
            expectEnumValues(actual.getValues(), expected.getValues())
        })
    }
}

function expectInputField(
    actual: GraphQLInputField,
    expected: GraphQLInputField,
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    breadcrumb(breadcrumbs, `input field ${actual.name}`, () => {
        expectNameAndDescription(actual, expected)
        expectTypeCore(actual.type, expected.type, seen, breadcrumbs)
        expect(actual.defaultValue).toStrictEqual(expected.defaultValue)
    })
}

function expectInputFields(
    actual: GraphQLInputFieldMap,
    expected: GraphQLInputFieldMap,
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    try {
        expect(Object.keys(actual).length).toStrictEqual(Object.keys(expected).length)

        Object.keys(expected).forEach(
            key => expectInputField(actual[key], expected[key], seen, breadcrumbs)
        )
    } catch (err) {
        throw new CollectionMismatchError(err, Object.keys(actual), Object.keys(expected))
    }
}

function expectInputObject(actual: GraphQLType, expected: GraphQLInputObjectType, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isInputObjectType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `input object`))
    }

    if (!seen.has(actual.name)) {
        seen.add(actual.name)
        breadcrumb(breadcrumbs, `input object ${actual.name}`, () => {
            expectNamedTypeDetails(actual, expected)
            const actualFields: GraphQLInputFieldMap = actual.getFields()
            const expectedFields: GraphQLInputFieldMap = expected.getFields()

            expectInputFields(actualFields, expectedFields, seen, breadcrumbs)
        })
    }
}

function expectWrappingTypeDetails(
    actual: GraphQLWrappingType,
    expected: GraphQLWrappingType,
    seen: Set<string>,
    breadcrumbs: string[],
): void {
    expectTypeCore(actual.ofType, expected.ofType, seen, breadcrumbs)
}

function expectList<TItem extends GraphQLType>(actual: GraphQLType, expected: GraphQLList<TItem>, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isListType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `list`))
    }

    breadcrumb(breadcrumbs, `list`, () => {
        expectWrappingTypeDetails(actual, expected, seen, breadcrumbs)
    })
 }

function expectNonNull<TItem extends GraphQLNullableType>(actual: GraphQLType, expected: GraphQLNonNull<TItem>, seen: Set<string>, breadcrumbs: string[]): void {
    if (!isNonNullType(actual)) {
        fail(formatKindMismatchMessage(actual, expected, `non-null`))
    }

    breadcrumb(breadcrumbs, `non-null`, () => {
        expectWrappingTypeDetails(actual, expected, seen, breadcrumbs)
    })
}

interface IHasNameAndDescription {
    name: string
    description?: string | null
}

export class BreadcrumbError extends Error {
    public constructor(inner: Error, breadcrumbs: string[]) {
        super(`${breadcrumbs.join(` > `)}\nBreadcrumb Inner Stack:\n${inner.stack}`)
    }
}

export function expectType(actual: GraphQLType, expected: GraphQLType): void {
    const breadcrumbs: string[] = []
    try {
        expectTypeCore(actual, expected, new Set(), breadcrumbs)
    } catch (err) {
        throw new BreadcrumbError(err, breadcrumbs)
    }
}
