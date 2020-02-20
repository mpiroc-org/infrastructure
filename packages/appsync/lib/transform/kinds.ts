import {
    // Node group types
    ASTNode,

    // Concrete node types
    NameNode,
    DocumentNode,
    OperationDefinitionNode,
    VariableDefinitionNode,
    VariableNode,
    SelectionSetNode,
    FieldNode,
    ArgumentNode,
    FragmentSpreadNode,
    InlineFragmentNode,
    FragmentDefinitionNode,
    IntValueNode,
    FloatValueNode,
    StringValueNode,
    BooleanValueNode,
    NullValueNode,
    EnumValueNode,
    ListValueNode,
    ObjectValueNode,
    ObjectFieldNode,
    DirectiveNode,
    NamedTypeNode,
    ListTypeNode,
    NonNullTypeNode,
    SchemaDefinitionNode,
    OperationTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InputValueDefinitionNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
    EnumTypeDefinitionNode,
    EnumValueDefinitionNode,
    InputObjectTypeDefinitionNode,
    DirectiveDefinitionNode,
    SchemaExtensionNode,
    ScalarTypeExtensionNode,
    ObjectTypeExtensionNode,
    InterfaceTypeExtensionNode,
    UnionTypeExtensionNode,
    EnumTypeExtensionNode,
    InputObjectTypeExtensionNode,
} from 'graphql'

/**
 * @internal
 */
export interface IFactoryFunc<TNode> {
    (config: Omit<TNode, 'kind'>): TNode
}

function makeFactoryFunc<TNode extends ASTNode>(kind: string): { (config: Omit<TNode, 'kind'>): TNode } {
    return config => ({
        ...config,
        kind,
    } as TNode)
}

// TODO: Move to separate GraphQL utility package
// Leaf Kinds
/** @internal */ export const Name: IFactoryFunc<NameNode> = makeFactoryFunc(`Name`)
/** @internal */ export const Document: IFactoryFunc<DocumentNode> = makeFactoryFunc(`Document`)
/** @internal */ export const OperationDefinition: IFactoryFunc<OperationDefinitionNode> = makeFactoryFunc(`OperationDefinition`)
/** @internal */ export const VariableDefinition: IFactoryFunc<VariableDefinitionNode> = makeFactoryFunc(`VariableDefinition`)
/** @internal */ export const Variable: IFactoryFunc<VariableNode> = makeFactoryFunc(`Variable`)
/** @internal */ export const SelectionSet: IFactoryFunc<SelectionSetNode> = makeFactoryFunc(`SelectionSet`)
/** @internal */ export const Field: IFactoryFunc<FieldNode> = makeFactoryFunc(`Field`)
/** @internal */ export const Argument: IFactoryFunc<ArgumentNode> = makeFactoryFunc(`Argument`)
/** @internal */ export const FragmentSpread: IFactoryFunc<FragmentSpreadNode> = makeFactoryFunc(`FragmentSpread`)
/** @internal */ export const InlineFragment: IFactoryFunc<InlineFragmentNode> = makeFactoryFunc(`InlineFragment`)
/** @internal */ export const FragmentDefinition: IFactoryFunc<FragmentDefinitionNode> = makeFactoryFunc(`FragmentDefinition`)
/** @internal */ export const IntValue: IFactoryFunc<IntValueNode> = makeFactoryFunc(`IntValue`)
/** @internal */ export const FloatValue: IFactoryFunc<FloatValueNode> = makeFactoryFunc(`FloatValue`)
/** @internal */ export const StringValue: IFactoryFunc<StringValueNode> = makeFactoryFunc(`StringValue`)
/** @internal */ export const BooleanValue: IFactoryFunc<BooleanValueNode> = makeFactoryFunc(`BooleanValue`)
/** @internal */ export const NullValue: IFactoryFunc<NullValueNode> = makeFactoryFunc(`NullValue`)
/** @internal */ export const EnumValue: IFactoryFunc<EnumValueNode> = makeFactoryFunc(`EnumValue`)
/** @internal */ export const ListValue: IFactoryFunc<ListValueNode> = makeFactoryFunc(`ListValue`)
/** @internal */ export const ObjectValue: IFactoryFunc<ObjectValueNode> = makeFactoryFunc(`ObjectValue`)
/** @internal */ export const ObjectField: IFactoryFunc<ObjectFieldNode> = makeFactoryFunc(`ObjectField`)
/** @internal */ export const Directive: IFactoryFunc<DirectiveNode> = makeFactoryFunc(`Directive`)
/** @internal */ export const NamedType: IFactoryFunc<NamedTypeNode> = makeFactoryFunc(`NamedType`)
/** @internal */ export const ListType: IFactoryFunc<ListTypeNode> = makeFactoryFunc(`ListType`)
/** @internal */ export const NonNullType: IFactoryFunc<NonNullTypeNode> = makeFactoryFunc(`NonNullType`)
/** @internal */ export const SchemaDefinition: IFactoryFunc<SchemaDefinitionNode> = makeFactoryFunc(`SchemaDefinition`)
/** @internal */ export const OperationTypeDefinition: IFactoryFunc<OperationTypeDefinitionNode> = makeFactoryFunc(`OperationTypeDefinition`)
/** @internal */ export const ScalarTypeDefinition: IFactoryFunc<ScalarTypeDefinitionNode> = makeFactoryFunc(`ScalarTypeDefinition`)
/** @internal */ export const ObjectTypeDefinition: IFactoryFunc<ObjectTypeDefinitionNode> = makeFactoryFunc(`ObjectTypeDefinition`)
/** @internal */ export const FieldDefinition: IFactoryFunc<FieldDefinitionNode> = makeFactoryFunc(`FieldDefinition`)
/** @internal */ export const InputValueDefinition: IFactoryFunc<InputValueDefinitionNode> = makeFactoryFunc(`InputValueDefinition`)
/** @internal */ export const InterfaceTypeDefinition: IFactoryFunc<InterfaceTypeDefinitionNode> = makeFactoryFunc(`InterfaceTypeDefinition`)
/** @internal */ export const UnionTypeDefinition: IFactoryFunc<UnionTypeDefinitionNode> = makeFactoryFunc(`UnionTypeDefinition`)
/** @internal */ export const EnumTypeDefinition: IFactoryFunc<EnumTypeDefinitionNode> = makeFactoryFunc(`EnumTypeDefinition`)
/** @internal */ export const EnumValueDefinition: IFactoryFunc<EnumValueDefinitionNode> = makeFactoryFunc(`EnumValueDefinition`)
/** @internal */ export const InputObjectTypeDefinition: IFactoryFunc<InputObjectTypeDefinitionNode> = makeFactoryFunc(`InputObjectTypeDefinition`)
/** @internal */ export const DirectiveDefinition: IFactoryFunc<DirectiveDefinitionNode> = makeFactoryFunc(`DirectiveDefinition`)
/** @internal */ export const SchemaExtension: IFactoryFunc<SchemaExtensionNode> = makeFactoryFunc(`SchemaExtension`)
/** @internal */ export const ScalarTypeExtension: IFactoryFunc<ScalarTypeExtensionNode> = makeFactoryFunc(`ScalarTypeExtension`)
/** @internal */ export const ObjectTypeExtension: IFactoryFunc<ObjectTypeExtensionNode> = makeFactoryFunc(`ObjectTypeExtension`)
/** @internal */ export const InterfaceTypeExtension: IFactoryFunc<InterfaceTypeExtensionNode> = makeFactoryFunc(`InterfaceTypeExtension`)
/** @internal */ export const UnionTypeExtension: IFactoryFunc<UnionTypeExtensionNode> = makeFactoryFunc(`UnionTypeExtension`)
/** @internal */ export const EnumTypeExtension: IFactoryFunc<EnumTypeExtensionNode> = makeFactoryFunc(`EnumTypeExtension`)
/** @internal */ export const InputObjectTypeExtension: IFactoryFunc<InputObjectTypeExtensionNode> = makeFactoryFunc(`InputObjectTypeExtension`)
