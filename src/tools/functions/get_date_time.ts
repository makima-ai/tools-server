import { Elysia } from "elysia";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

async function get_date_time() {
  return { response: new Date().toLocaleString() };
}

const params = z.object({
  timezone: z.string().default("Asia/Kolkata").describe("Timezone"),
});

export const details = {
  summary: "get_date_time",
  description: "Get the current date & time",
  endpoint: "http://localhost:8888/tools/get_date_time",
  method: "get",
  params: zodToJsonSchema(params),
  type: "api",
};

export default function get_date_time_route(app: Elysia) {
  app.get(
    "/get_date_time",
    async ({ body }) => {
      console.log("get_date_time being called", body);
      return await get_date_time();
    },
    {
      detail: {
        summary: details.summary,
        description: details.description,
        tags: ["Tools"],
      },
    },
  );
}
