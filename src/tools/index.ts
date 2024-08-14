import { Elysia } from "elysia";
import fs from "fs";

const BASE_URL = process.env.MAKIMA_BASEURL || "http://localhost:7777";

async function setupRemoteTool(tool: {
  name: string;
  description: string;
  endpoint: string;
  method: string;
  parameters?: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        default?: any;
      }
    >;
    required?: string[];
  };
}) {
  const token = process.env.MAKIMA_KEY;

  if (!token) {
    console.error("MAKIMA_KEY is not set in the environment variables.");
    return;
  }

  if (tool.parameters) {
    if (!tool.parameters.type) {
      throw new Error(
        `The 'type' property is required in the parameters schema.`,
      );
    }

    for (const key in tool.parameters.properties) {
      if (!tool.parameters.properties[key].type) {
        throw new Error(
          `Parameter ${key} is missing a required 'type' property in properties.`,
        );
      }
    }
  } else {
    tool.parameters = {
      type: "object",
      properties: {}, // Ensure parameters is an object if not provided
    };
  }

  try {
    // Check if the tool already exists
    const response = await fetch(`${BASE_URL}/tools?name=${tool.name}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const existingTool = await response.json();

      // Check if any properties have changed
      const hasChanges =
        existingTool.description !== tool.description ||
        existingTool.method !== tool.method ||
        JSON.stringify(existingTool.parameters) !==
        JSON.stringify(tool.parameters) ||
        existingTool.endpoint !== tool.endpoint;

      if (hasChanges) {
        // Update the tool if there are changes
        const updateResponse = await fetch(`${BASE_URL}/tools`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tool),
        });

        if (!updateResponse.ok) {
          throw new Error(
            `Failed to update tool: ${tool.name}, ${await updateResponse.text()}`,
          );
        }

        console.log(`Updated tool: ${tool.name}`);
      } else {
        console.log(`Tool ${tool.name} is already up-to-date.`);
      }
    } else if (response.status === 404) {
      // Register the tool if it doesn't exist
      const registerResponse = await fetch(`${BASE_URL}/tools`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tool),
      });

      if (!registerResponse.ok) {
        throw new Error(
          `Failed to register tool: ${tool.name}, ${await registerResponse.text()}`,
        );
      }

      console.log(`Registered tool: ${tool.name}`);
    } else {
      throw new Error(
        `Failed to check if tool exists: ${tool.name}, ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error(`Failed to set up tool: ${tool.name}`, error);
  }
}

export async function setupRemoteTools() {
  const toolsApp = new Elysia({ prefix: "/tools" });
  const files = fs.readdirSync(__dirname + "/functions");

  for (const file of files) {
    const module = await import(`./functions/${file}`);

    // Check if the module has a 'details' export
    if (!module.details) {
      console.warn(`No 'details' export found in ${file}. Skipping...`);
      continue;
    }

    const details = module.details;

    const tool = {
      name: details?.summary ?? file.replace(".ts", ""),
      description: details?.description ?? "No description provided",
      endpoint:
        details?.endpoint ??
        `http://localhost:${process.env.PORT ?? 8888}/tools/${file.replace(".ts", "")}`, // Assuming the route's endpoint follows this pattern
      method: details?.method ?? "post", // Default to POST
      parameters: details?.parameters ?? {}, // Default to an empty object if not provided
      type: details?.type ?? "api",
    };

    // Register the route with the Elysia app
    if (typeof module.default === "function") {
      module.default(toolsApp);
    } else {
      console.warn(
        `No default function found in ${file}. Skipping route registration...`,
      );
    }

    // Register or update the tool via API
    await setupRemoteTool(tool);
  }

  console.log(
    "Registered remote tools:",
    files.map((file) => file.replace(".js", "")),
  );

  return toolsApp;
}
