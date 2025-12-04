## Campaign Archiving API

New endpoints were added to allow soft-archiving of campaigns. These endpoints implement light-weight protections by verifying the authenticated user's agency owns the campaign via its workspace.

Endpoints:

- POST /api/campaigns/:id/archive — Set a campaign's status to `archived`.
- POST /api/campaigns/:id/unarchive — Set a campaign's status back to `draft` (restore).

Notes:

- These endpoints are protected by session authentication and will return 403 when the user does not have access to the campaign's workspace.
- The campaigns list endpoint `/api/campaigns` now accepts the optional `status` query parameter (comma separated) to filter results, for example: `/api/campaigns?workspaceId=wsid&status=archived`.
- The front-end UI now includes a toggle to show archived campaigns and Archive/Unarchive actions on campaign cards.

Migration & Data

- Campaigns are soft archived by setting `status='archived'` — this keeps data available for recovery and reporting.
