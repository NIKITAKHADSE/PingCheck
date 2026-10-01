# Google Sign Up / Sign In Setup

FlowVik v4 includes Google Identity Services sign-up/sign-in. The React login and signup pages render Google's official button after `GOOGLE_CLIENT_ID` is configured.

## 1. Create a Google Cloud project

Open Google Cloud Console and create/select a project.

## 2. Configure Google Auth Platform branding

Configure the application name, support email and OAuth consent/branding information.

For simple sign-in, the standard OpenID/profile/email identity information is enough. You do not need Google Drive or Gmail scopes.

## 3. Create OAuth Client ID

Create a credential with:

```text
Application type: Web application
```

For local development add this Authorized JavaScript Origin:

```text
http://localhost:5173
```

When you deploy FlowVik, also add your real HTTPS frontend origin.

## 4. Copy Client ID

It looks similar to:

```text
1234567890-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

Do not paste a Google Client Secret into the frontend. FlowVik only needs the Web Client ID for this sign-in flow.

## 5. Edit FlowVik `.env`

Set:

```env
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

## 6. Restart FlowVik

Stop the running terminal with `Ctrl+C`, then run:

```powershell
npm run dev
```

or run `START_FLOWVIK.bat` again.

## 7. Test

Open:

```text
http://localhost:5173/signup
```

Click **Sign up with Google**.

FlowVik sends the Google ID token to the Node.js backend. The backend verifies the token using Google's Node.js auth library, creates a FlowVik user/workspace if needed, and creates a FlowVik session.

After Google signup, the user is taken to the Instagram Integrations page.
