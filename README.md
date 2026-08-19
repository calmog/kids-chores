# kids-chores

A tiny offline chore-rotation web app for one kid, in Hebrew.

One chore per day from a fixed 7-chore ring — no picking and choosing. The pointer
advances only when she acts, so missing a day doesn't drop a chore. Laundry (and the
parents' bedsheets) can be declared "nothing to do", which jumps to the next chore the
same day rather than granting a day off.

Bonus chores earn points toward privileges, and can be swapped in for the day's chore
only if they're worth at least as much — but a swap never consumes the chore it
replaced, so it buys a night off rather than deleting the work.

Everything is a static file. All state lives in `localStorage` on the device: there is
no backend, no account, and nothing is collected or transmitted.

Chores, weights, point values and rewards all live in `config.js`.
