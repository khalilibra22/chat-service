import Joi from "joi";

export const createUserValidation = Joi.object({
  userId: Joi.string().trim().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  fullname: Joi.string().trim().min(1).max(150).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 1 character",
    "string.max": "Full name must not exceed 150 characters",
    "any.required": "Full name is required",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  profileImage: Joi.string().trim().optional().messages({
    "string.uri": "Profile image must be a valid URL",
  }),
});
