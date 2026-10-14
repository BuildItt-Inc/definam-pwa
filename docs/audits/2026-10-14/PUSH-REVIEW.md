# Landing-page review and rollback

14 October 2026. Selected design: the existing light/dark mix. The alternate color skin and comparison route have been removed.

## Result

- Use Apple system typography on iPhone/iPad, Roboto on Android, and Inter on desktop or unidentified devices. Enable pinch zoom and improve reading size, line height and text wrapping.
- Remove the requested hero audience caption. Replace the admin-focused hero preview with a student learning sample, and move the illustrative school dashboard into the school section.
- Separate school-code entry, individual purchase and login actions. Add a free mathematics sample with answer feedback, retry and a worked solution.
- Improve keyboard navigation with a skip link, a modal mobile menu, focus restoration and FAQ disclosures. Keep content readable without JavaScript and make background glows static when reduced motion is requested.
- Improve pricing/footer contrast. Explain the 120/360-day periods, activation, unused-code expiry, one-student/one-device access and nonrecurring payment before checkout.
- Add a generated social preview and deployment-aware landing metadata. Load KaTeX in the student layout rather than on the public landing page, including cached-script remount handling.

Subject-coverage claims, statistics, Terms/Privacy placeholders, backend behavior, payment API behavior and dependency versions are unchanged. Typography defaults affect the shared frontend; review authenticated screens before merging.

## Verification

- Fetched `origin/dev`; the starting commit was `357790c31990c9327d17bed20b479f4b4ad29d01`, matching the latest team branch at the check.
- TypeScript and Git diff checks pass.
- All four Jest suites pass: 15 tests, including six new platform-detection cases.
- Frontend lint passes with an existing `loadSubjects` dependency warning in `SubjectManagementPanel.tsx`, which this change does not modify.
- Production build passes using an isolated source copy, the same Next configuration and installed dependencies, and the CI backend/API URL environment. All 44 static pages generate. Local metadata-base warnings remain on routes outside the landing page; confirm the intended `NEXT_PUBLIC_APP_URL` before production release.
- Previously recorded browser checks confirm no horizontal overflow at 320, 390, 768, 1024 and 1440px; sample feedback, keyboard focus and reduced motion work. The selected design was rechecked at 390px after removing the alternate skin.
- Real-device Safari/Android, authenticated student math and live payment completion have not been verified. GitHub CI and any Vercel preview should be reviewed before merging.

Evidence: [desktop](comparison/classic-desktop.png), [phone](comparison/classic-phone.png), [responsive measurements](comparison/checks.json), [keyboard and motion checks](comparison/acceptance.json), [contrast measurements](comparison/contrast.json). Measurements also contain the archived alternate design, which is no longer in the application.

## Team review and rollback

Publish one commit on `codex/landing-typography-accessibility` and open a pull request into `dev`. Keep `dev` unchanged until review. A Git-integrated Vercel project may create a branch preview automatically; this push does not request a production deployment.

Before merging, the team can close the PR to reject the change. After merging, use GitHub's **Revert** action on the merged PR to create a rollback PR. If reverting locally, use `git revert <squash-commit-sha>` for a squash merge or `git revert -m 1 <merge-commit-sha>` for a merge commit, then submit the resulting commit for review. Do not reset shared history or force-push.

The repository template requests an issue link. Issue creation through the GitHub connector returned 403, and automatic approval review rejected the saved-credential fallback. No tracking issue was created; record that exception in the PR.
