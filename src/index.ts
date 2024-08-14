import { Elysia } from "elysia";
import { setupRemoteTools } from "./tools";
import swagger from "@elysiajs/swagger";

const app = new Elysia();

app.use(setupRemoteTools());
app.use(
  swagger({
    autoDarkMode: true,
    scalarConfig: {
      customCss: `body {background:var(--scalar-background-2);}`,
    },

    documentation: {
      info: {
        title: "Tools Server",
        version: `v0.0.0`,
        contact: {
          name: "Raj Sharma",
          email: "r@raj.how",
        },
      },
      tags: [
        {
          name: "Tools",
          description: `Tools as api routes, to be called by the makima control server`,
        },
      ],
    },
  }),
);

app
  .get("/", () => "Makima tools server running")
  .listen(process.env.PORTl || 8888);

console.log(
  `Makima Tools server running at ${app.server?.hostname}:${app.server?.port}`,
);
