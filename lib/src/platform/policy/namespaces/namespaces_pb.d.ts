// @generated by protoc-gen-es v1.9.0 with parameter "target=js+dts,import_extension=none"
// @generated from file policy/namespaces/namespaces.proto (package policy.namespaces, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import type { Namespace } from "../objects_pb";
import type { ActiveStateEnum, MetadataMutable, MetadataUpdateEnum } from "../../common/common_pb";

/**
 * @generated from message policy.namespaces.GetNamespaceRequest
 */
export declare class GetNamespaceRequest extends Message<GetNamespaceRequest> {
  /**
   * @generated from field: string id = 1;
   */
  id: string;

  constructor(data?: PartialMessage<GetNamespaceRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.GetNamespaceRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetNamespaceRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetNamespaceRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetNamespaceRequest;

  static equals(a: GetNamespaceRequest | PlainMessage<GetNamespaceRequest> | undefined, b: GetNamespaceRequest | PlainMessage<GetNamespaceRequest> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.GetNamespaceResponse
 */
export declare class GetNamespaceResponse extends Message<GetNamespaceResponse> {
  /**
   * @generated from field: policy.Namespace namespace = 1;
   */
  namespace?: Namespace;

  constructor(data?: PartialMessage<GetNamespaceResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.GetNamespaceResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GetNamespaceResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GetNamespaceResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GetNamespaceResponse;

  static equals(a: GetNamespaceResponse | PlainMessage<GetNamespaceResponse> | undefined, b: GetNamespaceResponse | PlainMessage<GetNamespaceResponse> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.ListNamespacesRequest
 */
export declare class ListNamespacesRequest extends Message<ListNamespacesRequest> {
  /**
   * ACTIVE by default when not specified
   *
   * @generated from field: common.ActiveStateEnum state = 1;
   */
  state: ActiveStateEnum;

  constructor(data?: PartialMessage<ListNamespacesRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.ListNamespacesRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ListNamespacesRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ListNamespacesRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ListNamespacesRequest;

  static equals(a: ListNamespacesRequest | PlainMessage<ListNamespacesRequest> | undefined, b: ListNamespacesRequest | PlainMessage<ListNamespacesRequest> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.ListNamespacesResponse
 */
export declare class ListNamespacesResponse extends Message<ListNamespacesResponse> {
  /**
   * @generated from field: repeated policy.Namespace namespaces = 1;
   */
  namespaces: Namespace[];

  constructor(data?: PartialMessage<ListNamespacesResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.ListNamespacesResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ListNamespacesResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ListNamespacesResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ListNamespacesResponse;

  static equals(a: ListNamespacesResponse | PlainMessage<ListNamespacesResponse> | undefined, b: ListNamespacesResponse | PlainMessage<ListNamespacesResponse> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.CreateNamespaceRequest
 */
export declare class CreateNamespaceRequest extends Message<CreateNamespaceRequest> {
  /**
   * Required
   *
   * @generated from field: string name = 1;
   */
  name: string;

  /**
   * Optional
   *
   * @generated from field: common.MetadataMutable metadata = 100;
   */
  metadata?: MetadataMutable;

  constructor(data?: PartialMessage<CreateNamespaceRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.CreateNamespaceRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateNamespaceRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateNamespaceRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateNamespaceRequest;

  static equals(a: CreateNamespaceRequest | PlainMessage<CreateNamespaceRequest> | undefined, b: CreateNamespaceRequest | PlainMessage<CreateNamespaceRequest> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.CreateNamespaceResponse
 */
export declare class CreateNamespaceResponse extends Message<CreateNamespaceResponse> {
  /**
   * @generated from field: policy.Namespace namespace = 1;
   */
  namespace?: Namespace;

  constructor(data?: PartialMessage<CreateNamespaceResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.CreateNamespaceResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateNamespaceResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateNamespaceResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateNamespaceResponse;

  static equals(a: CreateNamespaceResponse | PlainMessage<CreateNamespaceResponse> | undefined, b: CreateNamespaceResponse | PlainMessage<CreateNamespaceResponse> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.UpdateNamespaceRequest
 */
export declare class UpdateNamespaceRequest extends Message<UpdateNamespaceRequest> {
  /**
   * Required
   *
   * @generated from field: string id = 1;
   */
  id: string;

  /**
   * Optional
   *
   * @generated from field: common.MetadataMutable metadata = 100;
   */
  metadata?: MetadataMutable;

  /**
   * @generated from field: common.MetadataUpdateEnum metadata_update_behavior = 101;
   */
  metadataUpdateBehavior: MetadataUpdateEnum;

  constructor(data?: PartialMessage<UpdateNamespaceRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.UpdateNamespaceRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateNamespaceRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateNamespaceRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateNamespaceRequest;

  static equals(a: UpdateNamespaceRequest | PlainMessage<UpdateNamespaceRequest> | undefined, b: UpdateNamespaceRequest | PlainMessage<UpdateNamespaceRequest> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.UpdateNamespaceResponse
 */
export declare class UpdateNamespaceResponse extends Message<UpdateNamespaceResponse> {
  /**
   * @generated from field: policy.Namespace namespace = 1;
   */
  namespace?: Namespace;

  constructor(data?: PartialMessage<UpdateNamespaceResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.UpdateNamespaceResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateNamespaceResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateNamespaceResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateNamespaceResponse;

  static equals(a: UpdateNamespaceResponse | PlainMessage<UpdateNamespaceResponse> | undefined, b: UpdateNamespaceResponse | PlainMessage<UpdateNamespaceResponse> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.DeactivateNamespaceRequest
 */
export declare class DeactivateNamespaceRequest extends Message<DeactivateNamespaceRequest> {
  /**
   * @generated from field: string id = 1;
   */
  id: string;

  constructor(data?: PartialMessage<DeactivateNamespaceRequest>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.DeactivateNamespaceRequest";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeactivateNamespaceRequest;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeactivateNamespaceRequest;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeactivateNamespaceRequest;

  static equals(a: DeactivateNamespaceRequest | PlainMessage<DeactivateNamespaceRequest> | undefined, b: DeactivateNamespaceRequest | PlainMessage<DeactivateNamespaceRequest> | undefined): boolean;
}

/**
 * @generated from message policy.namespaces.DeactivateNamespaceResponse
 */
export declare class DeactivateNamespaceResponse extends Message<DeactivateNamespaceResponse> {
  constructor(data?: PartialMessage<DeactivateNamespaceResponse>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "policy.namespaces.DeactivateNamespaceResponse";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeactivateNamespaceResponse;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeactivateNamespaceResponse;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeactivateNamespaceResponse;

  static equals(a: DeactivateNamespaceResponse | PlainMessage<DeactivateNamespaceResponse> | undefined, b: DeactivateNamespaceResponse | PlainMessage<DeactivateNamespaceResponse> | undefined): boolean;
}

