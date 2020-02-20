import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'

/**
 * @internal
 */
export const connection: DocumentNode = gql`
directive @connection(name: String, fields: [String!]) on FIELD_DEFINITION
`

/**
 * @internal
 */
export const model: DocumentNode = gql`
directive @model(
    queries: ModelQueryMap,
    mutations: ModelMutationMap,
    subscriptions: ModelSubscriptionMap
) on OBJECT
input ModelMutationMap { create: String, update: String, delete: String }
input ModelQueryMap { get: String, list: String }
input ModelSubscriptionMap {
    onCreate: [String]
    onUpdate: [String]
    onDelete: [String]
    level: ModelSubscriptionLevel
}
enum ModelSubscriptionLevel { off public on }
`

/**
 * @internal
 */
export const amplifyDefinitions: DocumentNode[] = [
    connection,
    model,
]

/**
 * @internal
 */
export const awsSubscribe: DocumentNode = gql`
directive @aws_subscribe(mutations: [String!]) on FIELD_DEFINITION
`

/**
 * @internal
 */
export const appsyncDefinitions: DocumentNode[] = [
    awsSubscribe,
]