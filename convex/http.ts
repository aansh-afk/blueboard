import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

http.route({
  path: "/api/submit",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = (await req.json()) as {
      clientName?: string;
      contactRole?: string;
      contactInfo?: string;
      answers?: Record<string, string | number | Array<string> | null>;
    };

    const id = await ctx.runMutation(api.responses.submitResponse, {
      clientName: body.clientName ?? "",
      contactRole: body.contactRole ?? "",
      contactInfo: body.contactInfo ?? "",
      answers: body.answers ?? {},
    });

    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/responses",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const responses = await ctx.runQuery(api.responses.listResponses, {});
    return new Response(JSON.stringify(responses), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/response",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const response = await ctx.runQuery(api.responses.getResponse, {
      responseId: id as Id<"responses">,
    });

    if (!response) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/submit",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

http.route({
  path: "/api/responses",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

http.route({
  path: "/api/response",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

export default http;
