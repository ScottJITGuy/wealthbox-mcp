#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { WealthboxClient } from "./wealthboxClient.js";

async function main() {
  const config = loadConfig();
  const client = new WealthboxClient(config);

  const withDefaultPage = (query?: Record<string, unknown>) => {
    const q: Record<string, unknown> = { ...(query || {}) };
    if (q.page === undefined) q.page = 1;
    if (q.per_page === undefined) q.per_page = 25;
    return q;
  };

  const server = new Server(
    {
      name: "wealthbox-mcp",
      version: "1.0.0",
      description: "Read-only MCP server for the Wealthbox CRM API (Keel Point)",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ── Read-only tools ────────────────────────────────────────────────
  const tools = [
    // Health & basics
    {
      name: "wealthbox.health",
      description: "Health check — verifies token and connectivity via /v1/me",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "wealthbox.getMe",
      description: "Retrieve login profile information for the authenticated user",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "wealthbox.listUsers",
      description: "List all users accessible to the authenticated account",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "wealthbox.listTeams",
      description: "List all teams in the authenticated account",
      inputSchema: { type: "object" as const, properties: {} },
    },

    // Contacts (read-only)
    {
      name: "wealthbox.contacts.list",
      description: "List contacts. Query params: name, email, phone, contact_type, id, active, tags[], type (person|household|organization|trust), order (asc|desc|recent|created|updated), updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              contact_type: { type: "string", description: "Client, Past Client, Prospect, Vendor, Organization" },
              id: { type: "number" },
              active: { type: "boolean" },
              tags: { type: "array", items: { type: "string" } },
              type: { type: "string", enum: ["person", "household", "organization", "trust"] },
              order: { type: "string", enum: ["asc", "desc", "recent", "created", "updated"] },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.contacts.get",
      description: "Get a single contact by id. Returns full contact record including addresses, emails, phones, tags, custom fields, financial info, and household membership.",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },

    // Tasks (read-only)
    {
      name: "wealthbox.tasks.list",
      description: "List tasks. Query params: resource_id, resource_type, assigned_to, assigned_to_team, created_by, completed (boolean), task_type (all|parents|subtasks), updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              resource_id: { type: "number" },
              resource_type: { type: "string" },
              assigned_to: { type: "number", description: "User ID" },
              assigned_to_team: { type: "number", description: "Team ID" },
              created_by: { type: "number" },
              completed: { type: "boolean" },
              task_type: { type: "string", enum: ["all", "parents", "subtasks"] },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.tasks.get",
      description: "Get task by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },

    // Events (read-only)
    {
      name: "wealthbox.events.list",
      description: "List events. Query params: title, category_id, starts_after, starts_before, ends_after, ends_before, updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              title: { type: "string" },
              category_id: { type: "number" },
              starts_after: { type: "string" },
              starts_before: { type: "string" },
              ends_after: { type: "string" },
              ends_before: { type: "string" },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.events.get",
      description: "Get event by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },

    // Notes (read-only)
    {
      name: "wealthbox.notes.list",
      description: "List notes. Query params: updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.notes.get",
      description: "Get note by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },

    // Opportunities (read-only)
    {
      name: "wealthbox.opportunities.list",
      description: "List opportunities. Query params: name, pipeline_id, stage_id, amount_min, amount_max, close_after, close_before, updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              name: { type: "string" },
              pipeline_id: { type: "number" },
              stage_id: { type: "number" },
              amount_min: { type: "number" },
              amount_max: { type: "number" },
              close_after: { type: "string" },
              close_before: { type: "string" },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.opportunities.get",
      description: "Get opportunity by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },

    // Projects (read-only)
    {
      name: "wealthbox.projects.list",
      description: "List projects. Query params: name, status, due_after, due_before, updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              name: { type: "string" },
              status: { type: "string" },
              due_after: { type: "string" },
              due_before: { type: "string" },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.projects.get",
      description: "Get project by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },

    // Comments (read-only)
    {
      name: "wealthbox.comments.list",
      description: "List comments. Query params: resource_id, resource_type, updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          resource_id: { type: "number" },
          resource_type: { type: "string" },
          updated_since: { type: "string" },
          updated_before: { type: "string" },
          page: { type: "number" },
          per_page: { type: "number" },
        },
      },
    },

    // Activity Stream (read-only)
    {
      name: "wealthbox.activityStream.list",
      description: "Retrieve activity stream. Query params: contact (contact ID), cursor (for pagination), type (Contact|Task|Event|Opportunity|etc.), updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              contact: { type: "number", description: "Filter by contact ID" },
              cursor: { type: "string", description: "Cursor for pagination" },
              type: { type: "string", description: "Filter by type: Contact, Task, Event, Opportunity, etc." },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },

    // Metadata (all read-only by nature)
    {
      name: "wealthbox.userGroups.list",
      description: "List user groups",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "wealthbox.categories.list",
      description: "List members of a customizable category. Type must be one of: tags, custom_fields, opportunity_stages, opportunity_pipelines, contact_types, contact_sources, task_categories, event_categories, file_categories, investment_objectives, financial_account_types, email_types, phone_types, address_types, website_types, contact_roles.",
      inputSchema: {
        type: "object" as const,
        properties: {
          type: {
            type: "string",
            enum: [
              "tags", "custom_fields", "opportunity_stages", "opportunity_pipelines",
              "contact_types", "contact_sources", "task_categories", "event_categories",
              "file_categories", "investment_objectives", "financial_account_types",
              "email_types", "phone_types", "address_types", "website_types", "contact_roles",
            ],
          },
        },
        required: ["type"],
      },
    },
    {
      name: "wealthbox.tags.list",
      description: "List tags, optionally filtered by document_type (Contact or Note)",
      inputSchema: {
        type: "object" as const,
        properties: {
          document_type: { type: "string", enum: ["Contact", "Note"] },
        },
      },
    },
    {
      name: "wealthbox.customFields.list",
      description: "List all custom field definitions",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "wealthbox.contactRoles.list",
      description: "List all contact role definitions",
      inputSchema: { type: "object" as const, properties: {} },
    },

    // Workflows (read-only — no create/delete/step mutations)
    {
      name: "wealthbox.workflows.list",
      description: "List workflows. Query params: status (active|completed|scheduled), resource_id, resource_type, updated_since, updated_before, page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["active", "completed", "scheduled"] },
              resource_id: { type: "number" },
              resource_type: { type: "string" },
              updated_since: { type: "string" },
              updated_before: { type: "string" },
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.workflows.get",
      description: "Get workflow by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },
    {
      name: "wealthbox.workflowTemplates.list",
      description: "List workflow templates. Query params: page, per_page.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "object",
            properties: {
              page: { type: "number" },
              per_page: { type: "number" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: "wealthbox.workflowTemplates.get",
      description: "Get workflow template by id",
      inputSchema: { type: "object" as const, properties: { id: { type: "number" } }, required: ["id"] },
    },
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // ── Tool handlers (GET-only) ───────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;
    const json = (data: unknown) => ({
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    });

    switch (name) {
      // Health & basics
      case "wealthbox.health": {
        const data = await client.get("/v1/me");
        return { content: [
          { type: "text" as const, text: "ok" },
          { type: "text" as const, text: JSON.stringify({ ok: true, me: data }, null, 2) },
        ]};
      }
      case "wealthbox.getMe":
        return json(await client.get("/v1/me"));
      case "wealthbox.listUsers":
        return json(await client.get("/v1/users"));
      case "wealthbox.listTeams":
        return json(await client.get("/v1/teams"));

      // Contacts
      case "wealthbox.contacts.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/contacts", withDefaultPage(query) as any));
      }
      case "wealthbox.contacts.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/contacts/${id}`));
      }

      // Tasks
      case "wealthbox.tasks.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/tasks", withDefaultPage(query) as any));
      }
      case "wealthbox.tasks.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/tasks/${id}`));
      }

      // Events
      case "wealthbox.events.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/events", withDefaultPage(query) as any));
      }
      case "wealthbox.events.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/events/${id}`));
      }

      // Notes
      case "wealthbox.notes.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/notes", withDefaultPage(query) as any));
      }
      case "wealthbox.notes.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/notes/${id}`));
      }

      // Opportunities
      case "wealthbox.opportunities.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/opportunities", withDefaultPage(query) as any));
      }
      case "wealthbox.opportunities.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/opportunities/${id}`));
      }

      // Projects
      case "wealthbox.projects.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/projects", withDefaultPage(query) as any));
      }
      case "wealthbox.projects.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/projects/${id}`));
      }

      // Comments
      case "wealthbox.comments.list": {
        const { resource_id, resource_type, updated_since, updated_before, page, per_page } = (args || {}) as any;
        const query: any = withDefaultPage({ page, per_page });
        if (resource_id !== undefined) query.resource_id = resource_id;
        if (resource_type) query.resource_type = resource_type;
        if (updated_since) query.updated_since = updated_since;
        if (updated_before) query.updated_before = updated_before;
        return json(await client.get("/v1/comments", query));
      }

      // Activity Stream
      case "wealthbox.activityStream.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/activity_stream", withDefaultPage(query) as any));
      }

      // Metadata
      case "wealthbox.userGroups.list":
        return json(await client.get("/v1/user_groups"));
      case "wealthbox.categories.list": {
        const { type } = args as { type: string };
        return json(await client.get(`/v1/categories/${encodeURIComponent(type)}`));
      }
      case "wealthbox.tags.list": {
        const { document_type } = (args || {}) as { document_type?: string };
        return json(await client.get("/v1/tags", document_type ? { document_type } as any : undefined));
      }
      case "wealthbox.customFields.list":
        return json(await client.get("/v1/custom_fields"));
      case "wealthbox.contactRoles.list":
        return json(await client.get("/v1/contact_roles"));

      // Workflows
      case "wealthbox.workflows.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/workflows", withDefaultPage(query) as any));
      }
      case "wealthbox.workflows.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/workflows/${id}`));
      }
      case "wealthbox.workflowTemplates.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        return json(await client.get("/v1/workflow_templates", withDefaultPage(query) as any));
      }
      case "wealthbox.workflowTemplates.get": {
        const { id } = args as { id: number };
        return json(await client.get(`/v1/workflow_templates/${id}`));
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting wealthbox-mcp:", err);
  process.exit(1);
});
