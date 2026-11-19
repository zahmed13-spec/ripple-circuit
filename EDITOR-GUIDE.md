# Editing Ripple Circuit

1. Open [Pages CMS](https://app.pagescms.org/) and sign in with GitHub. If the repository is missing, use the dashboard’s GitHub App installation flow. Choose the `zahmed13-spec` account, select **Only select repositories**, add `ripple-circuit`, and finish authorizing the app.
2. Open `zahmed13-spec/ripple-circuit`. Choose the branch that contains `.pages.yml`. For later editorial changes, create a branch from `main` in GitHub and select it in Pages CMS.
3. Open **Story & Dialogue** to change a subtitle or select its speaker. Keep lines short enough to read within the shot, and preview the film at normal speed. **Cinematics** edits film titles and shot labels. **Characters** edits display names.
4. Open **Worlds** to edit descriptions, objectives and map colors. **Puzzles & Archive** holds level descriptions, hints, restoration text and archive fragments. **Site Content** holds homepage copy and search metadata.
5. Save the file. Pages CMS commits the edit to the selected branch. Open a GitHub pull request into `main` to review the changes. To preview locally, run `pnpm install --frozen-lockfile` and `pnpm dev`, then open the local URL and play the edited scene or visit its page.
6. After the checks pass, merging into `main` starts the existing GitHub Pages workflow. Confirm the deployment succeeded in GitHub Actions, then reload the public game.
7. To undo an edit, restore the previous field value and save, or revert the commit in GitHub and review the revert through a pull request.

Keep the existing rows and their IDs and order. The build validates required text, film and shot references, subtitle windows, colors and image paths. Puzzle geometry, solutions and shot durations are maintained in game code.
