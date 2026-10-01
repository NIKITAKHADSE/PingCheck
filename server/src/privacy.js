const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function privacyPage(email = '') {
  const contact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy Policy | PingCheck</title>
<style>body{margin:0;background:#f5f7f5;color:#173039;font:16px/1.75 system-ui,sans-serif}main{max-width:800px;margin:48px auto;padding:40px;background:white;border:1px solid #dde5e1;border-radius:16px}h1{font-size:36px;line-height:1.2}h2{font-size:21px;margin-top:30px}a{color:#087968}.brand{font-weight:800;font-size:22px}.note{padding:16px;background:#fff4d9;border-radius:8px}footer{border-top:1px solid #dde5e1;margin-top:32px;padding-top:16px;color:#63747a}@media(max-width:600px){main{margin:12px;padding:24px}h1{font-size:30px}}</style></head>
<body><main><div class="brand">PingCheck</div><h1>Privacy Policy</h1><p>Last updated: September 5, 2026</p>
${!contact ? '<p class="note"><strong>Draft — contact details pending.</strong> The operator must provide a privacy contact before using this policy for public launch or app review.</p>' : ''}
<p>This policy describes data handling in this PingCheck installation, an application for connecting Instagram Professional accounts and managing comment-to-message automations.</p>
<h2>Information processed</h2>
<p>PingCheck stores account registration information, including names, email addresses, password hashes, login sessions and workspace membership. If Google sign-in is used, it also stores Google account identifiers and profile details returned during sign-in.</p>
<p>When an Instagram account is connected, PingCheck stores its account ID, username, profile information, access token and connection status. It processes received webhook notifications, which can include commenter or sender identifiers, usernames, comments, message content, post identifiers and event timestamps. Automation rules, reply text, contacts, conversation records and processing results are also stored.</p>
<h2>How information is used</h2>
<p>Information is used to authenticate users, manage workspaces, connect authorized Instagram accounts, match incoming comments to automation rules, send configured replies, display activity and troubleshoot delivery failures. Workspace members may access data available through the workspace.</p>
<h2>Service providers and optional AI</h2>
<p>Instagram connections and replies involve Meta services. Google receives sign-in requests when Google sign-in is selected. Hosting and network providers process traffic required to operate the application; this development installation may use Cloudflare Tunnel to make its local backend publicly reachable.</p>
<p>If the optional AI assistant is configured and used, the application sends the question, recent chat history and a limited workspace summary to OpenAI. The summary includes automation names, status and counts. This integration does not include contact details, inbox messages, knowledge sources or integration tokens in that summary. Information you include in a question is sent with the question. AI requests ask OpenAI not to store the generated response; provider processing is governed by its own terms and policies.</p>
<h2>Storage and security</h2>
<p>This installation stores application records in a JSON database on the operator's server. Passwords are stored as salted hashes. Instagram access tokens are encrypted when the server's token encryption key is configured. Login tokens and display preferences are stored in browser local storage. AI chat history is held in page memory. No security measure eliminates all risk.</p>
<h2>Retention</h2>
<p>Application records remain stored until removed through available controls or by the operator; automatic retention limits are not currently implemented. External providers may retain their own records under their policies. Deployment logs or operator-created backups may require separate handling when a deletion request is received.</p>
<h2>Your choices and deletion requests</h2>
<p>You can disconnect Instagram through Integrations. Disconnecting removes the local connection and stored token, but does not automatically erase previously collected contacts, messages or webhook records. You can also remove the app's access through Instagram's settings.</p>
<p>The owner of a single-member workspace can use Settings → General → Delete Account to delete their PingCheck login and the workspace's local records. This does not delete the Instagram account itself. For other deletion requests, including requests from people who commented or sent a message, contact the operator with your Instagram username and the business account you interacted with. Do not send passwords or access tokens.</p>
<h2>Contact</h2>
${contact ? `<p>For privacy questions or data-deletion requests, email <a href="mailto:${escapeHtml(contact)}">${escapeHtml(contact)}</a>.</p>` : '<p>A privacy contact email has not yet been provided by the operator.</p>'}
<h2>Changes</h2><p>The operator may update this policy as the application changes. The latest version and update date will be published on this page.</p>
<footer>PingCheck · Privacy and data handling</footer></main></body></html>`;
}
