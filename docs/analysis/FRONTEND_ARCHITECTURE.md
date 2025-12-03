# Frontend Architecture Analysis

This document provides a detailed analysis of the frontend architecture of the "Caption Art" application.

## 1. Technology Stack

*   **Framework:** React with TypeScript
*   **Bundler:** Vite
*   **Routing:** `react-router-dom`
*   **Styling:** Currently a mix of inline styles and some CSS classes. A modular CSS design system is planned.
*   **Testing:** Playwright for end-to-end testing.

## 2. Application Structure & Routing

The frontend is divided into two primary sections, as defined in `frontend/src/App.tsx`:

1.  **/playground:** A "legacy" single-page tool that contains the core creative workflow.
2.  **/agency/\*:** A newer, more complex section for professional agency workflows, with nested routes for workspaces, campaigns, and review stages.

This structure clearly shows the application's evolution from a simple tool to a full-fledged platform. The routing for the agency workflow is logical and hierarchical, correctly modeling the intended user journey (`/workspaces` -> `.../campaigns` -> `.../campaignId`).

## 3. Core Creative Workflow (`Playground.tsx`)

The `frontend/src/components/playground/Playground.tsx` component is the heart of the application's current functionality. It provides a complete, end-to-end user experience for the core creative loop.

### Architectural Pattern:

1.  **File Upload:** The user selects a file via a standard `<input type="file">`.
2.  **Presigned URL Generation:** The component calls a backend endpoint (`/api/presign`) to get a secure, temporary URL to upload the file directly to an S3 bucket. This is an excellent, scalable pattern that offloads the heavy lifting of file uploads from the backend server.
3.  **Direct S3 Upload:** The frontend uses the presigned URL to upload the file directly to S3 via a `PUT` request.
4.  **AI Processing Trigger:** Once the upload is complete, the frontend calls the relevant backend APIs (`/api/caption`, `/api/mask`) and passes the `s3Key` of the uploaded file.
5.  **State Management & Feedback:** The component uses multiple `useState` hooks to manage the application's state (e.g., `loading`, `uploadProgress`, `processingStatus`, `captions`, `maskUrl`). It provides clear, real-time feedback to the user as the AI processing occurs.
6.  **Canvas-Based Rendering:** A `useEffect` hook listens for changes in the image, mask, or text styling. It uses the Canvas API to render the composite image in real-time, providing an interactive "what you see is what you get" (WYSIWYG) experience.
7.  **Export:** The user can export the final creation directly from the canvas using `toDataURL()`.

## 4. Strengths

*   **Robust Core Workflow:** The Playground component is a well-executed prototype. The architectural pattern of using presigned URLs and decoupling the upload process is sound.
*   **Good User Experience:** The real-time canvas preview and detailed progress indicators provide a positive and interactive user experience.
*   **Monetization is Considered:** The frontend includes logic for checking a license key and applying a watermark, demonstrating that a business model has been part of the plan from early on.

## 5. Areas for Improvement & Technical Debt

*   **`Playground.tsx` is a "God Component":** This is the most significant architectural issue on the frontend. The component is monolithic, handling state management, API calls, rendering logic, and business logic all in one place.
    *   **Impact:** This makes the component extremely difficult to read, maintain, test, and debug. It also prevents the reuse of its logic (e.g., the uploader, the canvas renderer) in the newer "agency" section of the application.
    *   **Recommendation:** This component must be refactored. The logic should be decomposed into smaller, single-responsibility custom hooks (e.g., `useUploader`, `useAiProcessor`, `useCanvasRenderer`) and presentational components.

*   **Heavy Use of Inline Styles:** The component is styled almost exclusively with inline `style={{...}}` objects.
    *   **Impact:** This makes the code verbose, hurts performance, and makes it impossible to apply a consistent design system or themes. It is in direct conflict with the planned "neo-brutalism" design system work.
    *   **Recommendation:** All styles should be migrated to CSS files. The planned modular CSS system (`design-system.css`, `components.css`, etc.) is the correct approach and should be implemented as a priority after the component is refactored.

*   **API Calls within the Component:** `fetch` calls are made directly inside the component's event handlers.
    *   **Impact:** This tightly couples the UI to the data fetching logic, making the code less modular and harder to test.
    *   **Recommendation:** A dedicated API service layer should be created on the frontend (e.g., in `frontend/src/lib/api.ts`). This layer would be responsible for all communication with the backend, providing a clean and reusable interface for the components. *(Note: This refactoring has already been started).*

*   **Mock Authentication:** The current authentication is a mock implementation using `localStorage`.
    *   **Recommendation:** This needs to be replaced with a proper, secure authentication solution (e.g., integrating with a service like Auth0, or implementing a secure JWT refresh token flow).
