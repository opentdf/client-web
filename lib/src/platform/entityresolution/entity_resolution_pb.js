// @generated by protoc-gen-es v1.9.0 with parameter "target=js+dts,import_extension=none"
// @generated from file entityresolution/entity_resolution.proto (package entityresolution, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { Any, proto3, Struct } from "@bufbuild/protobuf";
import { Entity, EntityChain, Token } from "../authorization/authorization_pb";

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
export const ResolveEntitiesRequest = /*@__PURE__*/ proto3.makeMessageType(
  "entityresolution.ResolveEntitiesRequest",
  () => [
    { no: 1, name: "entities", kind: "message", T: Entity, repeated: true },
  ],
);

/**
 * @generated from message entityresolution.EntityRepresentation
 */
export const EntityRepresentation = /*@__PURE__*/ proto3.makeMessageType(
  "entityresolution.EntityRepresentation",
  () => [
    { no: 1, name: "additional_props", kind: "message", T: Struct, repeated: true },
    { no: 2, name: "original_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ],
);

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
export const ResolveEntitiesResponse = /*@__PURE__*/ proto3.makeMessageType(
  "entityresolution.ResolveEntitiesResponse",
  () => [
    { no: 1, name: "entity_representations", kind: "message", T: EntityRepresentation, repeated: true },
  ],
);

/**
 * @generated from message entityresolution.EntityNotFoundError
 */
export const EntityNotFoundError = /*@__PURE__*/ proto3.makeMessageType(
  "entityresolution.EntityNotFoundError",
  () => [
    { no: 1, name: "code", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "message", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "details", kind: "message", T: Any, repeated: true },
    { no: 4, name: "entity", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ],
);

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
export const CreateEntityChainFromJwtRequest = /*@__PURE__*/ proto3.makeMessageType(
  "entityresolution.CreateEntityChainFromJwtRequest",
  () => [
    { no: 1, name: "tokens", kind: "message", T: Token, repeated: true },
  ],
);

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
export const CreateEntityChainFromJwtResponse = /*@__PURE__*/ proto3.makeMessageType(
  "entityresolution.CreateEntityChainFromJwtResponse",
  () => [
    { no: 1, name: "entity_chains", kind: "message", T: EntityChain, repeated: true },
  ],
);

