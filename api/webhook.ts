// Vercel serverless function (Node runtime)
// Receives Linear webhooks and triggers GitHub repository_dispatch

import type { VercelRequest, VercelResponse } from "@vercel/node";

// Optional: very light validation that it's an issue-created event.
// (If you implement signature verification, do it here before processing.)
function isIssueCreated(req: VercelRequest) {
  // Linear sends a generic "Issues" event type; you can also gate by payload content.
  const body: any = req.body || {};
  const entity = body?.type || body?.event?.type || ""; // tolerate different shapes
  const action = body?.action || body?.event?.action || "";
  // Many setups just rely on selecting "Issues" in the Linear webhook UI and proceed:
  return true; // keep simple; tighten if you want
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!isIssueCreated(req)) return res.status(200).send("Ignored");

  // Pull issue details from Linear payload. Shape can vary slightly; handle common fields.
  const data: any = req.body?.data || req.body?.issue || req.body || {};
  const issueId =
    data.identifier ||
    data.number ||
    data.id ||
    "ISSUE";
  const issueTitle =
    data.title ||
    data.name ||
    "New Linear Issue";
  const issueUrl =
    data.url ||
    data.webUrl ||
    (data.identifier ? `https://linear.app/issue/${data.identifier}` : "");

  // Environment variables
  const GH_OWNER = process.env.GH_OWNER!;
  const GH_REPO  = process.env.GH_REPO!;
  const GH_TOKEN = process.env.GH_TOKEN!; // PAT or GitHub App token with repo write

  if (!GH_OWNER || !GH_REPO || !GH_TOKEN) {
    return res.status(500).send("Missing GH_OWNER/GH_REPO/GH_TOKEN env vars");
  }

  // Fire repository_dispatch to your repo; your GitHub Action will do the rest.
  const dispatchResp = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "linear_issue_created",
        client_payload: { issueId, issueTitle, issueUrl },
      }),
    }
  );

  if (!dispatchResp.ok) {
    const text = await dispatchResp.text();
    return res.status(502).send(`GitHub dispatch failed: ${dispatchResp.status} ${text}`);
  }

  return res.status(202).send("Dispatch accepted");
}
