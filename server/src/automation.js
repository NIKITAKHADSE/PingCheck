import { nanoid } from 'nanoid';
import { mutate, readDb } from './db.js';
import { decryptSecret } from './security.js';
import { sendPrivateReply, sendPublicCommentReply, sendDirectMessage, getMessagingProfile } from './meta.js';

function render(text, contact) {
  return String(text || '')
    .replaceAll('{{first_name}}', String(contact?.name || contact?.username || 'there').replace(/^@/, '').split(' ')[0])
    .replaceAll('{{username}}', contact?.username || '');
}

export function matchesAutomation(automation, text, event = {}) {
  if (automation.trashedAt || automation.status !== 'ACTIVE' || automation.triggerType !== 'INSTAGRAM_COMMENT') return false;

  const configuredAccount = String(automation.instagramAccountId || '').trim();
  if (configuredAccount) {
    const eventAccountIds = [event.accountId, event.accountDbId].map((value) => String(value || ''));
    if (!eventAccountIds.includes(configuredAccount)) return false;
  }

  const configuredMedia = String(automation.mediaId || '').trim();
  if (configuredMedia && String(event.mediaId || '') !== configuredMedia) return false;

  const scope = automation.triggerScope || 'ALL';
  if (scope === 'ADS' && event.sourceType && event.sourceType !== 'AD') return false;
  if (scope === 'ORGANIC' && event.sourceType === 'AD') return false;

  const keyword = String(automation.keyword || '').trim();
  if (!keyword) return true;
  const hay = String(text || '').toLowerCase();
  const needle = keyword.toLowerCase();
  return automation.matchType === 'EXACT' ? hay.trim() === needle : hay.includes(needle);
}

export async function handleCommentEvent(event) {
  const data = await readDb();
  const account = data.instagramAccounts.find((x) => String(x.instagramUserId) === String(event.accountId));
  if (!account) return { matched: 0, reason: 'No connected Instagram account matches this webhook account ID.' };

  let contact;
  await mutate((d) => {
    const externalId = event.senderId || `comment:${event.externalId}`;
    contact = d.contacts.find((x) => x.workspaceId === account.workspaceId && x.externalId === externalId);
    if (!contact) {
      contact = {
        id: nanoid(),
        workspaceId: account.workspaceId,
        externalId,
        name: event.senderUsername || 'Instagram Contact',
        username: event.senderUsername ? `@${event.senderUsername.replace(/^@/, '')}` : '',
        status: 'LEAD',
        tags: ['Instagram Lead'],
        source: event.adId ? `Instagram Ad ${event.adId}` : event.mediaId ? `Instagram media ${event.mediaId}` : 'Instagram Comment',
        lastInteractionAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      d.contacts.unshift(contact);
    } else {
      contact.lastInteractionAt = new Date().toISOString();
    }
    d.activity.unshift({
      id: nanoid(), workspaceId: account.workspaceId, type: 'COMMENT',
      text: `${contact.name} commented${event.adId ? ' on an ad' : ''}: ${event.text || '(no text)'}`,
      at: new Date().toISOString()
    });
  });

  const latest = await readDb();
  const matched = latest.automations.filter((a) =>
    a.workspaceId === account.workspaceId && matchesAutomation(a, event.text, { ...event, accountDbId: account.id })
  );

  // Meta private replies are one private message per comment, so execute only the first matching flow.
  const selected = matched.slice(0, 1);
  let succeeded = 0;
  let failed = 0;
  for (const automation of selected) {
    const run = {
      id: nanoid(), automationId: automation.id, contactId: contact.id,
      status: 'RUNNING', commentId: event.commentId, mediaId: event.mediaId || '',
      adId: event.adId || '', startedAt: new Date().toISOString()
    };
    await mutate((d) => d.automationRuns.unshift(run));

    try {
      const token = decryptSecret(account.tokenCiphertext);
      const publicReply = render(automation.publicReply, contact);
      let publicReplyResult = null;
      let publicReplyError = '';
      if (publicReply) {
        try {
          publicReplyResult = await sendPublicCommentReply(token, event.commentId, publicReply);
        } catch (error) {
          publicReplyError = error.message;
        }
      }

      const gated = Boolean(automation.requireFollow);
      const reply = gated
        ? [render(automation.greetingReply || 'Hi {{first_name}}! Thanks for commenting 👋', contact), render(automation.followPrompt || 'Please follow our Instagram account, then reply DONE and I’ll send the details.', contact)].filter(Boolean).join('\n\n')
        : render(automation.privateReply, contact);
      if (!reply) throw new Error('Automation has no private DM text.');
      const result = await sendPrivateReply(token, account.instagramUserId, event.commentId, reply);
      if (!gated) succeeded += 1;

      await mutate((d) => {
        const current = d.automationRuns.find((x) => x.id === run.id);
        if (current) {
          current.status = gated ? 'WAITING_FOR_FOLLOW' : 'COMPLETED';
          if (!gated) current.completedAt = new Date().toISOString();
          current.result = result;
          current.publicReplyResult = publicReplyResult;
          current.publicReplyError = publicReplyError;
        }
        const a = d.automations.find((x) => x.id === automation.id);
        if (a && !gated) {
          a.runs = Number(a.runs || 0) + 1;
          a.leads = Number(a.leads || 0) + 1;
          a.updatedAt = new Date().toISOString();
        }
        let conversation = d.conversations.find((x) => x.contactId === contact.id && x.workspaceId === account.workspaceId);
        if (!conversation) {
          conversation = {
            id: nanoid(), workspaceId: account.workspaceId, contactId: contact.id,
            status: 'OPEN', lastMessageAt: new Date().toISOString()
          };
          d.conversations.unshift(conversation);
        }
        if (gated) {
          conversation.pendingAutomationId = automation.id;
          conversation.pendingRunId = run.id;
          conversation.automationState = 'WAITING_FOR_FOLLOW';
          conversation.instagramAccountId = account.id;
        }
        conversation.lastMessageAt = new Date().toISOString();
        d.messages.push({
          id: nanoid(), conversationId: conversation.id, direction: 'IN',
          body: `Instagram comment: ${event.text}`, at: new Date().toISOString()
        });
        d.messages.push({
          id: nanoid(), conversationId: conversation.id, direction: 'OUT',
          body: reply, at: new Date().toISOString(), automated: true
        });
        d.activity.unshift({
          id: nanoid(), workspaceId: account.workspaceId, type: 'AUTOMATION',
          text: gated ? `${automation.name} requested a follow confirmation` : `${automation.name} sent a private reply`, at: new Date().toISOString()
        });
      });
    } catch (error) {
      failed += 1;
      await mutate((d) => {
        const current = d.automationRuns.find((x) => x.id === run.id);
        if (current) {
          current.status = 'FAILED';
          current.error = error.message;
          current.completedAt = new Date().toISOString();
        }
        d.activity.unshift({
          id: nanoid(), workspaceId: account.workspaceId, type: 'ERROR',
          text: `${automation.name} failed: ${error.message}`, at: new Date().toISOString()
        });
      });
    }
  }

  return {
    matched: matched.length,
    executed: selected.length,
    succeeded,
    failed,
    selectedAutomation: selected[0]?.name || null
  };
}

export async function handleMessageEvent(event) {
  const data = await readDb();
  const account = data.instagramAccounts.find((x) => String(x.instagramUserId) === String(event.accountId));
  if (!account || !event.senderId) return { handled: false, reason: 'No connected account or sender.' };
  let contact = data.contacts.find((x) => x.workspaceId === account.workspaceId && String(x.externalId) === String(event.senderId));
  let conversation = contact && data.conversations.find((x) => x.workspaceId === account.workspaceId && x.contactId === contact.id);
  await mutate((d) => {
    const timestamp = new Date().toISOString();
    if (!contact) {
      contact = { id: nanoid(), workspaceId: account.workspaceId, externalId: event.senderId, name: 'Instagram Contact', username: '', status: 'CONTACT', tags: ['Instagram'], source: 'Instagram Message', lastInteractionAt: timestamp, createdAt: timestamp };
      d.contacts.unshift(contact);
    } else contact.lastInteractionAt = timestamp;
    if (!conversation) {
      conversation = { id: nanoid(), workspaceId: account.workspaceId, contactId: contact.id, status: 'OPEN', instagramAccountId: account.id, lastMessageAt: timestamp };
      d.conversations.unshift(conversation);
    }
    conversation.lastMessageAt = timestamp;
    d.messages.push({ id: nanoid(), conversationId: conversation.id, direction: 'IN', body: event.text || 'Instagram message', externalId: event.externalId, at: timestamp });
  });

  const current = (await readDb()).conversations.find((x) => x.id === conversation.id);
  if (!current?.pendingAutomationId || current.automationState !== 'WAITING_FOR_FOLLOW') return { handled: true, continued: false };
  const latest = await readDb();
  const automation = latest.automations.find((x) => x.id === current.pendingAutomationId && x.workspaceId === account.workspaceId);
  if (!automation) return { handled: true, continued: false };

  const token = decryptSecret(account.tokenCiphertext);
  let follows = false;
  let verificationAvailable = true;
  try {
    const profile = await getMessagingProfile(token, event.senderId);
    follows = profile.is_user_follow_business === true;
    verificationAvailable = Object.hasOwn(profile, 'is_user_follow_business');
  } catch {
    verificationAvailable = false;
  }

  const responseText = follows
    ? render(automation.privateReply, contact)
    : verificationAvailable
      ? render(automation.notFollowingReply || 'I can’t confirm the follow yet. Please follow the account, wait a moment, then reply DONE again.', contact)
      : render(automation.verificationUnavailableReply || 'I couldn’t verify the follow status right now. Please wait a moment and reply DONE to check again.', contact);
  const result = await sendDirectMessage(token, account.instagramUserId, event.senderId, responseText);
  await mutate((d) => {
    const c = d.conversations.find((x) => x.id === current.id);
    if (!c) return;
    c.lastMessageAt = new Date().toISOString();
    d.messages.push({ id: nanoid(), conversationId: c.id, direction: 'OUT', body: responseText, at: new Date().toISOString(), automated: true });
    if (follows) {
      c.automationState = 'COMPLETED'; c.pendingAutomationId = ''; c.pendingRunId = '';
      const run = d.automationRuns.find((x) => x.id === current.pendingRunId);
      if (run) { run.status = 'COMPLETED'; run.completedAt = new Date().toISOString(); run.result = result; }
      const a = d.automations.find((x) => x.id === automation.id);
      if (a) { a.runs = Number(a.runs || 0) + 1; a.leads = Number(a.leads || 0) + 1; a.updatedAt = new Date().toISOString(); }
      d.activity.unshift({ id: nanoid(), workspaceId: account.workspaceId, type: 'AUTOMATION', text: `${automation.name} verified the follow and sent the details`, at: new Date().toISOString() });
    }
  });
  return { handled: true, continued: true, follows, verificationAvailable };
}
