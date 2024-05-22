// @generated by protoc-gen-es v1.9.0 with parameter "target=ts"
// @generated from file common/common.proto (package common, syntax proto3)
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
import { Message, proto3, Timestamp } from '@bufbuild/protobuf';

/**
 * @generated from enum common.MetadataUpdateEnum
 */
export enum MetadataUpdateEnum {
  /**
   * unspecified update type
   *
   * @generated from enum value: METADATA_UPDATE_ENUM_UNSPECIFIED = 0;
   */
  UNSPECIFIED = 0,

  /**
   * only update the fields that are provided
   *
   * @generated from enum value: METADATA_UPDATE_ENUM_EXTEND = 1;
   */
  EXTEND = 1,

  /**
   * replace the entire metadata with the provided metadata
   *
   * @generated from enum value: METADATA_UPDATE_ENUM_REPLACE = 2;
   */
  REPLACE = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(MetadataUpdateEnum)
proto3.util.setEnumType(MetadataUpdateEnum, 'common.MetadataUpdateEnum', [
  { no: 0, name: 'METADATA_UPDATE_ENUM_UNSPECIFIED' },
  { no: 1, name: 'METADATA_UPDATE_ENUM_EXTEND' },
  { no: 2, name: 'METADATA_UPDATE_ENUM_REPLACE' },
]);

/**
 * buflint ENUM_VALUE_PREFIX: to make sure that C++ scoping rules aren't violated when users add new enum values to an enum in a given package
 *
 * @generated from enum common.ActiveStateEnum
 */
export enum ActiveStateEnum {
  /**
   * @generated from enum value: ACTIVE_STATE_ENUM_UNSPECIFIED = 0;
   */
  UNSPECIFIED = 0,

  /**
   * @generated from enum value: ACTIVE_STATE_ENUM_ACTIVE = 1;
   */
  ACTIVE = 1,

  /**
   * @generated from enum value: ACTIVE_STATE_ENUM_INACTIVE = 2;
   */
  INACTIVE = 2,

  /**
   * @generated from enum value: ACTIVE_STATE_ENUM_ANY = 3;
   */
  ANY = 3,
}
// Retrieve enum metadata with: proto3.getEnumType(ActiveStateEnum)
proto3.util.setEnumType(ActiveStateEnum, 'common.ActiveStateEnum', [
  { no: 0, name: 'ACTIVE_STATE_ENUM_UNSPECIFIED' },
  { no: 1, name: 'ACTIVE_STATE_ENUM_ACTIVE' },
  { no: 2, name: 'ACTIVE_STATE_ENUM_INACTIVE' },
  { no: 3, name: 'ACTIVE_STATE_ENUM_ANY' },
]);

/**
 * Struct to uniquely identify a resource with optional additional metadata
 *
 * @generated from message common.Metadata
 */
export class Metadata extends Message<Metadata> {
  /**
   * created_at set by server (entity who created will recorded in an audit event)
   *
   * @generated from field: google.protobuf.Timestamp created_at = 1;
   */
  createdAt?: Timestamp;

  /**
   * updated_at set by server (entity who updated will recorded in an audit event)
   *
   * @generated from field: google.protobuf.Timestamp updated_at = 2;
   */
  updatedAt?: Timestamp;

  /**
   * optional short description
   *
   * @generated from field: map<string, string> labels = 3;
   */
  labels: { [key: string]: string } = {};

  constructor(data?: PartialMessage<Metadata>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'common.Metadata';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: 'created_at', kind: 'message', T: Timestamp },
    { no: 2, name: 'updated_at', kind: 'message', T: Timestamp },
    {
      no: 3,
      name: 'labels',
      kind: 'map',
      K: 9 /* ScalarType.STRING */,
      V: { kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata {
    return new Metadata().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata {
    return new Metadata().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata {
    return new Metadata().fromJsonString(jsonString, options);
  }

  static equals(
    a: Metadata | PlainMessage<Metadata> | undefined,
    b: Metadata | PlainMessage<Metadata> | undefined
  ): boolean {
    return proto3.util.equals(Metadata, a, b);
  }
}

/**
 * @generated from message common.MetadataMutable
 */
export class MetadataMutable extends Message<MetadataMutable> {
  /**
   * optional labels
   *
   * @generated from field: map<string, string> labels = 3;
   */
  labels: { [key: string]: string } = {};

  constructor(data?: PartialMessage<MetadataMutable>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = 'common.MetadataMutable';
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    {
      no: 3,
      name: 'labels',
      kind: 'map',
      K: 9 /* ScalarType.STRING */,
      V: { kind: 'scalar', T: 9 /* ScalarType.STRING */ },
    },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MetadataMutable {
    return new MetadataMutable().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MetadataMutable {
    return new MetadataMutable().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MetadataMutable {
    return new MetadataMutable().fromJsonString(jsonString, options);
  }

  static equals(
    a: MetadataMutable | PlainMessage<MetadataMutable> | undefined,
    b: MetadataMutable | PlainMessage<MetadataMutable> | undefined
  ): boolean {
    return proto3.util.equals(MetadataMutable, a, b);
  }
}