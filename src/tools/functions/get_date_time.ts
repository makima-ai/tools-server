import { Elysia } from "elysia";

async function get_date_time() {
  return { response: new Date().toLocaleString() };
}

export const details = {
  summary: "get_date_time",
  description: "Get the current date & time",
  endpoint: "http://localhost:8888/tools/get_date_time",
  method: "get",
  // if the method is get, the parameters will be sent as query parameters from makima
  params: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "Timezone",
        default: "Asia/Kolkata",
      },
    },
  },
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
