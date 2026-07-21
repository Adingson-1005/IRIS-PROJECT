   # IRIS User Manual

   **Institutional Research Repository System**
   St. Joseph College Olongapo

   ---

   ## 1. Introduction

   IRIS is a web-based institutional research repository for **St. Joseph College Olongapo**. It helps senior high school students discover existing research, get AI-assisted research guidance, and submit drafts for instructor feedback. Instructors use it to share finalized research and review student work, while admins manage the whole system.

   ### Purpose

   - Centralize all institutional research papers in one searchable place
   - Help students learn about research through AI guidance and feedback
   - Give instructors a structured way to comment on student drafts
   - Provide administrators with insight into how the system is used

   ### Brief overview of features

   - **Keyword search** with strand, methodology, and year filters
   - **AI Research Checker** — submit a draft PDF and receive a 0-100 score plus written feedback
   - **AI Guidance (RAG)** — ask research questions and get answers based on papers in the repository
   - **My Drafts** — students upload drafts for their instructor to review
   - **My Uploads** — instructors upload finalized papers to the repository
   - **Research Template** — instructors upload the standard research format
   - **Class management** — admins assign instructors to classes
   - **Analytics dashboard** — admins see usage statistics

   ---

   ## 2. System Requirements

   ### Device

   - Any desktop, laptop, tablet, or modern smartphone
   - Minimum screen width 360 px (the UI is responsive)

   ### Browser

   Use one of the following, latest version recommended:

   - Google Chrome
   - Microsoft Edge
   - Mozilla Firefox
   - Safari (macOS / iOS)
   - Brave

   ### Internet

   A stable internet connection is required. Search, AI features, and file uploads all need network access.

   ### Files you will work with

   - **Papers and templates:** PDF only
   - **Student drafts:** PDF or DOCX

   > Tip: if you use an ad blocker (uBlock Origin, AdBlock, Brave Shields, Privacy Badger) and the page appears blank or partially broken, disable the blocker for the IRIS site or whitelist `localhost` during development.

   ---

   ## 3. How to Access / Login

   ### Opening IRIS

   - Production URL: `https://iris-project-lemon.vercel.app`
   - Local development: `http://localhost:5173`

   ### Logging in

   1. Open the URL in your browser.
   2. Enter your **email address** and **password**.
   3. Click **Sign In**.
   4. You will be sent to the dashboard for your role:
      - **Admin** → Admin Dashboard
      - **Instructor** → Instructor Dashboard
      - **Student** → Search Papers page

   If you stay logged in, opening the site again skips the login form and goes straight to your dashboard.

   ### Creating an account

   Account creation is handled by the administrator. Send your name, school email, and the role you need (student or instructor) to the IRIS admin. Once created, you will receive your login credentials.

   ### Password reset

   Self-service password reset is not yet available. If you forget your password, contact the IRIS administrator who will reset it for you.

   ### Logging out

   - Click **Logout** in the sidebar (admin or instructor) or top right corner (student).
   - Confirm the logout in the dialog.
   - For security, navigating with the browser **Back** button after login automatically logs you out.

   ---

   ## 4. Dashboard Overview

   IRIS shows a different dashboard depending on your role.

   ### Student dashboard (Search Papers)

   Top header
   - IRIS logo on the left
   - Greeting with your first name on the right
   - **My Drafts** button — opens your draft area
   - **Logout** button

   Main area
   - **Search bar** — type a keyword and press Enter or click Search
   - **Recent Searches** dropdown — appears when the search bar is empty
   - **Filters row** — Strand, Methodology, Year, Sort order
   - **Paper cards** — clickable, show title, authors, abstract, strand, methodology, year, and a **Cite** button for APA format

   Floating buttons (bottom right)
   - **Ask AI** (chat icon) — opens the AI Guidance panel
   - **Check Paper** (document with checkmark) — opens the AI Research Checker

   Footer
   - Terms and Conditions and Privacy Policy links

   ### Instructor dashboard

   Sidebar with:
   - **My Uploads** — your published papers
   - **Main Repository** — browse all papers
   - **Research Template** — upload or replace the template
   - **Student Drafts** — review drafts and add comments

   Mobile users see a top bar with a hamburger menu.

   ### Admin dashboard

   Sidebar with:
   - **Manage Papers** — view and delete any paper
   - **Analytics** — usage dashboard with charts
   - **Manage Users** — list and remove users
   - **Student Drafts** — read-only view of every student draft
   - **Manage Classes** — assign instructors to classes

   ---

   ## 5. Features and How to Use Them

   ### 5.1 Searching for Papers (Student)

   1. Type a keyword in the search bar.
   2. (Optional) Pick a strand, methodology, or year from the filter dropdowns.
   3. Press **Enter** or click **Search**.
   4. Browse the result cards. Results are ranked by relevance (term frequency).
   5. Click a card to open its full view, including abstract and download link.
   6. Click the **Cite** button on a card to copy a ready-made APA citation to your clipboard.
   7. Click **Clear** to reset the search and go back to the full list.

   Recent searches are saved on your device. Click the small clock entries that appear when the search bar is empty to repeat a previous search. Click **Clear all** to remove your local history.

   ### 5.2 Browsing the Repository

   Students see all papers automatically when they open the dashboard. Instructors and admins can browse papers from the **Main Repository** sidebar item. Use the search box and filters at the top of the list to narrow results.

   ### 5.3 Using the AI Research Checker (Student)

   1. Click the **Check Paper** floating button (the document icon).
   2. Enter the **Title** of your paper.
   3. Click **Choose File** and select a **PDF** of your draft.
   4. Click **Submit for AI Review**.
   5. Wait 15-30 seconds while the AI compares your draft against the instructor's research template.
   6. Review your **Accuracy Score** (0-100) and the written feedback:
      - **Document Type** — confirms it is a research paper or flags a non-research file
      - **Strengths** — what your paper does well
      - **To Improve** — sections that need work
      - **Suggestions** — concrete next steps
      - **Overall Feedback** — short summary
   7. Click **Done** to close.

   Notes
   - Only PDF files are accepted.
   - If no template has been uploaded yet by an instructor, you will see an error.
   - The AI flags files that are not actual research papers (quizzes, stories, letters) and gives them a score of 0.

   ### 5.4 Asking AI Guidance / RAG (Student)

   1. Click the **Ask AI** floating button (the chat icon).
   2. Type your research question (for example: *"What methodologies are used in studies about social media?"*).
   3. Click **Ask AI**.
   4. The AI answers in 3-5 sentences and lists any relevant papers from the repository as **Sources**.
   5. Click **Ask another** to ask a follow-up, or **Done** to close.

   The AI will refuse to write papers, essays, or drafts for you. Use it to learn, not to outsource your work.

   ### 5.5 My Drafts (Student)

   When you open My Drafts the first time you will be asked to **Select Your Class**. This connects your drafts to your assigned research instructor.

   Selecting your class
   1. Click the dropdown labeled *Choose your class*.
   2. Pick the class you are enrolled in.
   3. Click **Confirm**.

   Changing your class later: click the **Change Class** button at the top of My Drafts and select a new one.

   Uploading a draft
   1. Click **Upload Draft**.
   2. Enter a **Title**.
   3. Choose a **PDF or DOCX** file.
   4. Click **Upload**.

   Viewing instructor comments
   - Click any draft in the list on the left.
   - The right panel shows the file link and any comments your instructor has left.

   Deleting a draft
   - Click the trash icon on the draft card.
   - Confirm deletion in the dialog.

   ### 5.6 My Uploads (Instructor)

   Use this page to publish finalized papers to the repository.

   Uploading a paper
   1. Click **Upload Paper**.
   2. Fill in: Title, Authors, Abstract, Strand, Methodology, Year.
   3. Choose the PDF file.
   4. Click **Upload**.

   Browsing your uploads
   - The table shows your title, authors, strand, year, downloads, and upload date.
   - Use the search bar at the top right to filter by title or author.

   Deleting a paper
   - Click **Delete** on the row.
   - Confirm in the dialog.

   ### 5.7 Research Template (Instructor)

   The template is the master document the AI Checker compares student drafts against.

   1. Click **Research Template** in the sidebar.
   2. If there is no template yet, click **Choose File**, select a PDF, then click **Upload Template**.
   3. If a template already exists and you uploaded it, you can click **Replace Template**.
   4. If another instructor uploaded the current template, the panel will show a locked note. Ask them to replace it if needed.

   Only one template is active in the system at a time.

   ### 5.8 Student Drafts (Instructor)

   1. Click **Student Drafts** in the sidebar.
   2. Pick a student from the list on the left. The header shows your assigned class.
   3. Click a draft to open it on the right.
   4. Click **View File** to open the draft in a new tab.
   5. To leave feedback (only for drafts in your assigned class):
      - Type your comment in the text area.
      - Click **Post Comment**.
   6. To remove your own comment, click the small **X** next to it.

   Notes
   - If you are not assigned to a class, you can view drafts but cannot comment.
   - Admins always have read-only access.

   ### 5.9 Manage Papers (Admin)

   1. Click **Manage Papers** in the sidebar.
   2. Use the search and filters to find a paper.
   3. Click a card to open it.
   4. Click **Delete** on a card to remove a paper from the repository.

   ### 5.10 Analytics (Admin)

   The Analytics page shows
   - Total users, students, instructors, and admins
   - Total papers, total searches, total downloads
   - A bar chart of the most searched keywords
   - A bar chart of papers by strand
   - A table of the most downloaded papers

   Data refreshes when you open the page.

   ### 5.11 Manage Users (Admin)

   1. Click **Manage Users**.
   2. The table lists every user with their email, full name, role, and creation date.
   3. Click **Delete** to remove a non-admin user. (Admins cannot be deleted from this screen.)

   ### 5.12 Manage Classes (Admin)

   1. Click **Manage Classes**.
   2. Each class card shows the class name and a dropdown of instructors.
   3. Pick an instructor from the dropdown to assign them, or pick **No instructor assigned** to remove an assignment.
   4. Changes save automatically.

   ---

   ## 6. Troubleshooting

   | Problem | What to try |
   |---|---|
   | **Page is blank / white** | Disable your ad blocker for the IRIS site, then refresh. Some blockers block files with words like *privacy* in the name. |
   | **Login says "Invalid email or password"** | Double-check spelling and caps lock. If still failing, ask the admin to reset your password. |
   | **"Network error" or pages won't load** | Check your internet. The backend runs on Render and may take a few seconds to wake up after long inactivity. |
   | **Cannot upload a draft** | Make sure your file is a PDF or DOCX, the title is filled in, and your class is selected. |
   | **"No template has been uploaded yet"** | Ask your instructor to upload a research template before you submit drafts to the AI Checker. |
   | **AI Checker gives a score of 0** | The file was likely not a research paper. Submit your actual research draft, not a quiz, story, or unrelated document. |
   | **AI Guidance refuses to answer** | The system blocks requests asking it to write or do work for you. Rephrase as a learning question. |
   | **"You are not assigned to a class so you cannot comment"** (instructor) | Ask the admin to assign you to a class on the Manage Classes page. |
   | **Logged out unexpectedly** | Tokens expire after 24 hours. Pressing the browser Back button after logging in also signs you out for security. |
   | **Search returns no results for an obvious keyword** | Try a simpler word. Stop words (the, and, is) are skipped. Words shorter than 3 letters are not indexed. |
   | **Recent searches keep showing old terms** | Click **Clear all** in the recent searches dropdown. |

   If your problem isn't here, contact the support email in section 8.

   ---

   ## 7. Frequently Asked Questions

   **Do I need to install anything to use IRIS?**
   No. It runs in your browser.

   **Can I use IRIS on my phone?**
   Yes, the layout adapts to small screens. A laptop or desktop is more comfortable for uploading and reviewing.

   **Where is my data stored?**
   Account info and metadata in a PostgreSQL database. Uploaded files in Supabase cloud storage. See the Privacy Policy in the app footer for details.

   **Why does the AI not write my paper?**
   IRIS is meant to guide your research, not do it. Writing your own paper is part of learning.

   **Can I change my class after submitting a draft?**
   Yes. Open My Drafts and click **Change Class**. Your existing drafts stay attached to you and become visible to the new class instructor.

   **Who can see my drafts?**
   Your assigned class instructor and admins. No other students can see them.

   **Why is the same paper appearing twice in search?**
   Re-uploads create new entries. Ask an admin to remove the duplicate from Manage Papers.

   **Can I download a paper?**
   Yes. Open the paper, then use the file link or download button to save the PDF.

   ---

   ## 8. Contact and Support

   - **Data Protection Officer:** dpo@sjcolongapo.edu.ph
   - **Institution:** St. Joseph College Olongapo, Olongapo City, Zambales, Philippines
   - **Developed by:** Team TECHRIFT (BSCS Thesis 2026)

   For account issues, password resets, or system problems, contact the IRIS administrator.
   For privacy or data concerns, contact the Data Protection Officer above.
