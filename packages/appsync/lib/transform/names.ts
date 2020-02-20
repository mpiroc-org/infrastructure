import { ICommonNames, IModelNames } from './interfaces'
import { pluralize } from './util'

/**
 * @internal
 */
export const commonNames: ICommonNames = {
    sortDirection: `ModelSortDirection`,
    attributeTypes: `ModelAttributeTypes`,
    sizeInput: `ModelSizeInput`,
    stringInput: `ModelStringInput`,
    idInput: `ModelIDInput`,
    intInput: `ModelIntInput`,
    floatInput: `ModelFloatInput`,
    booleanInput: `ModelBooleanInput`,
}

/**
 * @param name The name of the underlying model.
 * @internal
 */
export function getModelNames(name: string): IModelNames {
    return {
        main: name,
        modelConnection: `Model${name}Connection`,
        createInput: `Create${name}Input`,
        updateInput: `Update${name}Input`,
        deleteInput: `Delete${name}Input`,
        modelFilterInput: `Model${name}FilterInput`,
        modelConditionInput: `Model${name}ConditionInput`,
        query: {
            name: `Query`,
            get: `get${name}`,
            list: `list${pluralize(name)}`,
            sync: `sync${pluralize(name)}`,
        },
        mutation: {
            name: `Mutation`,
            create: `create${name}`,
            update: `update${name}`,
            delete: `delete${name}`,
        },
        subscription: {
            name: `Subscription`,
            onCreate: `onCreate${name}`,
            onUpdate: `onUpdate${name}`,
            onDelete: `onDelete${name}`,
        }
    }
}