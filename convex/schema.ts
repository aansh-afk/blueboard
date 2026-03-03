import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const answerValue = v.union(v.string(), v.number(), v.array(v.string()), v.null());

export default defineSchema({
  responses: defineTable({
    clientName: v.string(),
    contactRole: v.string(),
    contactInfo: v.string(),
    answers: v.record(v.string(), answerValue),
    submittedAt: v.number(),
  })
    .index("by_submittedAt", ["submittedAt"])
    .index("by_clientName", ["clientName"]),
});
