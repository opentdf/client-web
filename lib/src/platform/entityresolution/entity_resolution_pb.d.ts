// @generated by protoc-gen-es v1.9.0 with parameter "target=js+dts,import_extension=none"
// @generated from file entityresolution/entity_resolution.proto (package entityresolution, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { Any, BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage, Struct } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import type { Entity, EntityChain, Token } from "../authorization/authorization_pb";

/**
 *
 * Example: Get idp attributes for bob and alice (both represented using an email address
 * {
 * "entities": [
 * {
 * "id": "e1",
 * "emailAddress": "bob@example.org"
 * },
 * {
 * "id": "e2",
 * "emailAddress": "alice@example.org"
 * }
 * ]
 * }
 *
 *
 * @generated from message entityresolution.ResolveEntitiesRequest
 */
export declare class ResolveEntitiesRequest extends Message<ResolveEntitiesRequest> {
  /**
   * @generated from field: repeated authorization.Entity entities = 1;
   */
  entities: Entity[];

  constructor(data?: PartialMessage<ResolveEntitiesRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "entityresolution.ResolveEntitiesRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ResolveEntitiesRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ResolveEntitiesRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ResolveEntitiesRequest;

  static equals(a: ResolveEntitiesRequest | PlainMessage<ResolveEntitiesRequest> | undefined, b: ResolveEntitiesRequest | PlainMessage<ResolveEntitiesRequest> | undefined): boolean;
}

/**
 * @generated from message entityresolution.EntityRepresentation
 */
export declare class EntityRepresentation extends Message<EntityRepresentation> {
  /**
   * @generated from field: repeated google.protobuf.Struct additional_props = 1;
   */
  additionalProps: Struct[];

  /**
   * ephemeral entity id from the request
   *
   * @generated from field: string original_id = 2;
   */
  originalId: string;

  constructor(data?: PartialMessage<EntityRepresentation>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "entityresolution.EntityRepresentation";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EntityRepresentation;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EntityRepresentation;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EntityRepresentation;

  static equals(a: EntityRepresentation | PlainMessage<EntityRepresentation> | undefined, b: EntityRepresentation | PlainMessage<EntityRepresentation> | undefined): boolean;
}

/**
 *
 * Example: Get idp attributes for bob and alice
 * {
 * "entity_representations": [
 * {
 * "idp_entity_id": "e1",
 * "additional_props": {"someAttr1":"someValue1"}
 * },
 * {
 * "idp_entity_id": "e2",
 * "additional_props": {"someAttr2":"someValue2"}
 * }
 * ]
 * }
 *
 *
 * @generated from message entityresolution.ResolveEntitiesResponse
 */
export declare class ResolveEntitiesResponse extends Message<ResolveEntitiesResponse> {
  /**
   * @generated from field: repeated entityresolution.EntityRepresentation entity_representations = 1;
   */
  entityRepresentations: EntityRepresentation[];

  constructor(data?: PartialMessage<ResolveEntitiesResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "entityresolution.ResolveEntitiesResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ResolveEntitiesResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ResolveEntitiesResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ResolveEntitiesResponse;

  static equals(a: ResolveEntitiesResponse | PlainMessage<ResolveEntitiesResponse> | undefined, b: ResolveEntitiesResponse | PlainMessage<ResolveEntitiesResponse> | undefined): boolean;
}

/**
 * @generated from message entityresolution.EntityNotFoundError
 */
export declare class EntityNotFoundError extends Message<EntityNotFoundError> {
  /**
   * @generated from field: int32 code = 1;
   */
  code: number;

  /**
   * @generated from field: string message = 2;
   */
  message: string;

  /**
   * @generated from field: repeated google.protobuf.Any details = 3;
   */
  details: Any[];

  /**
   * @generated from field: string entity = 4;
   */
  entity: string;

  constructor(data?: PartialMessage<EntityNotFoundError>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "entityresolution.EntityNotFoundError";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EntityNotFoundError;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EntityNotFoundError;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EntityNotFoundError;

  static equals(a: EntityNotFoundError | PlainMessage<EntityNotFoundError> | undefined, b: EntityNotFoundError | PlainMessage<EntityNotFoundError> | undefined): boolean;
}

/**
 *
 * Example: Get Entity chains for tokens aaaaaa and bbbbbb
 * {
 * "tokens": [
 * "aaaaaaa",
 * "bbbbbbbb"
 * ]
 * }
 *
 *
 * @generated from message entityresolution.CreateEntityChainFromJwtRequest
 */
export declare class CreateEntityChainFromJwtRequest extends Message<CreateEntityChainFromJwtRequest> {
  /**
   * @generated from field: repeated authorization.Token tokens = 1;
   */
  tokens: Token[];

  constructor(data?: PartialMessage<CreateEntityChainFromJwtRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "entityresolution.CreateEntityChainFromJwtRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateEntityChainFromJwtRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateEntityChainFromJwtRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateEntityChainFromJwtRequest;

  static equals(a: CreateEntityChainFromJwtRequest | PlainMessage<CreateEntityChainFromJwtRequest> | undefined, b: CreateEntityChainFromJwtRequest | PlainMessage<CreateEntityChainFromJwtRequest> | undefined): boolean;
}

/**
 *
 * Example: Return the entity chains from the provided tokens
 * {
 * "entity_chains": [
 * {
 * "id": "tok1",
 * "entities": [
 * {
 * "clientId": "client1"
 * }
 * ]
 * },
 * {
 * "id": "tok2",
 * "entities": [
 * {
 * "userName": "alice",
 * "clientId": "client2"
 * }
 * ]
 * }
 * ]
 * }
 *
 *
 * @generated from message entityresolution.CreateEntityChainFromJwtResponse
 */
export declare class CreateEntityChainFromJwtResponse extends Message<CreateEntityChainFromJwtResponse> {
  /**
   * @generated from field: repeated authorization.EntityChain entity_chains = 1;
   */
  entityChains: EntityChain[];

  constructor(data?: PartialMessage<CreateEntityChainFromJwtResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "entityresolution.CreateEntityChainFromJwtResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateEntityChainFromJwtResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateEntityChainFromJwtResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateEntityChainFromJwtResponse;

  static equals(a: CreateEntityChainFromJwtResponse | PlainMessage<CreateEntityChainFromJwtResponse> | undefined, b: CreateEntityChainFromJwtResponse | PlainMessage<CreateEntityChainFromJwtResponse> | undefined): boolean;
}

