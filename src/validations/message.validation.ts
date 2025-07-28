import Joi from "joi";

export const privateApiMessageValidation = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
});

export const groupApiMessageValidation = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
});

export const privateSocketMessageValidation = Joi.object({
  to: Joi.string().required(),
  content: Joi.string().min(1).max(1000).required(),
});

export const groupSocketMessageValidation = Joi.object({
  groupId: Joi.string().required(),
  content: Joi.string().min(1).max(1000).required(),
});
