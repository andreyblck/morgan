# Tracker

Talk to whatever issue tracker the project already has. Loaded by `/haul`.

---

## The point

The project's tracker is Linear, or Jira, or GitHub Issues, or YouTrack, or a directory of
markdown files. You don't get to know which, and you don't get to care. What you need from any
of them is the same six things, and the way you find out how to do them is the same every time:
**read the project's own conventions before guessing.**

Guessing costs a whole run. A command that assumes Linear on a Jira project doesn't fail
loudly — it fails at the first write, hours in, with the work already done and nowhere to put
the result.

---

## Discovery, in this order

Stop at the first one that answers. Write down what you found, once, and reuse it — re-deriving
it per issue is the same waste `/board` warns about for ground truth.

1. **The project's own documents.** `CLAUDE.md`, the memory directory, `docs/`, `CONTRIBUTING`.
   A project that uses a tracker usually says so, and says how: which tool, which project or
   board, which statuses mean started and done, who the current user is. This is the only source
   that can tell you the *conventions* — the rest can only tell you the *mechanism*.
2. **A connected MCP server.** Look for tool names matching the shape `mcp__<something>__*` where
   the something names a tracker and the verbs look like issue operations. Match on shape, not on
   a vendor list — a list goes stale the first time someone connects a tracker nobody thought of.
3. **A command-line tool.** `gh` for GitHub Issues is the common one, and it's often already
   authenticated when no MCP server is configured. Check it can actually reach the project before
   counting on it; installed is not the same as authorised.
4. **A board in the repository.** Some projects keep issues as files — a directory of markdown,
   a checklist, a `TODO.md`. This is a real tracker, not a degraded one, and it's the only kind
   that works with nothing connected at all.
5. **Nothing.** Say so once, plainly, and keep going. See *Degrading* below.

**Never hardcode a vendor.** Not in a command body, not in a condition, not in an example that
quietly becomes the default. The moment a command says "if this is a Linear ticket", it has
stopped working for everyone else.

---

## The six operations

Everything a command needs from a tracker is one of these. If you can do these, the vendor is
irrelevant; if you can't do one, say which.

| Operation | What it has to return or do |
|---|---|
| **List** | issues matching a filter — status, assignee, label, or explicit keys |
| **Read** | one issue: key, title, description, acceptance criteria, status, assignee, links |
| **History** | comments and status transitions, with timestamps where the tracker keeps them |
| **Comment** | append a comment carrying evidence |
| **Move** | change status — see the limits below |
| **Link** | associate a branch, commit or PR with the issue |

Acceptance criteria are frequently *not* a field. They're prose in the description, a checklist,
or absent. Absent is a finding, not a formatting problem: an issue with no statement of what
"done" means cannot be verified, and pretending otherwise is how a false verdict gets written.

---

## What a write must never do

These hold regardless of tracker, and regardless of how confident the run is.

- **Never write to an issue assigned to someone else.** Check the assignee immediately before
  every write, on the object you already fetched. It's one field, and it's never the thing to
  skip because you're in a hurry.
- **Never set a terminal status.** Done, Closed, Resolved — whatever this tracker calls the end
  of the line. A terminal state is a claim about production behaviour, and a command working from
  a branch has not observed any.
- **Never create an issue without asking.** Propose it in the report and wait.
- **Never delete or rewrite someone's comment.** Append.
- **Post the evidence before the transition**, so whoever reads the issue sees why the status
  moved rather than being asked to trust it.

---

## Degrading

A tracker that can't be found, or can be read but not written, is a normal condition, not a
failure. The run continues.

- **Do the work anyway.** The code, the branch, the tests — none of that depends on the tracker.
- **Collect what you would have written**, in full, in the run's own log.
- **Say precisely what didn't land**, per issue, in the report: the comment, the transition, or
  both. "Couldn't reach the tracker" is not enough for someone to finish the job by hand.

A run that quietly skips its writes and reports success has lied about where the work stands.

---

## Anti-patterns

- **Naming a vendor in a command body.** It works until the first project that uses something
  else, and then it fails silently by falling through.
- **Guessing the conventions.** Which status means started, which branch is the default, who the
  current user is — the project says. Read it.
- **Re-deriving discovery per issue.** Find it once, write it down, reuse it.
- **Treating a missing acceptance criterion as a formatting problem.** It's the finding.
- **Writing a terminal status because everything looks right.** Looks right is not observed.
- **Reporting success on a run whose writes were all skipped.**
