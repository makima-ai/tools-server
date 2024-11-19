import { Elysia } from "elysia";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.MAKIMA_BASEURL || "http://localhost:7777";
const TOOLS_API_URL = `${BASE_URL}/tool`; // The correct endpoint for tool operations

async function setupRemoteTool(toolDetails: {
  name: string;
  description: string;
  endpoint: string;
  method: string;
  params?: {
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
}): Promise<void> {
  console.log(`Setting up tool: ${toolDetails.name}`);

  try {
    // Check if the tool exists
    const response = await fetch(`${TOOLS_API_URL}/${toolDetails.name}`);

    if (response.ok) {
      const existingTool = await response.json();

      // Check if any properties have changed
      const hasChanges =
        existingTool.description !== toolDetails.description ||
        existingTool.method !== toolDetails.method ||
        JSON.stringify(existingTool.params) !==
        JSON.stringify(toolDetails.params) ||
        existingTool.endpoint !== toolDetails.endpoint;

      if (hasChanges) {
        // Update the tool if there are changes
        const updateResponse = await fetch(
          `${TOOLS_API_URL}/${toolDetails.name}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toolDetails),
          },
        );

        if (!updateResponse.ok) {
          console.log(updateResponse);
          throw new Error(`Failed to update tool: ${toolDetails.name}`);
        }
        console.log(`Updated tool: ${toolDetails.name}`);
      } else {
        console.log(`Tool ${toolDetails.name} is already up-to-date.`);
      }
    } else if (response.status === 404) {
      // Tool does not exist, create it
      console.log(`Tool ${toolDetails.name} not found. Creating new tool...`);
      const createResponse = await fetch(`${TOOLS_API_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toolDetails),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create tool: ${toolDetails.name}`);
      }
      console.log(`Registered tool: ${toolDetails.name}`);
    } else {
      throw new Error(
        `Unexpected response when checking tool: ${toolDetails.name} - Status: ${response.status}`,
      );
    }
  } catch (error) {
    console.error(
      `Failed to set up tool: ${toolDetails.name}`,
      toolDetails,
      error,
    );
  }
}

export async function setupRemoteTools() {
  const toolsApp = new Elysia({ prefix: "/tools" });
  const functionsDir = path.join(__dirname, "functions");
  const files = fs.readdirSync(functionsDir);

  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

    const module = await import(path.join(functionsDir, file));

    if (!module.details) {
      console.warn(`No 'details' export found in ${file}. Skipping...`);
      continue;
    }

    const details = module.details;
    const fileName = path.parse(file).name;

    const toolDetails = {
      name: details.summary ?? fileName,
      description: details.description ?? "No description provided",
      endpoint: details.endpoint ?? `${BASE_URL}/tools/${fileName}`,
      method: details.method ?? "POST",
      params: details.params ?? {},
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
    await setupRemoteTool(toolDetails);
  }

  console.log(
    "Registered remote tools:",
    files.map((file) => path.parse(file).name),
  );

  return toolsApp;
}
