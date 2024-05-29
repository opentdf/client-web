// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=js+dts,import_extension=none"
// @generated from file policy/subjectmapping/subject_mapping.proto (package policy.subjectmapping, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { CreateSubjectConditionSetRequest, CreateSubjectConditionSetResponse, CreateSubjectMappingRequest, CreateSubjectMappingResponse, DeleteSubjectConditionSetRequest, DeleteSubjectConditionSetResponse, DeleteSubjectMappingRequest, DeleteSubjectMappingResponse, GetSubjectConditionSetRequest, GetSubjectConditionSetResponse, GetSubjectMappingRequest, GetSubjectMappingResponse, ListSubjectConditionSetsRequest, ListSubjectConditionSetsResponse, ListSubjectMappingsRequest, ListSubjectMappingsResponse, MatchSubjectMappingsRequest, MatchSubjectMappingsResponse, UpdateSubjectConditionSetRequest, UpdateSubjectConditionSetResponse, UpdateSubjectMappingRequest, UpdateSubjectMappingResponse } from "./subject_mapping_pb";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * @generated from service policy.subjectmapping.SubjectMappingService
 */
export declare const SubjectMappingService: {
  readonly typeName: "policy.subjectmapping.SubjectMappingService",
  readonly methods: {
    /**
     * Find matching Subject Mappings for a given Subject
     *
     * @generated from rpc policy.subjectmapping.SubjectMappingService.MatchSubjectMappings
     */
    readonly matchSubjectMappings: {
      readonly name: "MatchSubjectMappings",
      readonly I: typeof MatchSubjectMappingsRequest,
      readonly O: typeof MatchSubjectMappingsResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.ListSubjectMappings
     */
    readonly listSubjectMappings: {
      readonly name: "ListSubjectMappings",
      readonly I: typeof ListSubjectMappingsRequest,
      readonly O: typeof ListSubjectMappingsResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.GetSubjectMapping
     */
    readonly getSubjectMapping: {
      readonly name: "GetSubjectMapping",
      readonly I: typeof GetSubjectMappingRequest,
      readonly O: typeof GetSubjectMappingResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.CreateSubjectMapping
     */
    readonly createSubjectMapping: {
      readonly name: "CreateSubjectMapping",
      readonly I: typeof CreateSubjectMappingRequest,
      readonly O: typeof CreateSubjectMappingResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.UpdateSubjectMapping
     */
    readonly updateSubjectMapping: {
      readonly name: "UpdateSubjectMapping",
      readonly I: typeof UpdateSubjectMappingRequest,
      readonly O: typeof UpdateSubjectMappingResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.DeleteSubjectMapping
     */
    readonly deleteSubjectMapping: {
      readonly name: "DeleteSubjectMapping",
      readonly I: typeof DeleteSubjectMappingRequest,
      readonly O: typeof DeleteSubjectMappingResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.ListSubjectConditionSets
     */
    readonly listSubjectConditionSets: {
      readonly name: "ListSubjectConditionSets",
      readonly I: typeof ListSubjectConditionSetsRequest,
      readonly O: typeof ListSubjectConditionSetsResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.GetSubjectConditionSet
     */
    readonly getSubjectConditionSet: {
      readonly name: "GetSubjectConditionSet",
      readonly I: typeof GetSubjectConditionSetRequest,
      readonly O: typeof GetSubjectConditionSetResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.CreateSubjectConditionSet
     */
    readonly createSubjectConditionSet: {
      readonly name: "CreateSubjectConditionSet",
      readonly I: typeof CreateSubjectConditionSetRequest,
      readonly O: typeof CreateSubjectConditionSetResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.UpdateSubjectConditionSet
     */
    readonly updateSubjectConditionSet: {
      readonly name: "UpdateSubjectConditionSet",
      readonly I: typeof UpdateSubjectConditionSetRequest,
      readonly O: typeof UpdateSubjectConditionSetResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc policy.subjectmapping.SubjectMappingService.DeleteSubjectConditionSet
     */
    readonly deleteSubjectConditionSet: {
      readonly name: "DeleteSubjectConditionSet",
      readonly I: typeof DeleteSubjectConditionSetRequest,
      readonly O: typeof DeleteSubjectConditionSetResponse,
      readonly kind: MethodKind.Unary,
    },
  }
};

