import { Schema, model } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    members: {
      type: [String],
      required: true,
      default: [],
    },
    groupType: {
      type: String,
      enum: ["one-on-one", "pre-booking", "group-lesson", "live-course"],
      default: "pre-booking",
    },
  },
  { timestamps: true }
);

// Index to quickly find groups by member and sort by recent activity
groupSchema.index({ members: 1 });

export default model("Group", groupSchema);
