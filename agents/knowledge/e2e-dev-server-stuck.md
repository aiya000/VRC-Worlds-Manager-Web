# E2E specs fail because the dev server is not the one you think

`bun run test:e2e` starts `next dev` on port 3456 itself, but only when nothing is listening there
already: `reuseExistingServer` is on outside CI. So whatever is on 3456 when the run starts is what
every spec talks to, and when that server is in a bad state the failures look like the change broke
things.

Suspect the server before the change when:

- Every spec that goes through `/start` fails (the exit guard, the landing page, the launch screen's
  legal links, anything that launches the app) with `page.goto: net::ERR_ABORTED; maybe frame was
detached?` or a 30-second timeout on `page.goto`
- `curl http://127.0.0.1:3456/start` never answers, and the dev server's log sits on
  `○ Compiling /start ...`
- Specs that sign in fail with a bot check that never finishes, while nothing about sign-in changed

## Check that it is the server, not the change

Put the page back as it was on the base branch (`git show HEAD:<path> > <path>`), fetch it with
`curl` against a freshly started dev server, and see whether it hangs the same way. If the old page
hangs too, the change is not the cause.

## The three causes seen so far

### A broken `.next` cache

Seen when `bun run build` ran while a dev server from an interrupted e2e run was still up. Both
write under `.next`, and the dev server afterwards hung compiling `/start` for good -- with the
change and without it.

Stop every dev server, delete `.next`, and start again. `/start` then compiled in about a second.

### An orphaned `next-server` still holding port 3456

Killing `next dev` (or the Playwright run that started it) can leave its `next-server` child
running with the listening socket. Nothing named `next dev` shows in `ps`, yet the port answers
nothing, and the next run reuses it and hangs from the first spec.

Find the owner through the socket rather than by name:

```sh
grep ':0D80 00000000:0000 0A' /proc/net/tcp    # 0D80 is 3456; the 10th column is the inode
for p in /proc/[0-9]*; do
  ls -l "$p/fd" 2>/dev/null | grep -q "socket:\[<inode>\]" && echo "${p#/proc/}"
done
```

Then kill that process. Beware `pkill -f "next dev"` from a shell whose own command line contains
those words: it kills the shell running it.

### A dev server started by hand

A server started with plain `bunx next dev` lacks the environment `playwright.config.ts` gives its
own (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`), and Playwright reuses it all the same. The two
`login-turnstile.spec.ts` specs then fail. Stop it and let Playwright start its own.
