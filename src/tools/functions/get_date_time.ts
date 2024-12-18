import { Elysia, t } from "elysia";

async function get_date_time() {
  return { response: new Date().toLocaleString() };
}

const params = t.Object({
  timezone: t.String(),
});

export const details = {
  summary: "get_date_time",
  description: "Get the current date & time",
  endpoint: "http://localhost:8888/tools/get_date_time",
  method: "get",
  params: params,
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
      body: t.Object({
        payload: params,
        context: t.Object({
          platform: t.String(),
          latestMessage: t.Object({
            content: t.Union(
              [
                t.String({ minLength: 1 }),
                t.Array(
                  t.Object({
                    url: t.String({ minLength: 1 }),
                    type: t.Union([t.Literal("image"), t.Literal("audio")]),
                    detail: t.Optional(
                      t.Union([
                        t.Literal("auto"),
                        t.Literal("low"),
                        t.Literal("high"),
                      ]),
                    ),
                    format: t.Optional(
                      t.Union([t.Literal("wav"), t.Literal("mp3")]),
                    ),
                  }),
                ),
              ],
              {
                default: "",
              },
            ),
            attachments: t.Optional(
              t.Array(
                t.Object({
                  type: t.String(),
                  data: t.Union([t.String(), t.Any()]),
                }),
              ),
            ),
          }),
          name: t.String(),
          role: t.String(),
          authorId: t.String(),
        }),
      }),
      detail: {
        summary: details.summary,
        description: details.description,
        tags: ["Tools"],
      },
    },
  );
}
