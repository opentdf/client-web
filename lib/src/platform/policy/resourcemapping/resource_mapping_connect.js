// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=js+dts,import_extension=none"
// @generated from file policy/resourcemapping/resource_mapping.proto (package policy.resourcemapping, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { CreateResourceMappingRequest, CreateResourceMappingResponse, DeleteResourceMappingRequest, DeleteResourceMappingResponse, GetResourceMappingRequest, GetResourceMappingResponse, ListResourceMappingsRequest, ListResourceMappingsResponse, UpdateResourceMappingRequest, UpdateResourceMappingResponse } from "./resource_mapping_pb";
import { MethodKind } from "@bufbuild/protobuf";

/**
 *
 * Resource Mappings
 *
 * @generated from service policy.resourcemapping.ResourceMappingService
 */
export const ResourceMappingService = {
  typeName: "policy.resourcemapping.ResourceMappingService",
  methods: {
    /**
     *
     * Request Example:
     * - empty body
     *
     * Response Example:
     * {
     * "resource_mappings": [
     * {
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * ],
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e",
     * "metadata": {
     * "labels": [],
     * "created_at": {
     * "seconds": "1706103276",
     * "nanos": 510718000
     * },
     * "updated_at": {
     * "seconds": "1706107873",
     * "nanos": 399786000
     * },
     * "description": ""
     * },
     * "attribute_value": {
     * "members": [],
     * "id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "metadata": null,
     * "attribute_id": "",
     * "value": "value1"
     * }
     * }
     * ]
     * }
     *
     * @generated from rpc policy.resourcemapping.ResourceMappingService.ListResourceMappings
     */
    listResourceMappings: {
      name: "ListResourceMappings",
      I: ListResourceMappingsRequest,
      O: ListResourceMappingsResponse,
      kind: MethodKind.Unary,
    },
    /**
     *
     * Request Example:
     * {
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e"
     * }
     *
     * Response Example:
     * {
     * "resource_mapping": {
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * ],
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e",
     * "metadata": {
     * "labels": [],
     * "created_at": {
     * "seconds": "1706103276",
     * "nanos": 510718000
     * },
     * "updated_at": {
     * "seconds": "1706107873",
     * "nanos": 399786000
     * },
     * "description": ""
     * },
     * "attribute_value": {
     * "members": [],
     * "id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "metadata": null,
     * "attribute_id": "",
     * "value": "value1"
     * }
     * }
     * }
     *
     * @generated from rpc policy.resourcemapping.ResourceMappingService.GetResourceMapping
     */
    getResourceMapping: {
      name: "GetResourceMapping",
      I: GetResourceMappingRequest,
      O: GetResourceMappingResponse,
      kind: MethodKind.Unary,
    },
    /**
     *
     * Request Example:
     * {
     * "resource_mapping": {
     * "attribute_value_id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * ]
     * }
     * }
     *
     * Response Example:
     * {
     * "resource_mapping": {
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * ],
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e",
     * "metadata": {
     * "labels": [],
     * "created_at": {
     * "seconds": "1706103276",
     * "nanos": 510718000
     * },
     * "updated_at": {
     * "seconds": "1706107873",
     * "nanos": 399786000
     * },
     * "description": ""
     * },
     * "attribute_value": {
     * "members": [],
     * "id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "metadata": null,
     * "attribute_id": "",
     * "value": "value1"
     * }
     * }
     * }
     *
     * @generated from rpc policy.resourcemapping.ResourceMappingService.CreateResourceMapping
     */
    createResourceMapping: {
      name: "CreateResourceMapping",
      I: CreateResourceMappingRequest,
      O: CreateResourceMappingResponse,
      kind: MethodKind.Unary,
    },
    /**
     *
     * Request Example:
     * {
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e",
     * "resource_mapping": {
     * "attribute_value_id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * "NEWTERM"
     * ]
     * }
     * }
     *
     * Response Example:
     * {
     * "resource_mapping": {
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * ],
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e",
     * "metadata": {
     * "labels": [],
     * "created_at": {
     * "seconds": "1706103276",
     * "nanos": 510718000
     * },
     * "updated_at": {
     * "seconds": "1706107873",
     * "nanos": 399786000
     * },
     * "description": ""
     * },
     * "attribute_value": {
     * "members": [],
     * "id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "metadata": null,
     * "attribute_id": "",
     * "value": "value1"
     * }
     * }
     * }
     *
     * @generated from rpc policy.resourcemapping.ResourceMappingService.UpdateResourceMapping
     */
    updateResourceMapping: {
      name: "UpdateResourceMapping",
      I: UpdateResourceMappingRequest,
      O: UpdateResourceMappingResponse,
      kind: MethodKind.Unary,
    },
    /**
     *
     * Request Example:
     * {
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e"
     * }
     *
     * Response Example:
     * {
     * "resource_mapping": {
     * "terms": [
     * "TOPSECRET",
     * "TS",
     * ],
     * "id": "3c649464-95b4-4fe0-a09c-ca4b1fecbb0e",
     * "metadata": {
     * "labels": [],
     * "created_at": {
     * "seconds": "1706103276",
     * "nanos": 510718000
     * },
     * "updated_at": {
     * "seconds": "1706107873",
     * "nanos": 399786000
     * },
     * "description": ""
     * },
     * "attribute_value": {
     * "members": [],
     * "id": "f0d1d4f6-bff9-45fd-8170-607b6b559349",
     * "metadata": null,
     * "attribute_id": "",
     * "value": "value1"
     * }
     * }
     * }
     *
     * @generated from rpc policy.resourcemapping.ResourceMappingService.DeleteResourceMapping
     */
    deleteResourceMapping: {
      name: "DeleteResourceMapping",
      I: DeleteResourceMappingRequest,
      O: DeleteResourceMappingResponse,
      kind: MethodKind.Unary,
    },
  }
};

