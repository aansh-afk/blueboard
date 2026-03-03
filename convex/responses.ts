import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const answerValue = v.union(v.string(), v.number(), v.array(v.string()), v.null());

export const submitResponse = mutation({
  args: {
    clientName: v.string(),
    contactRole: v.string(),
    contactInfo: v.string(),
    answers: v.record(v.string(), answerValue),
  },
  returns: v.id("responses"),
  handler: async (ctx, args) => {
    const submittedAt = Date.now();
    return await ctx.db.insert("responses", {
      clientName: args.clientName,
      contactRole: args.contactRole,
      contactInfo: args.contactInfo,
      answers: args.answers,
      submittedAt,
    });
  },
});

export const listResponses = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("responses"),
      _creationTime: v.number(),
      clientName: v.string(),
      contactRole: v.string(),
      contactInfo: v.string(),
      submittedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("responses").withIndex("by_submittedAt").order("desc").collect();
    return rows.map((row) => ({
      _id: row._id,
      _creationTime: row._creationTime,
      clientName: row.clientName,
      contactRole: row.contactRole,
      contactInfo: row.contactInfo,
      submittedAt: row.submittedAt,
    }));
  },
});

export const getResponse = query({
  args: { responseId: v.id("responses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("responses"),
      _creationTime: v.number(),
      clientName: v.string(),
      contactRole: v.string(),
      contactInfo: v.string(),
      submittedAt: v.number(),
      answers: v.record(v.string(), answerValue),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.responseId);
    if (!row) {
      return null;
    }
    return row;
  },
});
