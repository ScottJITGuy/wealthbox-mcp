## wealthbox-mcp (Keel Point — Read-Only Fork)

A **read-only** Model Context Protocol (MCP) server for the Wealthbox CRM API. Forked from [rhyeal/wealthbox-mcp](https://github.com/rhyeal/wealthbox-mcp) and stripped to GET-only operations for safe use with client-confidential data.

- Wealthbox API docs: https://dev.wealthbox.com/
- Original project: https://github.com/rhyeal/wealthbox-mcp

### What Changed from Upstream

- **All write operations removed** — no create, update, or delete tools
- **Generic `wealthbox.request` escape hatch removed** — prevents arbitrary API calls
- **`WealthboxClient` hardened** — only exposes a `get()` method; POST/PUT/PATCH/DELETE are not available at the code level
- **Household mutations removed** — no add/remove member
- **Workflow step mutations removed** — no complete/revert
- **Default page size increased** to 25 (matches Wealthbox API default)

### Requirements

- Node.js 18+
- A Wealthbox API Access Token (per-user)

### Configuration

Provide your Wealthbox token via environment variable or a local file:

- `WEALTHBOX_TOKEN` (required): your Wealthbox API access token
- `WEALTHBOX_API_BASE_URL` (optional): defaults to `https://api.crmworkspace.com`
- Optional file fallback: `wealthbox_key.txt` or `.secrets/wealthbox_key.txt`

### Using with Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "wealthbox": {
      "command": "npx",
      "args": ["-y", "wealthbox-mcp"],
      "env": {
        "WEALTHBOX_TOKEN": "YOUR_API_TOKEN"
      }
    }
  }
}
```

### Read-Only Tools (24 total)

**Health & Basics**
- `wealthbox.health` — Verify token and connectivity
- `wealthbox.getMe` — Authenticated user profile
- `wealthbox.listUsers` — All users in the account
- `wealthbox.listTeams` — All teams

**Contacts**
- `wealthbox.contacts.list` — Search/filter contacts
- `wealthbox.contacts.get` — Get contact by ID

**Tasks**
- `wealthbox.tasks.list` — Search/filter tasks
- `wealthbox.tasks.get` — Get task by ID

**Events**
- `wealthbox.events.list` — Search/filter events
- `wealthbox.events.get` — Get event by ID

**Notes**
- `wealthbox.notes.list` — Search/filter notes
- `wealthbox.notes.get` — Get note by ID

**Opportunities**
- `wealthbox.opportunities.list` — Search/filter opportunities
- `wealthbox.opportunities.get` — Get opportunity by ID

**Projects**
- `wealthbox.projects.list` — Search/filter projects
- `wealthbox.projects.get` — Get project by ID

**Comments & Activity**
- `wealthbox.comments.list` — List comments by resource
- `wealthbox.activityStream.list` — Activity stream with cursor pagination

**Metadata**
- `wealthbox.userGroups.list` — User groups
- `wealthbox.categories.list` — Customizable categories (16 types)
- `wealthbox.tags.list` — Tags (by document type)
- `wealthbox.customFields.list` — Custom field definitions
- `wealthbox.contactRoles.list` — Contact role definitions

**Workflows**
- `wealthbox.workflows.list` — List workflows
- `wealthbox.workflows.get` — Get workflow by ID
- `wealthbox.workflowTemplates.list` — List workflow templates
- `wealthbox.workflowTemplates.get` — Get template by ID

### Security

- **Read-only by design** — the HTTP client only supports GET requests
- **Per-user tokens** — each user authenticates with their own Wealthbox access token
- Do not commit tokens to version control
- Token is loaded from `WEALTHBOX_TOKEN` env var or a local key file (gitignored)

### Development

```bash
npm install
npm run build
WEALTHBOX_TOKEN=$(cat wealthbox_key.txt) npm start
```

### License

MIT
