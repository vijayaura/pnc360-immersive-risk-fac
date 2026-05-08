
# Email-Based Document Ingestion via Gmail

## Overview

Connect your Gmail account using the built-in Gmail connector (no Google Console setup needed). A polling mechanism will check for new emails matching insurance submission patterns, extract the content (subject, body, attachments info), run it through GPT-5 Mini for parsing, and automatically create a new submission in the system.

## How It Works

1. **Gmail Connection** — Link your Gmail account via the connector (one-click OAuth, no developer console needed)
2. **Email Polling** — A server function checks your inbox for unread emails matching submission criteria (e.g. subject contains "submission", "risk", "quote", or specific keywords)
3. **AI Parsing** — Email body + attachment names are sent to GPT-5 Mini to extract property details, risk data, and insights
4. **Submission Creation** — A new property/submission is created in the system with all extracted data
5. **Email Marking** — Processed emails are marked as read to avoid re-processing

## Architecture

```text
Gmail Inbox → Polling Server Function → GPT-5 Mini Parser → New Submission
     ↑                                                            ↓
  Mark read                                              Appears in /submissions
```

## Implementation Steps

### 1. Connect Gmail
Use the Gmail connector to link your account. Requires `gmail.readonly` and `gmail.modify` scopes (readonly to fetch emails, modify to mark as read).

### 2. Create Email Ingestion Server Functions
- `src/server/email-ingestion.functions.ts` — Two server functions:
  - **`checkInboxForSubmissions`** — Polls Gmail via connector gateway for unread emails matching submission patterns (configurable subject keywords). Returns list of candidate emails with subject, body, sender, date.
  - **`processEmailSubmission`** — Takes an email's content, runs it through GPT-5 Mini to extract property details (name, type, location, risk factors, documents mentioned), then adds the new submission to the mock properties data.

### 3. Create Email Ingestion UI
- `src/components/irv/email-ingestion-panel.tsx` — A panel (accessible from the Submissions page) showing:
  - "Check Inbox" button to trigger polling
  - List of detected submission emails with preview
  - "Process" button per email to create the submission
  - Status indicators (processing, created, error)

### 4. Update Submissions Page
- Add an "Email Ingestion" button/section to `src/routes/submissions.tsx` that opens the ingestion panel

## Technical Details

- **Gmail API calls** go through `https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages`
- **Authentication**: `LOVABLE_API_KEY` + `GOOGLE_MAIL_API_KEY` headers (auto-provided by connector)
- **Email matching**: Configurable keywords in subject line (default: "submission", "risk survey", "quote request", "insurance", "underwriting")
- **No cron/auto-poll**: Manual "Check Inbox" trigger to keep it simple and controllable
- **Data flow**: Since submissions are currently mock data, new submissions will be added to the in-memory array (persists for the session). Database persistence can be added later.

## Scopes Required
- `gmail.readonly` — Read emails
- `gmail.modify` — Mark processed emails as read
