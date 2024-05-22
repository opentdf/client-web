// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=ts"
// @generated from file kas/kas.proto (package kas, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import {
  InfoRequest,
  InfoResponse,
  LegacyPublicKeyRequest,
  PublicKeyRequest,
  PublicKeyResponse,
  RewrapRequest,
  RewrapResponse,
} from './kas_pb.js';
import { MethodKind, StringValue } from '@bufbuild/protobuf';

/**
 * Get app info from the root path
 *
 * @generated from service kas.AccessService
 */
export const AccessService = {
  typeName: 'kas.AccessService',
  methods: {
    /**
     * Get the current version of the service
     *
     * @generated from rpc kas.AccessService.Info
     */
    info: {
      name: 'Info',
      I: InfoRequest,
      O: InfoResponse,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc kas.AccessService.PublicKey
     */
    publicKey: {
      name: 'PublicKey',
      I: PublicKeyRequest,
      O: PublicKeyResponse,
      kind: MethodKind.Unary,
    },
    /**
     * buf:lint:ignore RPC_RESPONSE_STANDARD_NAME
     *
     * @generated from rpc kas.AccessService.LegacyPublicKey
     */
    legacyPublicKey: {
      name: 'LegacyPublicKey',
      I: LegacyPublicKeyRequest,
      O: StringValue,
      kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc kas.AccessService.Rewrap
     */
    rewrap: {
      name: 'Rewrap',
      I: RewrapRequest,
      O: RewrapResponse,
      kind: MethodKind.Unary,
    },
  },
} as const;