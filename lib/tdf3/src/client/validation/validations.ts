import {
  ATTR_ATTRIBUTE_PATTERN,
  ATTR_NAME,
  ATTR_NAME_PROP_NAME,
  ATTR_VALUE,
  ATTR_VALUE_PROP_NAME,
} from './patterns';
import { AttributeValidationError } from '../../errors';
import { AttributeObject } from '../../models/attribute-set';

const attributeValidation = (attr: unknown) => {
  const isObject = typeof attr === 'object';
  if (!isObject) {
    throw new AttributeValidationError(`attribute should be an object`);
  }

  const { attribute } = attr as Record<string, unknown>;
  const isString = typeof attribute === 'string';
  if (!isString) {
    throw new AttributeValidationError(`attribute prop should be a string`);
  }

  if (!attribute.match(ATTR_ATTRIBUTE_PATTERN)) {
    throw new AttributeValidationError(`attribute is in invalid format`);
  }

  const ATTR_NAME_PREFIX = `/${ATTR_NAME_PROP_NAME}/`;
  const ATTR_VALUE_PREFIX = `/${ATTR_VALUE_PROP_NAME}/`;
  // @ts-ignore
  const attrNameMatch = attribute.match(ATTR_NAME)[0];
  // @ts-ignore
  const attrValueMatch = attribute.match(ATTR_VALUE)[0];
  const attributeName = attrNameMatch.slice(ATTR_NAME_PREFIX.length);
  const attributeValue = attrValueMatch.slice(ATTR_VALUE_PREFIX.length);

  if (attributeName === attributeValue) {
    throw new AttributeValidationError(`attribute name should be unique with its value`);
  }

  return true;
};
function runAttributesValidation(attributes: unknown[]): attributes is AttributeObject[] {
  if (!Array.isArray(attributes)) {
    throw new AttributeValidationError('Attributes should be of type Array');
  }

  attributes.forEach(attributeValidation);
  return true;
}

export { runAttributesValidation };
