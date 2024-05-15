// @generated by protoc-gen-es v1.9.0 with parameter "target=ts"
// @generated from file authorization/authorization.proto (package authorization, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type {
  BinaryReadOptions,
  FieldList,
  JsonReadOptions,
  JsonValue,
  PartialMessage,
  PlainMessage,
} from '@bufbuild/protobuf';
import { Any, Message, proto3 } from '@bufbuild/protobuf';
import { Action } from '../policy/objects_pb.js';

/**
 * PE (Person Entity) or NPE (Non-Person Entity)
 *
 * @generated from message authorization.Entity
 */
export class Entity extends Message<Entity> {
  /**
   * ephemeral id for tracking between request and response
   *
   * @generated from field: string id = 1;
   */
  id = '';

  /**
   * Standard entity types supported by the platform
   *
   * @generated from oneof authorization.Entity.entity_type
   */
  entityType:
    | {
        /**
         * @generated from field: string email_address = 2;
         */
        value: string;
        case: 'emailAddress';
      }
    | {
        /**
         * @generated from field: string user_name = 3;
         */
        value: string;
        case: 'userName';
      }
    | {
        /**
         * @generated from field: string remote_claims_url = 4;
         */
        value: string;
        case: 'remoteClaimsUrl';
      }
    | {
        /**
         * @generated from field: string jwt = 5;
         */
        value: string;
        case: 'jwt';
      }
    | {
        /**
         * @generated from field: google.protobuf.Any claims = 6;
         */
        value: Any;
        case: 'claims';
      }
    | {
        /**
         * @generated from field: authorization.EntityCustom custom = 7;
         */
        value: EntityCustom;
        case: 'custom';
      }
    | {
        /**
         * @generated from field: string client_id = 8;
         */
        value: string;
        case: 'clientId';
      }
    | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<Entity>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.Entity';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'id', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    {
      no: 2,
      name: 'email_address',
      kind: 'scalar',
      T: 9 /* ScalarType.STRING */,
      oneof: 'entity_type',
    },
    {
      no: 3,
      name: 'user_name',
      kind: 'scalar',
      T: 9 /* ScalarType.STRING */,
      oneof: 'entity_type',
    },
    {
      no: 4,
      name: 'remote_claims_url',
      kind: 'scalar',
      T: 9 /* ScalarType.STRING */,
      oneof: 'entity_type',
    },
    { no: 5, name: 'jwt', kind: 'scalar', T: 9 /* ScalarType.STRING */, oneof: 'entity_type' },
    { no: 6, name: 'claims', kind: 'message', T: Any, oneof: 'entity_type' },
    { no: 7, name: 'custom', kind: 'message', T: EntityCustom, oneof: 'entity_type' },
    {
      no: 8,
      name: 'client_id',
      kind: 'scalar',
      T: 9 /* ScalarType.STRING */,
      oneof: 'entity_type',
    },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Entity {
    return new Entity().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Entity {
    return new Entity().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Entity {
    return new Entity().fromJsonString(jsonString, options);
  }

  static equals(
    a: Entity | PlainMessage<Entity> | undefined,
    b: Entity | PlainMessage<Entity> | undefined
  ): boolean {
    return proto3.util.equals(Entity, a, b);
  }
}

/**
 * Entity type for custom entities beyond the standard types
 *
 * @generated from message authorization.EntityCustom
 */
export class EntityCustom extends Message<EntityCustom> {
  /**
   * @generated from field: google.protobuf.Any extension = 1;
   */
  extension?: Any;

  constructor(data?: PartialMessage<EntityCustom>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.EntityCustom';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'extension', kind: 'message', T: Any },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EntityCustom {
    return new EntityCustom().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EntityCustom {
    return new EntityCustom().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EntityCustom {
    return new EntityCustom().fromJsonString(jsonString, options);
  }

  static equals(
    a: EntityCustom | PlainMessage<EntityCustom> | undefined,
    b: EntityCustom | PlainMessage<EntityCustom> | undefined
  ): boolean {
    return proto3.util.equals(EntityCustom, a, b);
  }
}

/**
 * A set of related PE and NPE
 *
 * @generated from message authorization.EntityChain
 */
export class EntityChain extends Message<EntityChain> {
  /**
   * ephemeral id for tracking between request and response
   *
   * @generated from field: string id = 1;
   */
  id = '';

  /**
   * @generated from field: repeated authorization.Entity entities = 2;
   */
  entities: Entity[] = [];

  constructor(data?: PartialMessage<EntityChain>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.EntityChain';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'id', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'entities', kind: 'message', T: Entity, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EntityChain {
    return new EntityChain().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EntityChain {
    return new EntityChain().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): EntityChain {
    return new EntityChain().fromJsonString(jsonString, options);
  }

  static equals(
    a: EntityChain | PlainMessage<EntityChain> | undefined,
    b: EntityChain | PlainMessage<EntityChain> | undefined
  ): boolean {
    return proto3.util.equals(EntityChain, a, b);
  }
}

/**
 *
 * Example Request Get Decisions to answer the question -  Do Bob (represented by entity chain ec1)
 * and Alice (represented by entity chain ec2) have TRANSMIT authorization for
 * 2 resources; resource1 (attr-set-1) defined by attributes foo:bar  resource2 (attr-set-2) defined by attribute foo:bar, color:red ?
 *
 * {
 * "actions": [
 * {
 * "standard": "STANDARD_ACTION_TRANSMIT"
 * }
 * ],
 * "entityChains": [
 * {
 * "id": "ec1",
 * "entities": [
 * {
 * "emailAddress": "bob@example.org"
 * }
 * ]
 * },
 * {
 * "id": "ec2",
 * "entities": [
 * {
 * "userName": "alice@example.org"
 * }
 * ]
 * }
 * ],
 * "resourceAttributes": [
 * {
 * "attributeFqns": [
 * "https://www.example.org/attr/foo/value/value1"
 * ]
 * },
 * {
 * "attributeFqns": [
 * "https://example.net/attr/attr1/value/value1",
 * "https://example.net/attr/attr1/value/value2"
 * ]
 * }
 * ]
 * }
 *
 *
 * @generated from message authorization.DecisionRequest
 */
export class DecisionRequest extends Message<DecisionRequest> {
  /**
   * @generated from field: repeated policy.Action actions = 1;
   */
  actions: Action[] = [];

  /**
   * @generated from field: repeated authorization.EntityChain entity_chains = 2;
   */
  entityChains: EntityChain[] = [];

  /**
   * @generated from field: repeated authorization.ResourceAttribute resource_attributes = 3;
   */
  resourceAttributes: ResourceAttribute[] = [];

  constructor(data?: PartialMessage<DecisionRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.DecisionRequest';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'actions', kind: 'message', T: Action, repeated: true },
    { no: 2, name: 'entity_chains', kind: 'message', T: EntityChain, repeated: true },
    { no: 3, name: 'resource_attributes', kind: 'message', T: ResourceAttribute, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DecisionRequest {
    return new DecisionRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DecisionRequest {
    return new DecisionRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DecisionRequest {
    return new DecisionRequest().fromJsonString(jsonString, options);
  }

  static equals(
    a: DecisionRequest | PlainMessage<DecisionRequest> | undefined,
    b: DecisionRequest | PlainMessage<DecisionRequest> | undefined
  ): boolean {
    return proto3.util.equals(DecisionRequest, a, b);
  }
}

/**
 *
 *
 * Example response for a Decision Request -  Do Bob (represented by entity chain ec1)
 * and Alice (represented by entity chain ec2) have TRANSMIT authorization for
 * 2 resources; resource1 (attr-set-1) defined by attributes foo:bar  resource2 (attr-set-2) defined by attribute foo:bar, color:red ?
 *
 * Results:
 * - bob has permitted authorization to transmit for a resource defined by attr-set-1 attributes and has a watermark obligation
 * - bob has denied authorization to transmit a for a resource defined by attr-set-2 attributes
 * - alice has permitted authorization to transmit for a resource defined by attr-set-1 attributes
 * - alice has denied authorization to transmit a for a resource defined by attr-set-2 attributes
 *
 * {
 * "entityChainId":  "ec1",
 * "resourceAttributesId":  "attr-set-1",
 * "decision":  "DECISION_PERMIT",
 * "obligations":  [
 * "http://www.example.org/obligation/watermark"
 * ]
 * },
 * {
 * "entityChainId":  "ec1",
 * "resourceAttributesId":  "attr-set-2",
 * "decision":  "DECISION_PERMIT"
 * },
 * {
 * "entityChainId":  "ec2",
 * "resourceAttributesId":  "attr-set-1",
 * "decision":  "DECISION_PERMIT"
 * },
 * {
 * "entityChainId":  "ec2",
 * "resourceAttributesId":  "attr-set-2",
 * "decision":  "DECISION_DENY"
 * }
 *
 *
 *
 * @generated from message authorization.DecisionResponse
 */
export class DecisionResponse extends Message<DecisionResponse> {
  /**
   * ephemeral entity chain id from the request
   *
   * @generated from field: string entity_chain_id = 1;
   */
  entityChainId = '';

  /**
   * ephemeral resource attributes id from the request
   *
   * @generated from field: string resource_attributes_id = 2;
   */
  resourceAttributesId = '';

  /**
   * Action of the decision response
   *
   * @generated from field: policy.Action action = 3;
   */
  action?: Action;

  /**
   * The decision response
   *
   * @generated from field: authorization.DecisionResponse.Decision decision = 4;
   */
  decision = DecisionResponse_Decision.UNSPECIFIED;

  /**
   * optional list of obligations represented in URI format
   *
   * @generated from field: repeated string obligations = 5;
   */
  obligations: string[] = [];

  constructor(data?: PartialMessage<DecisionResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.DecisionResponse';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'entity_chain_id', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 2, name: 'resource_attributes_id', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    { no: 3, name: 'action', kind: 'message', T: Action },
    { no: 4, name: 'decision', kind: 'enum', T: proto3.getEnumType(DecisionResponse_Decision) },
    { no: 5, name: 'obligations', kind: 'scalar', T: 9 /* ScalarType.STRING */, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DecisionResponse {
    return new DecisionResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DecisionResponse {
    return new DecisionResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DecisionResponse {
    return new DecisionResponse().fromJsonString(jsonString, options);
  }

  static equals(
    a: DecisionResponse | PlainMessage<DecisionResponse> | undefined,
    b: DecisionResponse | PlainMessage<DecisionResponse> | undefined
  ): boolean {
    return proto3.util.equals(DecisionResponse, a, b);
  }
}

/**
 * @generated from enum authorization.DecisionResponse.Decision
 */
export enum DecisionResponse_Decision {
  /**
   * @generated from enum value: DECISION_UNSPECIFIED = 0;
   */
  UNSPECIFIED = 0,

  /**
   * @generated from enum value: DECISION_DENY = 1;
   */
  DENY = 1,

  /**
   * @generated from enum value: DECISION_PERMIT = 2;
   */
  PERMIT = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(DecisionResponse_Decision)
proto3.util.setEnumType(DecisionResponse_Decision, 'authorization.DecisionResponse.Decision', [
  { no: 0, name: 'DECISION_UNSPECIFIED' },
  { no: 1, name: 'DECISION_DENY' },
  { no: 2, name: 'DECISION_PERMIT' },
]);

/**
 * @generated from message authorization.GetDecisionsRequest
 */
export class GetDecisionsRequest extends Message<GetDecisionsRequest> {
  /**
   * @generated from field: repeated authorization.DecisionRequest decision_requests = 1;
   */
  decisionRequests: DecisionRequest[] = [];

  constructor(data?: PartialMessage<GetDecisionsRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.GetDecisionsRequest';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'decision_requests', kind: 'message', T: DecisionRequest, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetDecisionsRequest {
    return new GetDecisionsRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetDecisionsRequest {
    return new GetDecisionsRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(
    jsonString: string,
    options?: Partial<JsonReadOptions>
  ): GetDecisionsRequest {
    return new GetDecisionsRequest().fromJsonString(jsonString, options);
  }

  static equals(
    a: GetDecisionsRequest | PlainMessage<GetDecisionsRequest> | undefined,
    b: GetDecisionsRequest | PlainMessage<GetDecisionsRequest> | undefined
  ): boolean {
    return proto3.util.equals(GetDecisionsRequest, a, b);
  }
}

/**
 * @generated from message authorization.GetDecisionsResponse
 */
export class GetDecisionsResponse extends Message<GetDecisionsResponse> {
  /**
   * @generated from field: repeated authorization.DecisionResponse decision_responses = 1;
   */
  decisionResponses: DecisionResponse[] = [];

  constructor(data?: PartialMessage<GetDecisionsResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.GetDecisionsResponse';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'decision_responses', kind: 'message', T: DecisionResponse, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetDecisionsResponse {
    return new GetDecisionsResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetDecisionsResponse {
    return new GetDecisionsResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(
    jsonString: string,
    options?: Partial<JsonReadOptions>
  ): GetDecisionsResponse {
    return new GetDecisionsResponse().fromJsonString(jsonString, options);
  }

  static equals(
    a: GetDecisionsResponse | PlainMessage<GetDecisionsResponse> | undefined,
    b: GetDecisionsResponse | PlainMessage<GetDecisionsResponse> | undefined
  ): boolean {
    return proto3.util.equals(GetDecisionsResponse, a, b);
  }
}

/**
 *
 * Request to get entitlements for one or more entities for an optional attribute scope
 *
 * Example: Get entitlements for bob and alice (both represented using an email address
 *
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
 * @generated from message authorization.GetEntitlementsRequest
 */
export class GetEntitlementsRequest extends Message<GetEntitlementsRequest> {
  /**
   * list of requested entities
   *
   * @generated from field: repeated authorization.Entity entities = 1;
   */
  entities: Entity[] = [];

  /**
   * optional attribute fqn as a scope
   *
   * @generated from field: optional authorization.ResourceAttribute scope = 2;
   */
  scope?: ResourceAttribute;

  constructor(data?: PartialMessage<GetEntitlementsRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.GetEntitlementsRequest';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'entities', kind: 'message', T: Entity, repeated: true },
    { no: 2, name: 'scope', kind: 'message', T: ResourceAttribute, opt: true },
  ]);

  static fromBinary(
    bytes: Uint8Array,
    options?: Partial<BinaryReadOptions>
  ): GetEntitlementsRequest {
    return new GetEntitlementsRequest().fromBinary(bytes, options);
  }

  static fromJson(
    jsonValue: JsonValue,
    options?: Partial<JsonReadOptions>
  ): GetEntitlementsRequest {
    return new GetEntitlementsRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(
    jsonString: string,
    options?: Partial<JsonReadOptions>
  ): GetEntitlementsRequest {
    return new GetEntitlementsRequest().fromJsonString(jsonString, options);
  }

  static equals(
    a: GetEntitlementsRequest | PlainMessage<GetEntitlementsRequest> | undefined,
    b: GetEntitlementsRequest | PlainMessage<GetEntitlementsRequest> | undefined
  ): boolean {
    return proto3.util.equals(GetEntitlementsRequest, a, b);
  }
}

/**
 * @generated from message authorization.EntityEntitlements
 */
export class EntityEntitlements extends Message<EntityEntitlements> {
  /**
   * @generated from field: string entity_id = 1;
   */
  entityId = '';

  /**
   * @generated from field: repeated string attribute_value_fqns = 2;
   */
  attributeValueFqns: string[] = [];

  constructor(data?: PartialMessage<EntityEntitlements>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.EntityEntitlements';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'entity_id', kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    {
      no: 2,
      name: 'attribute_value_fqns',
      kind: 'scalar',
      T: 9 /* ScalarType.STRING */,
      repeated: true,
    },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): EntityEntitlements {
    return new EntityEntitlements().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): EntityEntitlements {
    return new EntityEntitlements().fromJson(jsonValue, options);
  }

  static fromJsonString(
    jsonString: string,
    options?: Partial<JsonReadOptions>
  ): EntityEntitlements {
    return new EntityEntitlements().fromJsonString(jsonString, options);
  }

  static equals(
    a: EntityEntitlements | PlainMessage<EntityEntitlements> | undefined,
    b: EntityEntitlements | PlainMessage<EntityEntitlements> | undefined
  ): boolean {
    return proto3.util.equals(EntityEntitlements, a, b);
  }
}

/**
 * A logical bucket of attributes belonging to a "Resource"
 *
 * @generated from message authorization.ResourceAttribute
 */
export class ResourceAttribute extends Message<ResourceAttribute> {
  /**
   * @generated from field: repeated string attribute_value_fqns = 2;
   */
  attributeValueFqns: string[] = [];

  constructor(data?: PartialMessage<ResourceAttribute>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.ResourceAttribute';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    {
      no: 2,
      name: 'attribute_value_fqns',
      kind: 'scalar',
      T: 9 /* ScalarType.STRING */,
      repeated: true,
    },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ResourceAttribute {
    return new ResourceAttribute().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ResourceAttribute {
    return new ResourceAttribute().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ResourceAttribute {
    return new ResourceAttribute().fromJsonString(jsonString, options);
  }

  static equals(
    a: ResourceAttribute | PlainMessage<ResourceAttribute> | undefined,
    b: ResourceAttribute | PlainMessage<ResourceAttribute> | undefined
  ): boolean {
    return proto3.util.equals(ResourceAttribute, a, b);
  }
}

/**
 *
 *
 * Example Response for a request of : Get entitlements for bob and alice (both represented using an email address
 *
 * {
 * "entitlements":  [
 * {
 * "entityId":  "e1",
 * "attributeValueReferences":  [
 * {
 * "attributeFqn":  "http://www.example.org/attr/foo/value/bar"
 * }
 * ]
 * },
 * {
 * "entityId":  "e2",
 * "attributeValueReferences":  [
 * {
 * "attributeFqn":  "http://www.example.org/attr/color/value/red"
 * }
 * ]
 * }
 * ]
 * }
 *
 *
 *
 * @generated from message authorization.GetEntitlementsResponse
 */
export class GetEntitlementsResponse extends Message<GetEntitlementsResponse> {
  /**
   * @generated from field: repeated authorization.EntityEntitlements entitlements = 1;
   */
  entitlements: EntityEntitlements[] = [];

  constructor(data?: PartialMessage<GetEntitlementsResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'authorization.GetEntitlementsResponse';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'entitlements', kind: 'message', T: EntityEntitlements, repeated: true },
  ]);

  static fromBinary(
    bytes: Uint8Array,
    options?: Partial<BinaryReadOptions>
  ): GetEntitlementsResponse {
    return new GetEntitlementsResponse().fromBinary(bytes, options);
  }

  static fromJson(
    jsonValue: JsonValue,
    options?: Partial<JsonReadOptions>
  ): GetEntitlementsResponse {
    return new GetEntitlementsResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(
    jsonString: string,
    options?: Partial<JsonReadOptions>
  ): GetEntitlementsResponse {
    return new GetEntitlementsResponse().fromJsonString(jsonString, options);
  }

  static equals(
    a: GetEntitlementsResponse | PlainMessage<GetEntitlementsResponse> | undefined,
    b: GetEntitlementsResponse | PlainMessage<GetEntitlementsResponse> | undefined
  ): boolean {
    return proto3.util.equals(GetEntitlementsResponse, a, b);
  }
}
