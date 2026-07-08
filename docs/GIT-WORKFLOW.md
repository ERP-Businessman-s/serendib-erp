# Git Workflow and Team Contribution Guide
## Serendib Gems ERP

Version 1.0
This guide explains how the seven of us share one GitHub repository without breaking each other's work. It also makes sure every member has commits under their own name, because team contribution and commit history are worth marks.

---

## 1. One repository, one workspace
One teammate has already created the GitHub workspace (the organisation or the repository). Everyone else needs to be added as a member with write access. Ask that teammate to add your GitHub username.

The repository name is `serendib-erp`. Everyone clones the same repo.

## 2. First time setup (each person, once)
```
git clone <the repo url from GitHub>
cd serendib-erp
```
Set your name and email so your commits are counted as yours:
```
git config user.name "Your Name"
git config user.email "your-github-email@example.com"
```
This step matters. If your name and email are wrong, your commits will not be counted as your contribution.

## 3. The golden rule
The `main` branch must always work. Never push broken or half finished code straight to `main`. Always work on your own branch and merge through a Pull Request.

## 4. The daily flow
1. Get the latest code before you start:
```
git checkout main
git pull
```
2. Make a new branch for the piece you are working on. Name it after your module and task:
```
git checkout -b inventory-lot-list
```
Branch name examples: `procurement-suppliers`, `sales-order-page`, `billing-invoice`, `dashboard-kpis`.

3. Do your work. Commit small and often, with clear messages:
```
git add .
git commit -m "Add lot list page with type and status filters"
```
Good commit messages say what you did in plain words. Bad messages like "update" or "fix" do not help and look weak in the history.

4. Push your branch to GitHub:
```
git push -u origin inventory-lot-list
```

5. On GitHub, open a Pull Request from your branch into `main`. Write one or two lines about what it does.

6. One other teammate looks at it and clicks merge. Do not merge your own Pull Request without a quick look from someone else.

7. After it is merged, go back to step 1 for your next piece.

## 5. When two people change the same file (merge conflict)
This will happen sometimes. Do not panic.
- Run `git pull origin main` into your branch to get the latest.
- Git will mark the lines that clash. Open the file and keep the correct version.
- Ask the other person if you are not sure which change to keep.
- To avoid most conflicts, each person mainly edits files inside their own module folder.

## 6. What must never be committed
- The `.env` file with the database password. It is already in `.gitignore`. Never remove it from there.
- The `node_modules` folder. It is large and is rebuilt with `npm install`.
- Any real client files or the real client name.

If you accidentally commit a secret like a password, tell the Platform lane owner at once so it can be changed.

## 7. Making sure everyone contributes
The brief gives marks for team contributions and commit history. So:
- Every member commits their own work under their own name. Do not let one person commit for everybody.
- Aim for many small commits across all four days, not one big commit at the end.
- Even the report writers and slide makers should commit their documents into the `docs` folder, so their contribution shows in the history.

## 8. Quick command reference
```
git pull                       get the latest main
git checkout -b my-branch      start a new branch
git add .                      stage your changes
git commit -m "message"        save a commit
git push -u origin my-branch   send your branch to GitHub
```
