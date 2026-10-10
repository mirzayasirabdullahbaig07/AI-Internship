# Day 6 - Git Locally

## Lab evidence

Branch `feat/day-06-git-local` modified **one file** (`day-06-git-local/practice.md`) and produced **one focused commit** with a Conventional Commit message. `git show --stat` listed exactly one file (see report).

## The disciplined workflow (commands actually used)

```bash
git switch -c feat/day-06-git-local      # one task = one branch
git status                                # check what you are about to stage
git add day-06-git-local/practice.md      # target a specific file - avoid `git add .`
git diff --cached --stat                  # confirm only intended files are staged
git commit -m "docs(day-06): add practice note for local git workflow"
```

## Commit message format

`type(scope): imperative summary` - types: feat, fix, docs, test, style, refactor, chore.
Bad: `update stuff` (mixes CSS, migration, dependency; AI agents read history for context and will hallucinate from it).
