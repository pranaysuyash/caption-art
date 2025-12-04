# Comprehensive Testing FAQ for Caption Art Application

This document serves as a living FAQ based on testing the Caption Art application. It captures the steps taken, issues encountered, and lessons learned during the testing process.

---

## Test Session: December 4, 2025

### Step 1: Start the application and perform initial login
- **What needs to be done:** Start backend and frontend servers, then log in to the application
- **What was done:** Started backend and frontend using `npm run dev` in their respective directories. Navigated to localhost/5173 which redirected to /login. Entered email "test@example.com" and password "testpassword123" and clicked login.
- **What should happen:** Successfully authenticate and be redirected to the main application dashboard/workspace area
- **What happened:** Successfully logged in and was redirected to /agency/workspaces. The page shows "playground", "day/night" toggle, and "signout" options at the top, a "new workspace" button below, and a blank canvas with the message "no workspace yet - create your first workspace"
- **What's next:** Test creating a new workspace

### Step 2: Create a new workspace
- **What needs to be done:** Create a new workspace by filling in client details
- **What was done:** Clicked on "create your first workspace" which opened a modal dialog. Filled in client name as "psrs" and industry as "technology", then clicked "create"
- **What should happen:** A new workspace should be created and displayed on the workspaces page with relevant details
- **What happened:** Successfully created a workspace with name "psrs", industry "technology", showing "created on" date and "campaigns created: 0". The page URL changed to /workspaces, showing the workspace card. Clicking the logo at the top right navigated to the campaigns page at /agency/workspaces/cmir3lqt90001z88qeoggi4eh/campaigns which is currently empty but has a "new campaign" button
- **What's next:** Test creating a new campaign

---

## FAQ Structure Guide

For each testing step, we'll document:
1. The feature/test being attempted
2. The steps taken to execute it
3. The expected outcome
4. The actual result
5. Any issues encountered
6. Next steps or follow-up actions

This document will grow as we test more features of the application.