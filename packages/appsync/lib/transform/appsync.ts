import {
    ASTNode,
    visit,
    FieldDefinitionNode,
    GraphQLSchema,
    printSchema,
    parse,
    DocumentNode,
    ObjectTypeDefinitionNode,
} from 'graphql'
import * as ast from './kinds'

function addSubscribeDirective(node: FieldDefinitionNode, mutations: string[]): FieldDefinitionNode {
    return ast.FieldDefinition({
        ...node,
        directives: (node.directives ?? []).concat(ast.Directive({
            name: ast.Name({ value: `aws_subscribe` }),
            arguments: [
                ast.Argument({
                    name: ast.Name({ value: `mutations` }),
                    value: ast.ListValue({
                        values: mutations.map(mutation => ast.StringValue({ value: mutation }))
                    })
                })
            ]
        }))
    })
}

/**
 * @param schema - The schema to which to add the directives.
 * @param subscriptionMap - A list of the mutations for each model type.
 * @internal
 */
export function addSubscribeDirectives(
    schema: GraphQLSchema,
    subscriptionMap: { [subscriptionName: string]: string[] | undefined },
): ASTNode {
    const root: DocumentNode =  parse(printSchema(schema))

    return visit(root, {
        ObjectTypeDefinition(objectNode: ObjectTypeDefinitionNode) {
            if (objectNode.name.value !== `Subscription`) {
                return undefined
            }
            
            return visit(objectNode, {
                FieldDefinition(fieldNode: FieldDefinitionNode) {
                    const mutations: string[] | undefined = subscriptionMap[fieldNode.name.value]
                    if (!mutations) {
                        return undefined
                    }

                    return addSubscribeDirective(fieldNode, mutations)
                }
            })
        }
    })
}


