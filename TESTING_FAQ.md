# Comprehensive User Testing FAQ for Caption Art Application

This document serves as a living FAQ based on user testing the Caption Art application. It captures the steps taken, user experiences, and lessons learned during the testing process.

---

## Test Session: December 4, 2025

### Step 1: Start the application and perform initial login
- **What needs to be done:** Start the application and log in
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

### Step 3: Attempt to create a new campaign
- **What needs to be done:** Create a new campaign by filling in campaign details
- **What was done:** Clicked on "new campaign" button which opened a modal dialog. Filled in campaign name as "launch" and selected objective "website traffic" from the available options (brand awareness, website traffic, conversions/sales, engagement). Clicked "create campaign".
- **What should happen:** A new campaign should be created and displayed on the campaigns page with relevant details
- **What happened:** An error occurred during campaign creation. The campaign was not created successfully due to a missing feature in the current UI that needed to be resolved by the development team.
- **What's next:** Development team needs to fix the campaign creation functionality to include all required fields

### Step 4: Campaign creation functionality fixed
- **What needs to be done:** Implement proper campaign creation form with all required fields
- **What was done:** Updated the CampaignList component to use the CreateCampaignModal component that includes all required fields: campaign name, description, objective, launch type, funnel stage, placements, primary CTA, and reference captions.
- **What should happen:** Users should be able to successfully create a new campaign with all required information
- **What happened:** The CreateCampaignModal component now provides all necessary fields for campaign creation, resolving the previous 400 Bad Request error.
- **What's next:** Test creating a new campaign with the updated UI

### Step 5: Test the updated campaign creation form
- **What needs to be done:** Create a new campaign using the detailed form with all required fields
- **What was done:** Clicked "New Campaign" button, which opened a detailed form with fields: campaign name (filled: "launch"), description (filled: "launch test"), objective (selected: "traffic"), launch type (selected: "new launch"), funnel stage (selected: "cold"), placements (selected: "instagram feed"), primary CTA (filled: "know more"), reference captions (left blank). Clicked "Create Campaign".
- **What should happen:** A new campaign should be created successfully with all provided information
- **What happened:** Received an "Access denied" error even though the user is logged in and the top bar shows "Sign Out", indicating an authentication/authorization issue with the API endpoint. This suggests a possible issue with workspace permissions or the backend authentication system.
- **What's next:** Investigate the access denied error which may be related to workspace permissions or API authentication

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