import Joi from "joi";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Common validation middleware logic
 */
const validateMiddleware = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate =
      source === "query"
        ? req.query
        : source === "params"
          ? req.params
          : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // Update the request with validated/stripped values
    if (source === "query") {
      req.query = value;
    } else if (source === "params") {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

export const validate = validateMiddleware;
export default validateMiddleware;
