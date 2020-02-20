import {
    GraphQLNamedType,
} from 'graphql'

import {
    IMappingTemplatePair,
} from './transform/interfaces'
import { toCamelCase, pluralize } from './transform/util'

interface IMappingTemplates {
    query: IQueryMappingTemplates
    mutation: IMutationMappingTemplates
}

interface IQueryMappingTemplates {
    get: IMappingTemplatePair
    list: IMappingTemplatePair
    sync: IMappingTemplatePair
}

interface IMutationMappingTemplates {
    create: IMappingTemplatePair
    update: IMappingTemplatePair
    delete: IMappingTemplatePair
}

const defaultResponseTemplate: string = `
#if( $ctx.error )
$util.error($ctx.error.message, $ctx.error.type, $ctx.result)
#else
$util.toJson($ctx.result)
#end
`.trim()

/**
 * @param ownerType - The type to which this field belongs.
 * @param underlyingFieldType - The return type of this field.
 * @internal
 */
export function getConnectionListTemplates(
    ownerType: GraphQLNamedType,
    underlyingFieldType: GraphQLNamedType,
): IMappingTemplatePair {
    return {
        request: `
#set( $limit = $util.defaultIfNull($context.args.limit, 10) )
#set( $query = {
  "expression": "#connectionAttribute = :connectionAttribute",
  "expressionNames": {
      "#connectionAttribute": "${toCamelCase(underlyingFieldType.name)}${ownerType.name}Id"
  },
  "expressionValues": {
      ":connectionAttribute": {
          "S": "$context.source.id"
    }
  }
} )
{
  "version": "2017-02-28",
  "operation": "Query",
  "query":   $util.toJson($query),
  "scanIndexForward":   #if( $context.args.sortDirection )
    #if( $context.args.sortDirection == "ASC" )
true
    #else
false
    #end
  #else
true
  #end,
  "filter":   #if( $context.args.filter )
$util.transform.toDynamoDBFilterExpression($ctx.args.filter)
  #else
null
  #end,
  "limit": $limit,
  "nextToken":   #if( $context.args.nextToken )
"$context.args.nextToken"
  #else
null
  #end,
  "index": "gsi-${ownerType.name}${pluralize(underlyingFieldType.name)}"
}
        `.trim(),
    
        response: `
#if( !$result )
  #set( $result = $ctx.result )
#end
$util.toJson($result)
        `.trim()
    }
}

/**
 * @param ownerType - The type to which this field belongs.
 * @param underlyingFieldType - The return type of this field.
 * @internal
 */
export function getConnectionItemTemplates(
    ownerType: GraphQLNamedType,
    underlyingFieldType: GraphQLNamedType,
): IMappingTemplatePair {
    return {
        request: `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
      "id": $util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${toCamelCase(ownerType.name)}${underlyingFieldType.name}Id, "___xamznone____"))
  }
}
        `.trim(),

        response: `
$util.toJson($context.result)
        `.trim()
    }
}

/**
 * @internal
 */
export class MappingTemplates implements IMappingTemplates {
    public readonly query: IQueryMappingTemplates
    public readonly mutation: IMutationMappingTemplates

    public constructor(typeName: string) {
        this.query = {
            get: {
                request: `
{
    "version": "2018-05-29",
    "operation": "GetItem",
    "key": #if( $modelObjectKey ) $util.toJson($modelObjectKey) #else {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
    } #end
}
                `.trim(),
                response: defaultResponseTemplate
            },
            list: {
                request: `
#set( $limit = $util.defaultIfNull($context.args.limit, 10) )
#set( $ListRequest = {
    "version": "2018-05-29",
    "limit": $limit
} )
#if( $context.args.nextToken )
    #set( $ListRequest.nextToken = "$context.args.nextToken" )
#end
#if( $context.args.filter )
    #set( $ListRequest.filter = $util.parseJson("$util.transform.toDynamoDBFilterExpression($ctx.args.filter)") )
#end
#if( !$util.isNull($modelQueryExpression)
                        && !$util.isNullOrEmpty($modelQueryExpression.expression) )
    $util.qr($ListRequest.put("operation", "Query"))
    $util.qr($ListRequest.put("query", $modelQueryExpression))
    #if( !$util.isNull($ctx.args.sortDirection) && $ctx.args.sortDirection == "DESC" )
    #set( $ListRequest.scanIndexForward = false )
    #else
    #set( $ListRequest.scanIndexForward = true )
    #end
#else
    $util.qr($ListRequest.put("operation", "Scan"))
#end
$util.toJson($ListRequest)
                `.trim(),
                response: defaultResponseTemplate
            },
            sync: {
                request: `
{
    "version": "2018-05-29",
    "operation": "Sync",
    "limit": $util.defaultIfNull($ctx.args.limit, 100),
    "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
    "lastSync": $util.toJson($util.defaultIfNull($ctx.args.lastSync, null)),
    "filter":   #if( $context.args.filter )
$util.transform.toDynamoDBFilterExpression($ctx.args.filter)
    #else
null
    #end
}
                `.trim(),
                response: defaultResponseTemplate
            }
        }

        this.mutation = {
            create: {
                request: `
## [Start] Prepare DynamoDB PutItem Request. **
$util.qr($context.args.input.put("createdAt", $util.defaultIfNull($ctx.args.input.createdAt, $util.time.nowISO8601())))
$util.qr($context.args.input.put("updatedAt", $util.defaultIfNull($ctx.args.input.updatedAt, $util.time.nowISO8601())))
$util.qr($context.args.input.put("__typename", "Blog"))
#set( $condition = {
  "expression": "attribute_not_exists(#id)",
  "expressionNames": {
      "#id": "id"
  }
} )
#if( $context.args.condition )
  #set( $condition.expressionValues = {} )
  #set( $conditionFilterExpressions = $util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition)) )
  $util.qr($condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression"))
  $util.qr($condition.expressionNames.putAll($conditionFilterExpressions.expressionNames))
  $util.qr($condition.expressionValues.putAll($conditionFilterExpressions.expressionValues))
#end
#if( $condition.expressionValues && $condition.expressionValues.size() == 0 )
  #set( $condition = {
  "expression": $condition.expression,
  "expressionNames": $condition.expressionNames
} )
#end
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": #if( $modelObjectKey ) $util.toJson($modelObjectKey) #else {
  "id":   $util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.args.input.id, $util.autoId()))
} #end,
  "attributeValues": $util.dynamodb.toMapValuesJson($context.args.input),
  "condition": $util.toJson($condition)
}
## [End] Prepare DynamoDB PutItem Request. **
                `.trim(),
                response: defaultResponseTemplate
            },
            update: {
                request: `
#if( $authCondition && $authCondition.expression != "" )
  #set( $condition = $authCondition )
  #if( $modelObjectKey )
    #foreach( $entry in $modelObjectKey.entrySet() )
      $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)"))
      $util.qr($condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key"))
    #end
  #else
    $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#id)"))
    $util.qr($condition.expressionNames.put("#id", "id"))
  #end
#else
  #if( $modelObjectKey )
    #set( $condition = {
  "expression": "",
  "expressionNames": {},
  "expressionValues": {}
} )
    #foreach( $entry in $modelObjectKey.entrySet() )
      #if( $velocityCount == 1 )
        $util.qr($condition.put("expression", "attribute_exists(#keyCondition$velocityCount)"))
      #else
        $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)"))
      #end
      $util.qr($condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key"))
    #end
  #else
    #set( $condition = {
  "expression": "attribute_exists(#id)",
  "expressionNames": {
      "#id": "id"
  },
  "expressionValues": {}
} )
  #end
#end
## Automatically set the updatedAt timestamp. **
$util.qr($context.args.input.put("updatedAt", $util.defaultIfNull($ctx.args.input.updatedAt, $util.time.nowISO8601())))
$util.qr($context.args.input.put("__typename", "${typeName}"))
## Update condition if type is @versioned **
#if( $versionedCondition )
  $util.qr($condition.put("expression", "($condition.expression) AND $versionedCondition.expression"))
  $util.qr($condition.expressionNames.putAll($versionedCondition.expressionNames))
  $util.qr($condition.expressionValues.putAll($versionedCondition.expressionValues))
#end
#if( $context.args.condition )
  #set( $conditionFilterExpressions = $util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition)) )
  $util.qr($condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression"))
  $util.qr($condition.expressionNames.putAll($conditionFilterExpressions.expressionNames))
  $util.qr($condition.expressionValues.putAll($conditionFilterExpressions.expressionValues))
#end
#if( $condition.expressionValues && $condition.expressionValues.size() == 0 )
  #set( $condition = {
  "expression": $condition.expression,
  "expressionNames": $condition.expressionNames
} )
#end
#set( $expNames = {} )
#set( $expValues = {} )
#set( $expSet = {} )
#set( $expAdd = {} )
#set( $expRemove = [] )
#if( $modelObjectKey )
  #set( $keyFields = [] )
  #foreach( $entry in $modelObjectKey.entrySet() )
    $util.qr($keyFields.add("$entry.key"))
  #end
#else
  #set( $keyFields = ["id", "_version", "_deleted", "_lastChangedAt"] )
#end
#foreach( $entry in $util.map.copyAndRemoveAllKeys($context.args.input, $keyFields).entrySet() )
  #if( !$util.isNull($dynamodbNameOverrideMap) && $dynamodbNameOverrideMap.containsKey("$entry.key") )
    #set( $entryKeyAttributeName = $dynamodbNameOverrideMap.get("$entry.key") )
  #else
    #set( $entryKeyAttributeName = $entry.key )
  #end
  #if( $util.isNull($entry.value) )
    #set( $discard = $expRemove.add("#$entryKeyAttributeName") )
    $util.qr($expNames.put("#$entryKeyAttributeName", "$entry.key"))
  #else
    $util.qr($expSet.put("#$entryKeyAttributeName", ":$entryKeyAttributeName"))
    $util.qr($expNames.put("#$entryKeyAttributeName", "$entry.key"))
    $util.qr($expValues.put(":$entryKeyAttributeName", $util.dynamodb.toDynamoDB($entry.value)))
  #end
#end
#set( $expression = "" )
#if( !$expSet.isEmpty() )
  #set( $expression = "SET" )
  #foreach( $entry in $expSet.entrySet() )
    #set( $expression = "$expression $entry.key = $entry.value" )
    #if( $foreach.hasNext() )
      #set( $expression = "$expression," )
    #end
  #end
#end
#if( !$expAdd.isEmpty() )
  #set( $expression = "$expression ADD" )
  #foreach( $entry in $expAdd.entrySet() )
    #set( $expression = "$expression $entry.key $entry.value" )
    #if( $foreach.hasNext() )
      #set( $expression = "$expression," )
    #end
  #end
#end
#if( !$expRemove.isEmpty() )
  #set( $expression = "$expression REMOVE" )
  #foreach( $entry in $expRemove )
    #set( $expression = "$expression $entry" )
    #if( $foreach.hasNext() )
      #set( $expression = "$expression," )
    #end
  #end
#end
#set( $update = {} )
$util.qr($update.put("expression", "$expression"))
#if( !$expNames.isEmpty() )
  $util.qr($update.put("expressionNames", $expNames))
#end
#if( !$expValues.isEmpty() )
  $util.qr($update.put("expressionValues", $expValues))
#end
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": #if( $modelObjectKey ) $util.toJson($modelObjectKey) #else {
  "id": {
      "S": "$context.args.input.id"
  }
} #end,
  "update": $util.toJson($update),
  "condition": $util.toJson($condition),
  "_version": $util.defaultIfNull($ctx.args.input["_version"], "0")
}
                `.trim(),
                response: defaultResponseTemplate
            },
            delete: {
                request: `
#if( $authCondition )
  #set( $condition = $authCondition )
  #if( $modelObjectKey )
    #foreach( $entry in $modelObjectKey.entrySet() )
      $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)"))
      $util.qr($condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key"))
    #end
  #else
    $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#id)"))
    $util.qr($condition.expressionNames.put("#id", "id"))
  #end
#else
  #if( $modelObjectKey )
    #set( $condition = {
  "expression": "",
  "expressionNames": {}
} )
    #foreach( $entry in $modelObjectKey.entrySet() )
      #if( $velocityCount == 1 )
        $util.qr($condition.put("expression", "attribute_exists(#keyCondition$velocityCount)"))
      #else
        $util.qr($condition.put("expression", "$condition.expression AND attribute_exists(#keyCondition$velocityCount)"))
      #end
      $util.qr($condition.expressionNames.put("#keyCondition$velocityCount", "$entry.key"))
    #end
  #else
    #set( $condition = {
  "expression": "attribute_exists(#id)",
  "expressionNames": {
      "#id": "id"
  }
} )
  #end
#end
#if( $versionedCondition )
  $util.qr($condition.put("expression", "($condition.expression) AND $versionedCondition.expression"))
  $util.qr($condition.expressionNames.putAll($versionedCondition.expressionNames))
  #set( $expressionValues = $util.defaultIfNull($condition.expressionValues, {}) )
  $util.qr($expressionValues.putAll($versionedCondition.expressionValues))
  #set( $condition.expressionValues = $expressionValues )
#end
#if( $context.args.condition )
  #set( $conditionFilterExpressions = $util.parseJson($util.transform.toDynamoDBConditionExpression($context.args.condition)) )
  $util.qr($condition.put("expression", "($condition.expression) AND $conditionFilterExpressions.expression"))
  $util.qr($condition.expressionNames.putAll($conditionFilterExpressions.expressionNames))
  #set( $conditionExpressionValues = $util.defaultIfNull($condition.expressionValues, {}) )
  $util.qr($conditionExpressionValues.putAll($conditionFilterExpressions.expressionValues))
  #set( $condition.expressionValues = $conditionExpressionValues )
  $util.qr($condition.expressionValues.putAll($conditionFilterExpressions.expressionValues))
#end
#if( $condition.expressionValues && $condition.expressionValues.size() == 0 )
  #set( $condition = {
  "expression": $condition.expression,
  "expressionNames": $condition.expressionNames
} )
#end
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": #if( $modelObjectKey ) $util.toJson($modelObjectKey) #else {
  "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
} #end,
  "condition": $util.toJson($condition),
  "_version": $util.defaultIfNull($ctx.args.input["_version"], "0")
}
                `.trim(),
                response: defaultResponseTemplate
            }
        }

    }
}
