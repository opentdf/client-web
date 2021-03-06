import { runAttributesValidation } from './validations';
import { AttributeValidationError, IllegalArgumentError } from '../../errors';
// @ts-ignore
const AttributeValidator = (attributes) => {
  try {
    runAttributesValidation(attributes);
  } catch (err) {
    if (err instanceof AttributeValidationError) {
      throw new IllegalArgumentError(err.message);
    } else {
      throw err;
    }
  }
};

export { AttributeValidator };
