export type SupportTopic = {
  id: string;
  category: string;
  title: string;
  description: string;
  updatedAt: string;
};

export type FAQEntry = {
  id: string;
  supportTopicId: string;
  question: string;
  answer: string;
  updatedAt: string;
};

export const initialSupportTopics: SupportTopic[] = [
  {
    id: 'support-onboarding',
    category: 'Onboarding',
    title: 'Getting Started With Tenant Setup',
    updatedAt: 'Apr 13, 2026',
    description: `
      <h2>Launch checklist</h2>
      <p>Use this topic to document how super admins provision new environments, assign ownership, and verify readiness before inviting the first team.</p>
      <ul>
        <li>Confirm environment name, region, and branding inputs.</li>
        <li>Assign the primary market administrator and fallback approver.</li>
        <li>Validate email templates, master data, and authority matrix defaults.</li>
      </ul>
      <h3>Suggested verification table</h3>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Owner</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Environment creation</td>
            <td>Platform Ops</td>
            <td>Ready</td>
          </tr>
          <tr>
            <td>Authority matrix</td>
            <td>Security Admin</td>
            <td>Needs review</td>
          </tr>
          <tr>
            <td>FAQ publishing</td>
            <td>Support Lead</td>
            <td>Ready</td>
          </tr>
        </tbody>
      </table>
      <blockquote>Tip: keep one support topic per admin workflow so the sidebar stays easy to scan.</blockquote>
    `,
  },
  {
    id: 'support-escalations',
    category: 'Operations',
    title: 'Escalation Policy And SLA Matrix',
    updatedAt: 'Apr 12, 2026',
    description: `
      <h2>Response expectations</h2>
      <p>Define the severity framework used by support and platform teams. This content is rich text, so it can include callouts, lists, and embedded media for playbooks.</p>
      <h3>Severity bands</h3>
      <ol>
        <li><strong>Critical:</strong> portal outage, blocked quoting, or payment failure.</li>
        <li><strong>High:</strong> degraded but partially operational flows.</li>
        <li><strong>Medium:</strong> localized issue with a workaround.</li>
        <li><strong>Low:</strong> cosmetic defects or documentation updates.</li>
      </ol>
      <p style="text-align:center"><strong>Internal target:</strong> acknowledge critical requests within 15 minutes.</p>
    `,
  },
  {
    id: 'support-release-notes',
    category: 'Communications',
    title: 'Release Communications Template',
    updatedAt: 'Apr 10, 2026',
    description: `
      <h2>Release notice structure</h2>
      <p>Share what changed, who is affected, and what action is needed. Add screenshots or videos directly in the editor when you want a more guided handoff.</p>
      <h3>Recommended sections</h3>
      <ul>
        <li>What’s new</li>
        <li>Portal impact by user type</li>
        <li>Validation steps after deployment</li>
        <li>Support contact and escalation path</li>
      </ul>
      <p><em>This prototype keeps all content in local component state only.</em></p>
    `,
  },
];

export const initialFaqs: FAQEntry[] = [
  {
    id: 'faq-reset-password',
    supportTopicId: 'support-onboarding',
    question: 'How do I reset a portal user password?',
    updatedAt: 'Apr 13, 2026',
    answer: `
      <p>Open the user management screen for the relevant portal, select the user, and choose <strong>Reset Password</strong>. In a live build this would trigger a secure email flow, but in this prototype it is represented as a documented process.</p>
      <ul>
        <li>Verify the user is in the correct tenant.</li>
        <li>Confirm their email address is active.</li>
        <li>Ask them to sign in again after the reset email is received.</li>
      </ul>
    `,
  },
  {
    id: 'faq-roles',
    supportTopicId: 'support-escalations',
    question: 'Which portal roles can manage FAQs and support content?',
    updatedAt: 'Apr 12, 2026',
    answer: `
      <p>Only Super Admin manages support topics and FAQ publishing in this prototype. Market Admin, Underwriter, and Distributor portals receive the published FAQ view as read-only content.</p>
      <p style="background-color:#dbeafe">This makes cross-portal messaging consistent without duplicating content ownership.</p>
    `,
  },
  {
    id: 'faq-media',
    supportTopicId: 'support-release-notes',
    question: 'Can support articles include screenshots, tables, and videos?',
    updatedAt: 'Apr 10, 2026',
    answer: `
      <p>Yes. The editor supports mock image uploads, URL-based video embeds, headings, tables, alignment, lists, colors, and inline formatting.</p>
      <table>
        <thead>
          <tr>
            <th>Content type</th>
            <th>Supported</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Images</td>
            <td>Mock upload</td>
          </tr>
          <tr>
            <td>Videos</td>
            <td>URL embed</td>
          </tr>
          <tr>
            <td>Tables</td>
            <td>Create and edit</td>
          </tr>
        </tbody>
      </table>
    `,
  },
];
