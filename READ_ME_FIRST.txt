FLOWVIK v4 — NODE.JS + REACT — NO DOCKER
==========================================

WHAT IS FIXED IN THIS BUILD
---------------------------
1. Automations page no longer renders blank.
2. Integrations page no longer renders blank.
3. Every dashboard route now has a real page or a visible error state.
4. Added Error Boundary so a React error is shown instead of a white/blank page.
5. Added Email Sign Up.
6. Added Google Sign Up / Sign In foundation using Google Identity Services.
7. Added per-user workspaces and session tokens.
8. Added multi-client Instagram connection list.
9. Connected Instagram username + Instagram User ID are shown in Integrations.
10. Added Connect Another Instagram account.
11. Added account selection inside Automation Builder.
12. Added post/Reel/eligible-ad comment -> private DM workflow handling.
13. Added webhook verification, token encryption support, comment matching and automation logs.
14. No Docker, Python, Django, PostgreSQL, Redis or MySQL required.

FIRST RUN
---------
1. Install Node.js 20 LTS or newer.
2. Extract this ZIP.
3. Open PowerShell in the flowvik-node-react folder.
4. Run:

   .\SETUP_WINDOWS.bat

5. DO NOT cancel npm install.
6. Wait until you see SETUP COMPLETE.
7. Run:

   .\START_FLOWVIK.bat

8. Open:

   http://localhost:5173/login

DEMO LOGIN
----------
Email: demo@flowvik.app
Password: demo12345

GOOGLE SIGN-UP
--------------
Read:
  docs\GOOGLE_SIGNUP_SETUP.md

REAL INSTAGRAM CONNECTION
-------------------------
Read:
  docs\INSTAGRAM_SETUP.md

IMPORTANT
---------
The application can be used in demo mode immediately.
Google sign-up requires GOOGLE_CLIENT_ID.
Real Instagram requires Meta App credentials plus a public HTTPS webhook URL.
For commercial use with client accounts outside your Meta app roles/test users,
complete the applicable Meta App Review / Advanced Access requirements.
