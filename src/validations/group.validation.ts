import Joi from "joi";

export const createGroupValidation = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "string.empty": "Group name is required",
    "string.min": "Group name must be at least 1 character",
    "string.max": "Group name must not exceed 100 characters",
    "any.required": "Group name is required"
  }),
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required"
  }),
  members: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Members must be an array of user IDs"
  }),
  groupType: Joi.string().valid("one-on-one", "pre-booking", "group-lesson", "live-course").optional().messages({
    "any.only": "Group type must be one of: one-on-one, pre-booking, group-lesson, live-course"
  })
});

