# Build a Complete ManyChat-Like Instagram Automation SaaS

Build a production-quality, modern SaaS web application inspired by the workflow and usability of ManyChat, but with completely original branding, UI, components, and code.

The application is an **Instagram-first conversational automation platform** that allows businesses, creators, agencies, and marketers to connect their Instagram Business/Creator account, automatically respond to comments and DMs, create visual automation workflows, manage contacts, handle conversations, generate leads, and analyze automation performance.

Do NOT copy ManyChat's branding, logo, exact UI, colors, proprietary assets, or source code. Use ManyChat only as a functional/product reference.

---

# 1. Product Goal

The core product promise is:

**Turn Instagram interactions into automated conversations, leads, and customers.**

Primary workflow:

Instagram Comment
→ Trigger
→ Public Comment Reply
→ Private DM
→ Button / Question
→ Lead Capture
→ Tag / Custom Field
→ Follow-up
→ Conversion

The application should feel like a premium modern SaaS product.

Target users:

- Content creators
- Influencers
- E-commerce businesses
- Digital marketing agencies
- Coaches
- Consultants
- Small businesses
- SaaS companies
- Sales teams

---

# 2. Product Name

Use a temporary product name:

**FlowVik**

Make the branding easy to replace later.

Brand personality:

- Premium
- Modern
- Intelligent
- Minimal
- Fast
- Professional
- Automation-focused

Do not use ManyChat branding anywhere in the application.

---

# 3. Technology Stack

Use:

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- React Flow for the automation builder
- TanStack Query
- React Hook Form
- Zod

Backend:

- Next.js API routes or a clean Node.js/TypeScript backend
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ for background jobs

Authentication:

- Clerk or another production-ready authentication system

Storage:

- S3-compatible storage for media/files

Charts:

- Recharts

Payments:

- Razorpay-ready architecture
- Stripe-ready architecture if needed later

Integrations:

- Meta Graph API architecture
- Instagram Messaging API
- Instagram Webhooks

AI:

- OpenAI-compatible service abstraction
- Keep AI provider configurable through environment variables

Deployment-ready for:

- Vercel frontend
- Railway / Render / AWS backend
- PostgreSQL
- Redis

---

# 4. Important Development Rule

Do not build a static mockup.

The application must be structured as a real SaaS application.

Implement:

- Real routing
- Real state management
- Real database models
- Real API architecture
- Authentication
- Workspace system
- CRUD operations
- Automation persistence
- Contact persistence
- Conversation persistence
- Webhook architecture
- Background job architecture
- Analytics calculations
- Error handling
- Loading states
- Empty states
- Responsive UI

Where external Meta credentials are unavailable, create a clean mock/sandbox integration layer so the application can still be demonstrated.

Clearly separate:

1. Mock/demo integration
2. Real Meta integration

---

# 5. Application Layout

Create a persistent SaaS dashboard layout.

Desktop:

Left sidebar
\+
Top navigation
\+
Main content

Mobile:

Responsive drawer navigation
\+
Mobile-friendly content

Sidebar:

```
FlowVik

Overview

AUTOMATION
  Automations
  Templates

ENGAGEMENT
  Inbox
  Contacts
  Campaigns

INSIGHTS
  Analytics

AI
  AI Assistant
  Knowledge Base

SYSTEM
  Integrations
  Team
  Settings

```

At the bottom:

Workspace selector

User profile

Plan/usage indicator

---

# 6. Login / Authentication

Create:

- Login
- Sign up
- Forgot password
- Email verification
- OAuth-ready architecture
- Protected dashboard routes

After registration:

Show onboarding.

---

# 7. Onboarding

Create a multi-step onboarding wizard.

Step 1:

```
Welcome to FlowVik 👋

Turn Instagram conversations into leads automatically.

```

Step 2:

Choose business type:

- Creator
- E-commerce
- Agency
- Coach
- Consultant
- Local Business
- SaaS
- Other

Step 3:

Connect Instagram.

Show:

```
Connect Instagram

Connect your Instagram Business or Creator account
to start automating comments and messages.

[ Connect Instagram ]

```

Step 4:

Choose primary goal:

- Generate leads
- Sell products
- Grow followers
- Answer questions
- Send links
- Automate customer support

Step 5:

Create first automation.

Offer templates.

---

# 8. Dashboard / Overview

Create a premium analytics dashboard.

Header:

```
Good morning 👋

Here's what's happening with your automations.

```

Primary CTA:

```
+ Create Automation

```

Stats cards:

```
Messages
2,482
+18.4%

New Contacts
482
+12.7%

Leads
127
+21.3%

Conversions
38
+8.6%

```

Additional sections:

### Automation Performance

Show:

- Automation name
- Runs
- Messages
- Leads
- Conversion rate
- Status

### Conversation Funnel

```
Instagram interactions
        ↓
DM conversations
        ↓
Engaged users
        ↓
Leads
        ↓
Customers

```

### Recent Activity

Show:

- New Instagram comment
- Automation triggered
- DM sent
- New contact
- Lead created
- Conversation assigned

### Quick Actions

Cards:

```
Comment → DM
Welcome New Followers
Collect Leads
Send Product Link
Build AI FAQ Bot

```

---

# 9. Automation List

Route:

```
/dashboard/automations

```

Create a professional automation management page.

Header:

```
Automations

Create, manage and monitor your Instagram automations.

[ + Create Automation ]

```

Tabs:

- All
- Active
- Draft
- Paused

Search.

Filters:

- Channel
- Trigger
- Status
- Created date

Automation card/table:

```
Automation
Status
Trigger
Runs
Leads
Conversion
Last updated

```

Actions:

- Open
- Duplicate
- Rename
- Pause
- Activate
- Delete

---

# 10. Create Automation

When clicking:

```
+ Create Automation

```

Show two options.

### Simple Automation

```
Choose what you want to accomplish:

[ Send a link when someone comments ]

[ Welcome new followers ]

[ Collect leads ]

[ Answer FAQs ]

[ Send product information ]

[ Create from scratch ]

```

### Advanced Automation

Open visual flow builder.

---

# 11. Automation Flow Builder

This is the most important screen.

Use React Flow.

Layout:

Top toolbar:

```
← Back

Automation Name

Draft

[ Test ] [ Save ] [ Publish ]

```

Canvas:

Infinite zoomable canvas.

Controls:

- Zoom in
- Zoom out
- Fit view
- Undo
- Redo
- Minimap

Right-side node library:

```
TRIGGERS

Instagram Comment
Instagram DM
Story Reply
Keyword
New Follower
Webhook
Schedule


MESSAGES

Text
Image
Video
Audio
File
Carousel
Buttons
Quick Replies


LOGIC

Condition
If / Else
Randomizer
Wait
Smart Delay


ACTIONS

Add Tag
Remove Tag
Set Custom Field
Send Webhook
Assign Team Member
Start Automation
Stop Automation

```

---

# 12. Flow Builder Nodes

Create reusable node components.

Every node should contain:

- Icon
- Node type
- Title
- Description
- Input handle
- Output handle(s)
- Status
- Configuration preview

Example:

```
┌───────────────────────────────┐
│ ⚡ Trigger                    │
│ Instagram Comment             │
│                               │
│ Keyword: "PRICE"              │
└───────────────●───────────────┘

```

Message:

```
┌───────────────────────────────┐
│ 💬 Message                   │
│                               │
│ Hey {{first_name}} 👋         │
│ Thanks for your comment!      │
│                               │
│ [ Get Price ]                 │
└───────────────●───────────────┘

```

Condition:

```
┌───────────────────────────────┐
│ ◇ Condition                  │
│                               │
│ Has tag = Interested          │
│                               │
│ YES ●                  ● NO   │
└───────────────────────────────┘

```

---

# 13. Node Configuration Panel

When selecting a node, open a right-side configuration panel.

Example:

## Instagram Comment Trigger

Fields:

```
Instagram Account
[ Select Account ]

Post
[ Select Post ]

Trigger type
( ) Any comment
( ) Keyword
( ) Multiple keywords

Keywords
[ price, cost, details ]

Match:
( ) Exact
( ) Contains

```

---

# 14. Message Node

Create rich message editor.

Support:

- Text
- Emojis
- Variables
- Buttons
- Quick replies
- Images
- Videos
- Files
- URLs

Variables:

```
{{first_name}}
{{username}}
{{email}}
{{phone}}
{{product}}

```

Add variable selector.

Example:

```
Hey {{first_name}} 👋

Thanks for your interest!

Click below to get the details.

[ Get Details ]

```

---

# 15. Condition Node

Support:

```
Contact field
Tag
Custom field
Message content
Button click
Previous action
Date/time

```

Operators:

```
equals
does not equal
contains
does not contain
exists
does not exist
greater than
less than

```

Allow multiple conditions:

```
ALL conditions
ANY conditions

```

---

# 16. Delay Node

Support:

```
Wait 5 minutes
Wait 2 hours
Wait 1 day
Wait until specific time

```

Show human-readable configuration.

---

# 17. Comment → DM Template

Create a complete ready-to-use template.

Example:

```
Trigger:
Instagram Comment

Keyword:
GUIDE

Public Reply:
"Sent you a DM! 🚀"

Private DM:
"Hey {{first_name}} 👋

Thanks for commenting!

Here's your free guide."

Button:
[ Download Guide ]

Action:
Add Tag = Guide Lead

```

Users should be able to activate this template with one click.

---

# 18. Inbox

Route:

```
/dashboard/inbox

```

Create a three-column inbox.

Left:

Conversation list.

Center:

Chat.

Right:

Contact information.

Conversation list:

```
Search conversations

All
Unread
Assigned to me
Instagram

```

Each conversation:

```
Profile photo
Name
Last message
Time
Unread badge
Channel icon

```

Chat area:

Support:

- Text
- Emoji
- Image
- File
- Quick replies

Show automation events inside chat:

```
⚡ Automation triggered

Comment → DM

Message sent automatically

```

---

# 19. Contact Profile

Right sidebar:

```
Rahul Sharma

@rahul123

Instagram

Status:
Lead

Tags:
[Interested]
[Product]
[Hot Lead]

Custom Fields

Email
rahul@gmail.com

Phone
+91 XXXXXXXX

Source
Instagram Reel

Activity
────────────

Commented on Reel
Automation triggered
Clicked button
Received DM

```

Actions:

```
Add Tag
Edit Contact
Assign
Block
Delete

```

---

# 20. Contacts CRM

Route:

```
/dashboard/contacts

```

Create:

- Search
- Filters
- Sorting
- Pagination
- Bulk actions

Columns:

```
Name
Username
Channel
Tags
Status
Last interaction
Created

```

Filters:

- Tag
- Channel
- Status
- Automation
- Date
- Custom fields

Bulk actions:

- Add tag
- Remove tag
- Export
- Delete

---

# 21. Contact Custom Fields

Allow workspace owners to create:

```
Text
Number
Email
Phone
Date
Boolean
Dropdown

```

Examples:

```
Company
Budget
Product
Lead Source
Purchase Status
Location

```

---

# 22. Tags

Create tag management.

Example:

```
Hot Lead
Interested
Customer
VIP
Product A
Product B
Instagram Lead

```

Allow:

- Create
- Rename
- Delete
- Assign
- Remove

---

# 23. Campaigns / Broadcasts

Route:

```
/dashboard/campaigns

```

Create campaign flow:

```
Campaign name
        ↓
Audience
        ↓
Message
        ↓
Schedule
        ↓
Review
        ↓
Send

```

Audience filters:

```
Tag
Channel
Custom field
Last active
Automation

```

Show warning before sending.

---

# 24. Templates

Create template marketplace-style interface.

Categories:

```
Lead Generation
Sales
Customer Support
Engagement
Freebies
E-commerce
Influencer
Welcome
FAQ

```

Template card:

```
Comment → Free Guide

Instagram

⭐ Beginner friendly

[ Preview ]

[ Use Template ]

```

---

# 25. Analytics

Route:

```
/dashboard/analytics

```

Create:

### Overview

Metrics:

- Total conversations
- Messages sent
- Contacts
- Leads
- Conversions
- Conversion rate

### Automation analytics

Charts:

- Runs over time
- Leads over time
- Conversion rate
- Message engagement

### Funnel

```
Comments
10,240

↓

DMs
9,821

↓

Engaged
8,921

↓

Leads
1,230

↓

Customers
238

```

### Top Automations

Show ranking by:

- Runs
- Leads
- Conversion

Add date filter:

```
Today
7 days
30 days
90 days
Custom

```

---

# 26. AI Assistant

Create:

```
/dashboard/ai

```

Main interface:

```
AI Automation Assistant

Tell AI what you want to automate.

Example:

"When someone comments PRICE on my Reel,
send them my pricing link and add them as
a potential customer."

[ Generate Automation ]

```

AI should generate:

```
Trigger
↓
Condition
↓
Message
↓
Button
↓
Tag

```

Allow user to review before publishing.

---

# 27. AI Knowledge Base

Allow users to upload:

- Website URL
- PDF
- Documents
- FAQs
- Product information
- Text

Create:

```
Knowledge Sources

Website
Products
FAQs
Documents

```

AI should use this information when responding.

---

# 28. Integrations

Route:

```
/dashboard/integrations

```

Cards:

```
Instagram
Connected

Facebook
Connect

WhatsApp
Connect

Google Sheets
Connect

Webhook
Configure

Zapier
Connect

Shopify
Connect

```

For Instagram:

```
Connected account

@brandname

Business account

[ Disconnect ]

```

---

# 29. Instagram Integration Architecture

Create a proper Meta integration layer.

Support:

- OAuth
- Account connection
- Access token storage
- Token refresh handling
- Webhook subscription
- Incoming comments
- Incoming messages
- Story events where supported
- Sending messages
- Sending replies

Do not hardcode access tokens.

Use environment variables.

Example:

```
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI
META_VERIFY_TOKEN

```

Create:

```
/api/integrations/meta/connect
/api/integrations/meta/callback
/api/webhooks/instagram
/api/instagram/messages
/api/instagram/comments

```

---

# 30. Webhook Architecture

Incoming event:

```
Instagram
    ↓
Webhook
    ↓
Validate signature
    ↓
Normalize event
    ↓
Find workspace
    ↓
Find contact
    ↓
Find matching automation
    ↓
Queue automation
    ↓
Automation Worker
    ↓
Execute nodes

```

Use BullMQ/Redis for asynchronous processing.

Never execute complex automation directly inside the webhook request.

---

# 31. Automation Engine

Create a reusable workflow engine.

Data structure:

```
Automation
 ├── Trigger
 ├── Nodes
 └── Edges

```

Each automation run:

```
PENDING
↓
RUNNING
↓
WAITING
↓
RUNNING
↓
COMPLETED

```

Handle:

- Errors
- Retries
- Timeouts
- Paused automation
- Deleted automation
- Contact unsubscribed
- Rate limits

Log every execution.

---

# 32. Automation Logs

Create debugging screen:

```
Automation Run #18382

Contact:
Rahul Sharma

Status:
Completed

Timeline:

18:20:01
Trigger received

18:20:02
Keyword matched: PRICE

18:20:03
Message sent

18:20:08
Button clicked

18:20:09
Tag added: Hot Lead

18:20:10
Automation completed

```

This is extremely important for debugging.

---

# 33. Settings

Create:

### Workspace

- Workspace name
- Logo
- Timezone
- Currency

### Team

- Members
- Roles
- Invitations

Roles:

```
Owner
Admin
Manager
Agent
Viewer

```

### Notifications

- Email
- Browser
- New lead
- Failed automation

### Billing

Show:

```
Current Plan
Usage
Contacts
Messages
AI usage
Team members

```

---

# 34. Subscription Architecture

Create plans:

### Free

```
1 Instagram account
500 contacts
1,000 automation actions
Basic templates

```

### Pro

```
3 Instagram accounts
10,000 contacts
50,000 actions
Advanced automation
Analytics
AI

```

### Agency

```
Unlimited workspaces
Multiple accounts
Team members
Advanced analytics
White-label ready

```

Make all limits configurable in the database.

Do not hardcode plan restrictions throughout the frontend.

Create a central usage/entitlement service.

---

# 35. Database Schema

Use Prisma.

Create models for:

```
User
Workspace
WorkspaceMember

Channel
InstagramAccount

Contact
ContactTag
Tag
CustomField
CustomFieldValue

Conversation
Message

Automation
AutomationNode
AutomationEdge
AutomationRun
AutomationLog

Campaign
CampaignRecipient

Template

WebhookEvent

Integration

KnowledgeSource
KnowledgeDocument

Subscription
UsageRecord

Notification

```

Use proper indexes and foreign keys.

Important indexes:

```
workspace_id
contact_id
automation_id
conversation_id
created_at
status

```

---

# 36. API Structure

Create clean REST APIs.

Example:

```
GET    /api/workspaces
POST   /api/workspaces

GET    /api/automations
POST   /api/automations
GET    /api/automations/:id
PUT    /api/automations/:id
DELETE /api/automations/:id
POST   /api/automations/:id/publish
POST   /api/automations/:id/test

GET    /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
DELETE /api/contacts/:id

GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations/:id/messages

GET    /api/analytics

GET    /api/templates

POST   /api/integrations/instagram/connect
DELETE /api/integrations/instagram/:id

POST   /api/webhooks/instagram

```

Use Zod validation.

---

# 37. Security

Implement:

- Authentication
- Authorization
- Workspace isolation
- Role-based permissions
- API validation
- Rate limiting
- Webhook signature validation
- Secure token encryption
- CSRF protection where applicable
- XSS protection
- Input sanitization
- Secure file uploads

Never expose:

```
META_APP_SECRET
access tokens
database credentials
AI API keys

```

to the frontend.

---

# 38. UX Requirements

The UI must be:

- Clean
- Premium
- Responsive
- Fast
- Accessible
- Consistent

Use:

- 8px spacing system
- Rounded cards
- Subtle borders
- Soft shadows
- Clear typography
- Excellent empty states
- Skeleton loading
- Toast notifications
- Confirmation dialogs
- Tooltips

Avoid:

- Excessive gradients
- Overly colorful UI
- Huge unnecessary cards
- Cluttered dashboards
- Excessive animations

---

# 39. Responsive Design

Desktop:

```
Sidebar 240px
Main content flexible

```

Tablet:

Collapse sidebar.

Mobile:

Use:

```
Bottom navigation or drawer

```

Flow builder on mobile:

Show a simplified node editor rather than trying to squeeze the entire canvas onto the screen.

---

# 40. Loading / Error / Empty States

Every page must have:

Loading state

Empty state

Error state

Success state

Example:

```
No automations yet

Create your first Instagram automation
and start converting comments into conversations.

[ Create Automation ]

```

---

# 41. Demo Mode

Because real Meta API credentials may not exist during development, create:

```
Demo Workspace

```

with:

- Demo Instagram account
- Demo contacts
- Demo conversations
- Demo automations
- Demo analytics
- Demo messages

Allow the entire product to be explored without connecting Instagram.

Clearly label demo data.

---

# 42. Seed Data

Create realistic demo data.

Example contacts:

```
Rahul Sharma
Priya Patel
Amit Joshi
Sneha More
Arjun Shah

```

Demo automations:

```
Comment → Free Guide
Comment → Product Price
Welcome New Followers
FAQ Assistant
Lead Collection

```

Demo analytics should look realistic.

Do not use fake external brands.

---

# 43. Visual Design

Use a premium SaaS visual language.

Suggested palette:

```
Primary:
#13343C

Accent:
#DCE51D

Background:
#F7F8F3

Dark:
#09272F

Muted:
#66777B

Border:
#DCE5E2

White:
#FFFFFF

```

Typography:

Headings:

```
Sora

```

Body:

```
Manrope

```

Use:

```
Sora 600
Manrope 400
Manrope 500
Manrope 600
Manrope 700

```

Do not use the exact visual identity of ManyChat.

---

# 44. Component Architecture

Create reusable components:

```
components/
 ├── layout/
 │    ├── Sidebar
 │    ├── Header
 │    └── WorkspaceSwitcher
 │
 ├── dashboard/
 │    ├── StatCard
 │    ├── ActivityFeed
 │    ├── FunnelChart
 │    └── AutomationPerformance
 │
 ├── automation/
 │    ├── FlowCanvas
 │    ├── NodeLibrary
 │    ├── NodeConfigPanel
 │    ├── TriggerNode
 │    ├── MessageNode
 │    ├── ConditionNode
 │    ├── ActionNode
 │    └── DelayNode
 │
 ├── inbox/
 │    ├── ConversationList
 │    ├── ChatWindow
 │    ├── MessageBubble
 │    └── ContactPanel
 │
 ├── contacts/
 │    ├── ContactTable
 │    ├── ContactDetails
 │    ├── TagManager
 │    └── CustomFields
 │
 └── ui/
      ├── Button
      ├── Modal
      ├── Dropdown
      ├── Tooltip
      ├── Tabs
      ├── Badge
      └── Toast

```

---

# 45. Code Quality

Use:

- TypeScript strict mode
- ESLint
- Prettier
- Reusable hooks
- Server-side validation
- Typed API responses
- Error boundaries
- Environment variable validation

Avoid:

- `any`
- giant components
- duplicated code
- hardcoded business logic
- hardcoded plan limits
- hardcoded user IDs
- hardcoded API credentials

---

# 46. Development Order

Build in this exact sequence:

## Phase 1

Authentication

Workspace

Dashboard shell

Sidebar

Header

Database

Demo data

---

## Phase 2

Contacts

Tags

Custom fields

Inbox

Conversations

Messages

---

## Phase 3

Automation list

Automation creation

React Flow builder

Node system

Node configuration

Save/publish automation

---

## Phase 4

Automation engine

Triggers

Conditions

Actions

Delays

Background jobs

Execution logs

---

## Phase 5

Instagram integration architecture

OAuth

Webhooks

Comments

DMs

Message sending

---

## Phase 6

Templates

Campaigns

Analytics

---

## Phase 7

AI assistant

AI knowledge base

AI automation generation

---

## Phase 8

Billing

Usage tracking

Plans

Team permissions

---

# 47. Critical Requirement

The application must not be only a beautiful frontend.

Every important button should either:

1. Perform a real operation, or
2. Clearly work against demo/mock data.

For example:

```
Create Automation

```

must actually create an automation record.

```
Save

```

must persist the flow.

```
Publish

```

must change the automation status.

```
Add Contact

```

must create a contact.

```
Send Message

```

must create a message record.

```
Add Tag

```

must update the contact.

```
Test Automation

```

must execute the automation against a demo contact.

---

# 48. Final Deliverable

Deliver a complete working SaaS application with:

- Authentication
- Onboarding
- Dashboard
- Sidebar
- Workspace management
- Instagram integration architecture
- Automation builder
- Visual workflow editor
- Triggers
- Messages
- Conditions
- Actions
- Delays
- Contacts
- Tags
- Custom fields
- Inbox
- Campaigns
- Templates
- Analytics
- AI assistant
- Knowledge base
- Team management
- Settings
- Billing architecture
- Usage tracking
- Demo mode
- Seed data
- API layer
- PostgreSQL database
- Prisma
- Redis/BullMQ architecture
- Webhook architecture
- Error handling
- Responsive design

The final product should feel like a **real commercial SaaS platform**, not a template or prototype.

Prioritize:

1. Automation usability
2. Instagram workflow
3. Inbox
4. Contacts
5. Reliability
6. Clean UX
7. Scalable architecture
8. Easy future integration with WhatsApp/Facebook
9. AI-assisted automation
10. Analytics

Start by creating the project architecture, database schema, authentication, dashboard shell, and demo workspace. Then progressively implement each module in the development order above.