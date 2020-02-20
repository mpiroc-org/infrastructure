Oberservations: Fields with union types are OMITTED from input types

## Model Types

* main: NAME
  * Fields from original type
  * Recursively generate input types for fields with custom types
    * Do not duplicate if multiple models reference the same custom type
  * _version
  * _deleted
  * _lastChangedAt
* input: NAMEInput
  * Fields from original type (including id)
  * _version
  * _deleted
  * _lastChangedAt
* createInput: CreateNAMEInput
  * Fields from original type (including id, but optional)
  * _version
  * Omit union types
* updateInput: UpdateNAMEInput
  * Fields from original type (including id)
  * _version
  * Omit union types
* deleteInput: DeleteNAMEInput
  * id
  * _version
* modelConnection: ModelNAMEConnection
  * items
  * nextToken
  * startedAt
* modelFilterInput: ModelNAMEFilterInput
  * For each scalar field (including id), include with corresponding common type
    * i.e. `ID` becomes `ModelIDInput`
  * and
  * or
  * not
* modelConditionInput: ModelNAMEConditionInput
  * For each scalar field (excluding id), include with corresponding common type
  * and
  * or
  * not
* query: Query
  * syncNAMEs
  * getNAME
  * listNAMEs
* mutation: Mutation
  * createNAME
  * updateNAME
  * deleteNAME
* subscription: Subscription
  * onCreateNAME
  * onUpdateNAME
  * onDeleteNAME


## Basic Types (referenced directly or indirectly from model types)

Common Types
* ModelSortDirection
* ModelStringInput
* ModelIDInput
* ModelIntInput
* ModelFloatInput
* ModelBooleanInput
* ModelSizeInput
* ModelAttributeTypes