import type { Stack } from '@/lib/progress';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  stack: Stack;
  track: string;
  title: string;
  brief: string;
  difficulty: Difficulty;
  xp: number;
  mode: 'run' | 'static';
  /** transpile with sucrase inside the worker before executing */
  ts?: boolean;
  starter: string;
  solution: string;
  hint: string;
  explain: string;
  payload: unknown;
  /** static-analysis requirements (Go / PHP) */
  must?: string[];
  mustNot?: string[];
  expected?: string;
}

export const DIFFICULTIES: { id: Difficulty; label: string; pips: number }[] = [
  { id: 'easy', label: 'Easy', pips: 1 },
  { id: 'medium', label: 'Medium', pips: 2 },
  { id: 'hard', label: 'Hard', pips: 3 },
];

export const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

export const ORDERS = [
  { id: 1, user_id: 1, status: 'paid', total_amount: 120.5 },
  { id: 2, user_id: 2, status: 'pending', total_amount: 89.99 },
  { id: 3, user_id: 1, status: 'paid', total_amount: 240 },
  { id: 4, user_id: 3, status: 'paid', total_amount: 310.25 },
  { id: 5, user_id: 2, status: 'paid', total_amount: 75 },
  { id: 6, user_id: 1, status: 'cancelled', total_amount: 60 },
  { id: 7, user_id: 4, status: 'paid', total_amount: 199.5 },
  { id: 8, user_id: 3, status: 'pending', total_amount: 410 },
  { id: 9, user_id: 2, status: 'paid', total_amount: 88.75 },
  { id: 10, user_id: 4, status: 'paid', total_amount: 52.4 },
];

export const STACK_META: Record<
  Stack,
  { label: string; tagline: string; file: string; lang: 'go' | 'javascript' | 'typescript' | 'php' }
> = {
  go: {
    label: 'Go',
    tagline: 'maps · slices · pointers · channels',
    file: 'main.go',
    lang: 'go',
  },
  node: {
    label: 'Node.js / TS',
    tagline: 'arrays · Map/Set · promises',
    file: 'solve.js',
    lang: 'javascript',
  },
  frontend: {
    label: 'Frontend TS',
    tagline: 'state · derived data · react patterns',
    file: 'solve.ts',
    lang: 'typescript',
  },
  php: {
    label: 'PHP 8 / Laravel',
    tagline: 'arrays · collections · match',
    file: 'OrderService.php',
    lang: 'php',
  },
};

export const CHALLENGES: Challenge[] = [
  /* ------------------------------- GO -------------------------------- */
  {
    id: 'go-map-index',
    stack: 'go',
    track: 'maps',
    title: 'Index orders by user',
    brief:
      'Build map[int][]Order so a user id resolves to their orders in O(1). Allocate with make(), range the slice, append each order into its bucket.',
    difficulty: 'easy',
    xp: 40,
    mode: 'static',
    starter: `type Order struct {
	ID     int
	UserID int
	Total  float64
}

// IndexByUser groups orders by their user id.
func IndexByUser(orders []Order) map[int][]Order {
	// TODO: make the map, range the slice, append each order
	return nil
}`,
    solution: `func IndexByUser(orders []Order) map[int][]Order {
	index := make(map[int][]Order)
	for _, o := range orders {
		index[o.UserID] = append(index[o.UserID], o)
	}
	return index
}`,
    hint: 'index := make(map[int][]Order) — then index[o.UserID] = append(index[o.UserID], o).',
    explain:
      'A nil map panics on write. make() allocates the bucket table first. Appending to index[key] works because append accepts the zero value (nil slice) and returns a new slice that you assign back.',
    payload: `orders := []Order{
  {ID: 1, UserID: 7, Total: 120.50},
  {ID: 2, UserID: 7, Total: 40.00},
  {ID: 3, UserID: 9, Total: 88.75},
}`,
    must: ['make\\(map\\[int\\]\\[\\]Order\\)', 'range orders', 'append\\('],
    expected: 'map[7:[{1 7 120.5} {2 7 40}] 9:[{3 9 88.75}]]',
  },
  {
    id: 'go-map-comma-ok',
    stack: 'go',
    track: 'maps',
    title: 'Delete, then ask politely',
    brief:
      'Delete the key from the map, then read it back using the comma-ok idiom. Return the value and whether the key still exists.',
    difficulty: 'easy',
    xp: 35,
    mode: 'static',
    starter: `func RemoveAndCheck(inventory map[string]int, item string) (int, bool) {
	// TODO: delete the key, then read it with the comma-ok idiom
	return 0, false
}`,
    solution: `func RemoveAndCheck(inventory map[string]int, item string) (int, bool) {
	delete(inventory, item)
	value, ok := inventory[item]
	return value, ok
}`,
    hint: 'delete(m, key) removes it. value, ok := m[key] tells you if it is still there.',
    explain:
      'Reading a missing key returns the zero value — 0 for int, "" for string. That is indistinguishable from a real 0 unless you use the two-value assignment. delete() on a missing key is a no-op, not a panic.',
    payload: `inventory := map[string]int{"sword": 1, "potion": 4}
value, ok := RemoveAndCheck(inventory, "sword")
// value == 0, ok == false`,
    must: ['delete\\(', ',\\s*ok\\s*:='],
    expected: 'value = 0, ok = false — and the map no longer contains "sword".',
  },
  {
    id: 'go-slice-grow',
    stack: 'go',
    track: 'slices',
    title: 'len vs cap',
    brief:
      'Append extra onto base and return the resulting slice plus its length and capacity. Do not preallocate — let append show you how capacity grows.',
    difficulty: 'medium',
    xp: 60,
    mode: 'static',
    starter: `func Grow(base []int, extra []int) ([]int, int, int) {
	// TODO: append, then report len and cap
	return base, 0, 0
}`,
    solution: `func Grow(base []int, extra []int) ([]int, int, int) {
	out := append(base, extra...)
	return out, len(out), cap(out)
}`,
    hint: 'append(base, extra...) then len(out), cap(out).',
    explain:
      'len is how many elements you can read; cap is how many fit before append must allocate a bigger backing array (usually doubling). Slices share that array, which is why mutating one can surprise you.',
    payload: `base := []int{1, 2, 3}          // len 3, cap 3
out, l, c := Grow(base, []int{4, 5})
// out == [1 2 3 4 5]`,
    must: ['append\\(', 'len\\(', 'cap\\('],
    expected: 'out = [1 2 3 4 5], len = 5, cap = 6 (Go typically doubles from 3 → 6).',
  },
  {
    id: 'go-pointer-receiver',
    stack: 'go',
    track: 'structs & pointers',
    title: 'Mutate through a pointer',
    brief:
      'Give User a method Rename that actually changes the struct. Use a pointer receiver and assign the new name.',
    difficulty: 'medium',
    xp: 60,
    mode: 'static',
    starter: `type User struct {
	Name string
	Age  int
}

// Rename must mutate the receiver, not a copy.
func (u *User) Rename(name string) {
	// TODO
}`,
    solution: `type User struct {
	Name string
	Age  int
}

func (u *User) Rename(name string) {
	u.Name = name
}`,
    hint: 'func (u *User) Rename(name string) { u.Name = name } — the star matters.',
    explain:
      'A value receiver gets a copy, so assignments vanish when the method returns. A pointer receiver mutates the original. Go automatically takes the address for addressable values, so user.Rename("x") still works with a pointer receiver.',
    payload: `u := User{Name: "ada", Age: 36}
u.Rename("grace")
fmt.Println(u.Name) // grace`,
    must: ['func \\(u \\*User\\)', 'u\\.Name\\s*='],
    expected: 'u.Name == "grace" after the call — the struct was mutated in place.',
  },
  {
    id: 'go-filter-inplace',
    stack: 'go',
    track: 'slices',
    title: 'Filter without allocating',
    brief:
      'Return only the paid orders, reusing the input backing array: keep a write index, copy survivors forward, then reslice. No new slice, no append growth.',
    difficulty: 'medium',
    xp: 65,
    mode: 'static',
    starter: `func PaidOnly(orders []Order) []Order {
	// TODO: out := orders[:0]; range and append survivors; return out
	return nil
}`,
    solution: `func PaidOnly(orders []Order) []Order {
	out := orders[:0]
	for _, o := range orders {
		if o.Status == "paid" {
			out = append(out, o)
		}
	}
	return out
}`,
    hint: 'out := orders[:0] shares the array — append overwrites elements you have already read.',
    explain:
      'orders[:0] has length 0 but the same capacity and backing array. Appending writes over the elements behind the read cursor, so no allocation happens. This is only safe when the output never grows beyond the input — and it mutates the caller\'s array.',
    payload: `orders := []Order{
  {ID: 1, Status: "paid"},
  {ID: 2, Status: "pending"},
  {ID: 3, Status: "paid"},
}
paid := PaidOnly(orders) // len 2, shares orders' array`,
    must: ['orders\\[:0\\]', 'append\\(', 'range orders'],
    expected: 'len 2, cap 3 — filtered in place, zero allocations.',
  },
  {
    id: 'go-channels',
    stack: 'go',
    track: 'concurrency',
    title: 'Fan out, fan in',
    brief:
      'Sum a slice in parallel: one goroutine per part, each sending its value on a channel, the caller receiving the same number of values.',
    difficulty: 'hard',
    xp: 100,
    mode: 'static',
    starter: `func SumParallel(parts []int) int {
	// TODO: launch a goroutine per part that sends on a channel,
	// then receive exactly len(parts) values.
	total := 0
	return total
}`,
    solution: `func SumParallel(parts []int) int {
	ch := make(chan int)
	for _, p := range parts {
		go func(v int) {
			ch <- v
		}(p)
	}
	total := 0
	for range parts {
		total += <-ch
	}
	return total
}`,
    hint: 'Capture the loop variable as a parameter — otherwise every goroutine may read the last value.',
    explain:
      'Unbuffered channels synchronise sender and receiver. You must receive exactly as many values as were sent or the program deadlocks. Passing p as a parameter avoids the classic loop-variable capture bug.',
    payload: `parts := []int{10, 20, 30, 40}
SumParallel(parts) // 100`,
    must: ['go func', 'make\\(chan', '<-ch', 'range parts'],
    expected: '100 — four goroutines, four receives, no deadlock.',
  },
  {
    id: 'go-error-wrap',
    stack: 'go',
    track: 'errors',
    title: 'Wrap it, keep the sentinel',
    brief:
      'Return ErrNotFound wrapped with context: the caller must be able to detect it with errors.Is even though the message carries the id.',
    difficulty: 'hard',
    xp: 95,
    mode: 'static',
    starter: `var ErrNotFound = errors.New("not found")

func FindUser(users map[int]User, id int) (User, error) {
	// TODO: return a wrapped ErrNotFound when the id is missing
	return User{}, nil
}`,
    solution: `var ErrNotFound = errors.New("not found")

func FindUser(users map[int]User, id int) (User, error) {
	u, ok := users[id]
	if !ok {
		return User{}, fmt.Errorf("find user %d: %w", id, ErrNotFound)
	}
	return u, nil
}`,
    hint: 'fmt.Errorf("find user %d: %w", id, ErrNotFound) — %w is what makes errors.Is work.',
    explain:
      'Wrapping preserves the original error inside the chain, so callers can match a sentinel with errors.Is while still reading a human message. Using %v instead of %w flattens it into a string and breaks that check.',
    payload: `_, err := FindUser(users, 42)
errors.Is(err, ErrNotFound) // true
err.Error()                 // "find user 42: not found"`,
    must: ['fmt\\.Errorf\\(', '%w', 'ErrNotFound'],
    expected: 'errors.Is(err, ErrNotFound) == true, message keeps the id.',
  },

  /* ------------------------------ NODE ------------------------------- */
  {
    id: 'node-reduce',
    stack: 'node',
    track: 'array methods',
    title: 'Reduce the ledger',
    brief:
      'Return an object mapping each user_id to the total of all their orders (every status counts). Numbers, not strings.',
    difficulty: 'easy',
    xp: 40,
    mode: 'run',
    starter: `function solve(orders) {
  // return { [user_id]: totalSpent }
  return {};
}`,
    solution: `function solve(orders) {
  return orders.reduce((acc, o) => {
    acc[o.user_id] = (acc[o.user_id] ?? 0) + o.total_amount;
    return acc;
  }, {});
}`,
    hint: 'reduce with an object accumulator, seeding the key with ?? 0.',
    explain:
      'reduce is the general fold: you decide the accumulator shape. Starting with {} means each iteration either creates a bucket or adds to it. `?? 0` handles the first visit without an if.',
    payload: ORDERS,
    expected: '{ "1": 420.5, "2": 253.74, "3": 720.25, "4": 251.9 }',
  },
  {
    id: 'node-shape',
    stack: 'node',
    track: 'array methods',
    title: 'Shape the API response',
    brief:
      'Return paid orders above 150 as objects with exactly two keys: { orderId, amount }, sorted by amount descending.',
    difficulty: 'medium',
    xp: 60,
    mode: 'run',
    starter: `function solve(orders) {
  // filter → map → sort
  return [];
}`,
    solution: `function solve(orders) {
  return orders
    .filter((o) => o.status === 'paid' && o.total_amount > 150)
    .map((o) => ({ orderId: o.id, amount: o.total_amount }))
    .sort((a, b) => b.amount - a.amount);
}`,
    hint: 'filter first (cheap), then map to the new shape, then sort descending.',
    explain:
      'This is the exact pipeline behind most "transform a DB row into an API DTO" code. filter → map → sort keeps each step single-purpose, and sort must compare numbers explicitly (b.amount - a.amount) or you get lexicographic order.',
    payload: ORDERS,
    expected: '[{ orderId: 4, amount: 310.25 }, { orderId: 3, amount: 240 }, { orderId: 7, amount: 199.5 }]',
  },
  {
    id: 'node-set',
    stack: 'node',
    track: 'Map & Set',
    title: 'Unique buyers',
    brief:
      'Return { count, users } where users is the sorted array of distinct user ids that appear in orders, and count is how many there are.',
    difficulty: 'easy',
    xp: 40,
    mode: 'run',
    starter: `function solve(orders) {
  // Set removes duplicates; sort the result numerically
  return { count: 0, users: [] };
}`,
    solution: `function solve(orders) {
  const users = [...new Set(orders.map((o) => o.user_id))].sort((a, b) => a - b);
  return { count: users.length, users };
}`,
    hint: 'new Set(array) then spread back into an array; sort((a,b) => a-b).',
    explain:
      'Set membership is O(1), so deduplicating a large list is cheaper than an array .includes() loop. Spreading a Set back to an array is the idiomatic one-liner. Default .sort() is lexicographic — always pass a comparator for numbers.',
    payload: ORDERS,
    expected: '{ count: 4, users: [1, 2, 3, 4] }',
  },
  {
    id: 'node-promise-all',
    stack: 'node',
    track: 'async',
    title: 'Fetch them together',
    brief:
      'Fetch every distinct user id in data.orders in parallel and return the sorted array of names. Use Promise.all — sequential awaits are a bug here.',
    difficulty: 'medium',
    xp: 65,
    mode: 'run',
    starter: `const USERS = { 1: 'Ada', 2: 'Grace', 3: 'Linus', 4: 'Margaret' };
const fakeFetch = (id) => new Promise((resolve) => setTimeout(() => resolve(USERS[id]), 5));

async function solve(data) {
  // Promise.all over the distinct ids
  return [];
}`,
    solution: `const USERS = { 1: 'Ada', 2: 'Grace', 3: 'Linus', 4: 'Margaret' };
const fakeFetch = (id) => new Promise((resolve) => setTimeout(() => resolve(USERS[id]), 5));

async function solve(data) {
  const ids = [...new Set(data.orders.map((o) => o.user_id))];
  const names = await Promise.all(ids.map((id) => fakeFetch(id)));
  return names.sort();
}`,
    hint: 'await Promise.all(ids.map(fakeFetch)) resolves them concurrently.',
    explain:
      'Promise.all starts every request immediately and resolves when all succeed — total latency is the slowest request, not the sum. If any promise rejects, the whole thing rejects, which is why allSettled exists.',
    payload: { orders: ORDERS },
    expected: "['Ada', 'Grace', 'Linus', 'Margaret']",
  },
  {
    id: 'node-allsettled',
    stack: 'node',
    track: 'async',
    title: 'Bug hunter: survive a rejection',
    brief:
      'One of the three promises rejects. Do not let that kill the request: use Promise.allSettled, keep the fulfilled values, and return { [user]: amount }.',
    difficulty: 'medium',
    xp: 70,
    mode: 'run',
    starter: `const tasks = [
  Promise.resolve({ user: 1, amount: 100 }),
  Promise.reject(new Error('upstream timeout')),
  Promise.resolve({ user: 2, amount: 50 }),
];

async function solve() {
  // Promise.all here would throw. Use allSettled.
  return {};
}`,
    solution: `const tasks = [
  Promise.resolve({ user: 1, amount: 100 }),
  Promise.reject(new Error('upstream timeout')),
  Promise.resolve({ user: 2, amount: 50 }),
];

async function solve() {
  const settled = await Promise.allSettled(tasks);
  const out = {};
  for (const item of settled) {
    if (item.status === 'fulfilled') out[item.value.user] = item.value.amount;
  }
  return out;
}`,
    hint: 'Each result is { status: "fulfilled", value } or { status: "rejected", reason }.',
    explain:
      'Promise.all short-circuits on the first rejection, losing the successful results. allSettled always resolves with a per-promise status — the right tool for partial failures like a dashboard calling three services.',
    payload: null,
    expected: '{ "1": 100, "2": 50 } — the rejected task is skipped, not fatal.',
  },
  {
    id: 'node-safe-get',
    stack: 'node',
    track: 'objects',
    title: 'Safe get by path',
    brief:
      'Read a nested value from an untrusted object with a dotted path ("user.address.city"). Return the fallback when any link is missing — never throw.',
    difficulty: 'medium',
    xp: 60,
    mode: 'run',
    starter: `function solve({ object, path, fallback }) {
  // split the path, walk with reduce, stop at the first null/undefined
  return fallback;
}`,
    solution: `function solve({ object, path, fallback }) {
  const value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), object);
  return value === undefined ? fallback : value;
}`,
    hint: 'acc == null catches both null and undefined, so the walk stops instead of throwing.',
    explain:
      '`obj.a.b.c` throws on the first missing link. A reduce over the path segments degrades to undefined instead. Loose equality with null is deliberate here: it covers undefined too, which optional chaining would handle but only when the shape is known ahead of time.',
    payload: {
      object: { user: { address: { city: 'Jakarta' }, name: 'Ada' } },
      path: 'user.address.country',
      fallback: 'unknown',
    },
    expected: '"unknown" — the walk stops at the missing country instead of throwing.',
  },
  {
    id: 'node-deep-merge',
    stack: 'node',
    track: 'objects',
    title: 'Deep merge a patch',
    brief:
      'Merge patch into base recursively: plain objects merge key by key, arrays and primitives replace outright. Never mutate base.',
    difficulty: 'hard',
    xp: 100,
    mode: 'run',
    starter: `function solve({ base, patch }) {
  // recurse into plain objects; everything else is replaced
  return base;
}`,
    solution: `function solve({ base, patch }) {
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = out[key];
    const bothPlain =
      current && value && typeof current === 'object' && typeof value === 'object'
      && !Array.isArray(current) && !Array.isArray(value);
    out[key] = bothPlain ? solve({ base: current, patch: value }) : value;
  }
  return out;
}`,
    hint: 'Spread first, then decide per key: plain object → recurse, anything else → replace.',
    explain:
      'The array check is the subtle part. Without it, merging { tags: ["a"] } with { tags: ["b"] } would recurse into an array and produce { 0: "b" }. Spreading base into a fresh object keeps the original untouched, which matters when it came from a cache.',
    payload: {
      base: { id: 1, user: { name: 'Ada', address: { city: 'Jakarta' } }, tags: ['a', 'b'] },
      patch: { user: { address: { city: 'Bandung' } }, tags: ['c'] },
    },
    expected: 'city becomes "Bandung", name survives, tags become ["c"] — arrays replaced, not concatenated.',
  },
  {
    id: 'node-rank-users',
    stack: 'node',
    track: 'array methods',
    title: 'Group, sum, rank',
    brief:
      'Return one row per user: { user_id, total, rank }, sorted by total descending with rank starting at 1. user_id must be a number, not a string key.',
    difficulty: 'hard',
    xp: 95,
    mode: 'run',
    starter: `function solve(orders) {
  // reduce → entries → map → sort → map with rank
  return [];
}`,
    solution: `function solve(orders) {
  const totals = orders.reduce((acc, o) => {
    acc[o.user_id] = (acc[o.user_id] ?? 0) + o.total_amount;
    return acc;
  }, {});
  return Object.entries(totals)
    .map(([user_id, total]) => ({ user_id: Number(user_id), total }))
    .sort((a, b) => b.total - a.total)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}`,
    hint: 'Object keys are always strings — convert with Number() before returning.',
    explain:
      'Grouping into an object is the easy half; turning it back into an ordered list is where object key coercion bites. Object.entries gives string keys, so every id needs a Number() round-trip. Sorting before assigning rank keeps the two steps honest.',
    payload: ORDERS,
    expected: '[{ user_id: 3, total: 720.25, rank: 1 }, { user_id: 1, total: 420.5, rank: 2 }, …]',
  },

  /* ---------------------------- FRONTEND ----------------------------- */
  {
    id: 'fe-format-price',
    stack: 'frontend',
    track: 'formatting',
    title: 'Format money for the UI',
    brief:
      'Cents in, display string out. Use Intl.NumberFormat with the given locale and currency — never toFixed, which gets thousands separators and symbol placement wrong outside en-US.',
    difficulty: 'easy',
    xp: 40,
    mode: 'run',
    ts: true,
    starter: `interface PriceInput {
  cents: number;
  currency: string;
  locale: string;
}

function solve(data: PriceInput): string {
  // TODO: cents → major units, then Intl.NumberFormat
  return '';
}`,
    solution: `interface PriceInput {
  cents: number;
  currency: string;
  locale: string;
}

function solve(data: PriceInput): string {
  return new Intl.NumberFormat(data.locale, {
    style: 'currency',
    currency: data.currency,
  }).format(data.cents / 100);
}`,
    hint: 'new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100)',
    explain:
      'Intl handles symbol placement, separators and decimal digits per locale — €1.299,50 and $1,299.50 from the same call. Storing money as integer cents avoids float drift, and dividing once at the display boundary is the usual compromise.',
    payload: { cents: 129950, currency: 'USD', locale: 'en-US' },
    expected: '"$1,299.50"',
  },
  {
    id: 'fe-group-status',
    stack: 'frontend',
    track: 'derived state',
    title: 'Group rows for the board',
    brief:
      'Turn a flat order list into a Record<Status, number[]> of ids, with a bucket for every status even when it is empty — the board renders a column per status.',
    difficulty: 'easy',
    xp: 45,
    mode: 'run',
    ts: true,
    starter: `type Status = 'paid' | 'pending' | 'cancelled';

interface Order {
  id: number;
  status: Status;
  total_amount: number;
}

function solve(orders: Order[]): Record<Status, number[]> {
  // TODO: seed all three buckets, then push each id into its status
  return { paid: [], pending: [], cancelled: [] };
}`,
    solution: `type Status = 'paid' | 'pending' | 'cancelled';

interface Order {
  id: number;
  status: Status;
  total_amount: number;
}

function solve(orders: Order[]): Record<Status, number[]> {
  const groups: Record<Status, number[]> = { paid: [], pending: [], cancelled: [] };
  for (const order of orders) {
    groups[order.status].push(order.id);
  }
  return groups;
}`,
    hint: 'Seeding every key first means the UI never has to check whether a column exists.',
    explain:
      'Record<Status, number[]> is the type-level promise that every status has a bucket. Building it by reduction from the data alone would leave gaps, and a missing key renders as an empty column by accident rather than by design. The type forces you to enumerate the statuses once.',
    payload: ORDERS,
    expected: '{ paid: [1, 3, 4, 5, 7, 9, 10], pending: [2, 8], cancelled: [6] }',
  },
  {
    id: 'fe-paginate',
    stack: 'frontend',
    track: 'list math',
    title: 'Clamp the page, derive the rest',
    brief:
      'Given total rows, the requested page and a page size, return the clamped page, page count, slice bounds and whether prev/next exist. A page past the end must clamp, not return an empty view.',
    difficulty: 'easy',
    xp: 45,
    mode: 'run',
    ts: true,
    starter: `interface PageInput {
  total: number;
  page: number;
  pageSize: number;
}

interface PageState {
  page: number;
  pages: number;
  start: number;
  end: number;
  hasPrev: boolean;
  hasNext: boolean;
}

function solve(input: PageInput): PageState {
  // TODO
  return { page: 1, pages: 1, start: 0, end: 0, hasPrev: false, hasNext: false };
}`,
    solution: `interface PageInput {
  total: number;
  page: number;
  pageSize: number;
}

interface PageState {
  page: number;
  pages: number;
  start: number;
  end: number;
  hasPrev: boolean;
  hasNext: boolean;
}

function solve(input: PageInput): PageState {
  const pages = Math.max(1, Math.ceil(input.total / input.pageSize));
  const page = Math.min(Math.max(1, input.page), pages);
  const start = (page - 1) * input.pageSize;
  return {
    page,
    pages,
    start,
    end: Math.min(start + input.pageSize, input.total),
    hasPrev: page > 1,
    hasNext: page < pages,
  };
}`,
    hint: 'pages first, then clamp the page into [1, pages] before computing start/end.',
    explain:
      'Everything else is derived, so compute it in dependency order: pages from total, page clamped to pages, then start and end from the clamped page. Deleting the last item on the final page is the classic bug — clamping turns that into a valid page instead of an empty table.',
    payload: { total: 47, page: 9, pageSize: 10 },
    expected: '{ page: 5, pages: 5, start: 40, end: 47, hasPrev: true, hasNext: false }',
  },
  {
    id: 'fe-reducer',
    stack: 'frontend',
    track: 'state machine',
    title: 'A reducer over a union',
    brief:
      'Apply a list of actions to the initial state and return the final one. Immutable updates only: new arrays, new objects. The action union is the point — every case is typed.',
    difficulty: 'medium',
    xp: 70,
    mode: 'run',
    ts: true,
    starter: `interface Item { id: number; label: string; done: boolean }
interface State { items: Item[]; filter: 'all' | 'open' | 'done' }

type Action =
  | { type: 'add'; item: Item }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number }
  | { type: 'filter'; filter: State['filter'] };

function solve(data: { state: State; actions: Action[] }): State {
  // TODO: reduce with a switch on action.type
  return data.state;
}`,
    solution: `interface Item { id: number; label: string; done: boolean }
interface State { items: Item[]; filter: 'all' | 'open' | 'done' }

type Action =
  | { type: 'add'; item: Item }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number }
  | { type: 'filter'; filter: State['filter'] };

function solve(data: { state: State; actions: Action[] }): State {
  return data.actions.reduce((state, action) => {
    switch (action.type) {
      case 'add':
        return { ...state, items: [...state.items, action.item] };
      case 'toggle':
        return {
          ...state,
          items: state.items.map((i) => (i.id === action.id ? { ...i, done: !i.done } : i)),
        };
      case 'remove':
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      case 'filter':
        return { ...state, filter: action.filter };
      default:
        return state;
    }
  }, data.state);
}`,
    hint: 'Switch on action.type — inside each case TypeScript narrows the payload for you.',
    explain:
      'A discriminated union plus a switch gives exhaustiveness for free: add a new action type and the default branch is the only place that still compiles, which is exactly where you want the reminder. Spreading state and replacing one key keeps React re-rendering on identity change.',
    payload: {
      state: { items: [{ id: 1, label: 'Milk', done: false }, { id: 2, label: 'Bread', done: true }], filter: 'all' },
      actions: [
        { type: 'add', item: { id: 3, label: 'Coffee', done: false } },
        { type: 'toggle', id: 1 },
        { type: 'remove', id: 2 },
        { type: 'filter', filter: 'open' },
      ],
    },
    expected: '{ items: [{1 Milk done}, {3 Coffee open}], filter: "open" }',
  },
  {
    id: 'fe-optimistic',
    stack: 'frontend',
    track: 'cache update',
    title: 'Optimistic row patch',
    brief:
      'Before the server answers, patch one row in the cached list by id and leave the rest untouched. Only the matching row gets a new object reference — that is what keeps a memoised list from re-rendering everywhere.',
    difficulty: 'medium',
    xp: 65,
    mode: 'run',
    ts: true,
    starter: `interface Row { id: number; status: string; total_amount: number }

function solve(data: { rows: Row[]; patch: Partial<Row> & { id: number } }): Row[] {
  // TODO: map over rows, merge only the matching id
  return data.rows;
}`,
    solution: `interface Row { id: number; status: string; total_amount: number }

function solve(data: { rows: Row[]; patch: Partial<Row> & { id: number } }): Row[] {
  return data.rows.map((row) => (row.id === data.patch.id ? { ...row, ...data.patch } : row));
}`,
    hint: 'map returns the same object reference for untouched rows — that is the optimisation.',
    explain:
      'Returning `row` unchanged keeps referential equality for every other item, so React.memo children skip re-rendering. Rebuilding all rows with a spread would look identical on screen and quietly repaint the whole list. `Partial<Row> & { id: number }` says "any subset, but the id is required".',
    payload: {
      rows: [
        { id: 1, status: 'paid', total_amount: 120.5 },
        { id: 2, status: 'pending', total_amount: 89.99 },
        { id: 3, status: 'paid', total_amount: 240 },
      ],
      patch: { id: 2, status: 'paid', total_amount: 99.99 },
    },
    expected: 'Row 2 merged with the patch; rows 1 and 3 are the same objects as before.',
  },
  {
    id: 'fe-validate',
    stack: 'frontend',
    track: 'forms',
    title: 'Return errors, not booleans',
    brief:
      'Validate a signup form and return a Partial<Record<field, message>>. Only failing fields get a key — an empty object means the form is valid.',
    difficulty: 'medium',
    xp: 65,
    mode: 'run',
    ts: true,
    starter: `type Values = { email: string; password: string; age: number };
type Errors = Partial<Record<keyof Values, string>>;

function solve(values: Values): Errors {
  // TODO: email shape, password length, age gate
  return {};
}`,
    solution: `type Values = { email: string; password: string; age: number };
type Errors = Partial<Record<keyof Values, string>>;

function solve(values: Values): Errors {
  const errors: Errors = {};
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }
  if (values.age < 18) {
    errors.age = 'You must be 18 or older.';
  }
  return errors;
}`,
    hint: 'Partial<Record<keyof Values, string>> means every field is optional — add keys only on failure.',
    explain:
      'Returning a map of messages instead of a boolean lets the form render each field error independently and keeps the "is it valid?" check as Object.keys(errors).length === 0. keyof Values ties the error keys to the form shape, so renaming a field breaks the type rather than silently dropping the message.',
    payload: { email: 'ada@', password: 'short', age: 15 },
    expected: '{ email: "…", password: "…", age: "…" } — three messages, one per failed rule.',
  },
  {
    id: 'fe-flatten-tree',
    stack: 'frontend',
    track: 'recursion',
    title: 'Flatten a nav tree',
    brief:
      'Depth-first flatten of a nested nav into rows the list component can window: each row carries its depth and a breadcrumb path. Parents come before their children.',
    difficulty: 'hard',
    xp: 100,
    mode: 'run',
    ts: true,
    starter: `interface Node { id: string; label: string; children?: Node[] }
interface FlatRow { id: string; label: string; depth: number; path: string }

function solve(tree: Node[]): FlatRow[] {
  // TODO: walk depth-first, pushing a row before recursing into children
  return [];
}`,
    solution: `interface Node { id: string; label: string; children?: Node[] }
interface FlatRow { id: string; label: string; depth: number; path: string }

function solve(tree: Node[]): FlatRow[] {
  const rows: FlatRow[] = [];
  const walk = (nodes: Node[], depth: number, parentPath: string) => {
    for (const node of nodes) {
      const path = parentPath ? parentPath + ' / ' + node.label : node.label;
      rows.push({ id: node.id, label: node.label, depth, path });
      if (node.children?.length) walk(node.children, depth + 1, path);
    }
  };
  walk(tree, 0, '');
  return rows;
}`,
    hint: 'Push the row first, then recurse with depth + 1 — the order is the whole algorithm.',
    explain:
      'Virtualised trees need a flat array with depth metadata: the renderer draws one row per entry and indents by depth, so expanding a node is just inserting its children after it. Pushing before recursing is what guarantees pre-order. The path string is what an "expand to this item" feature matches on.',
    payload: [
      {
        id: 'a',
        label: 'Dashboard',
        children: [{ id: 'a1', label: 'Reports' }, { id: 'a2', label: 'Exports', children: [{ id: 'a2a', label: 'CSV' }] }],
      },
      { id: 'b', label: 'Settings' },
    ],
    expected: 'Dashboard(0) → Reports(1) → Exports(1) → CSV(2) → Settings(0), with paths like "Dashboard / Exports / CSV".',
  },
  {
    id: 'fe-memo-diff',
    stack: 'frontend',
    track: 'performance',
    title: 'Shallow diff for memo',
    brief:
      'Return the sorted keys whose value actually changed between prev and next, using Object.is. This is the check React.memo runs — knowing which prop broke the memo is how you debug a re-render storm.',
    difficulty: 'hard',
    xp: 95,
    mode: 'run',
    ts: true,
    starter: `function solve(data: { prev: Record<string, unknown>; next: Record<string, unknown> }): string[] {
  // TODO: union of keys, keep the ones where Object.is fails
  return [];
}`,
    solution: `function solve(data: { prev: Record<string, unknown>; next: Record<string, unknown> }): string[] {
  const keys = new Set([...Object.keys(data.prev), ...Object.keys(data.next)]);
  return [...keys].filter((key) => !Object.is(data.prev[key], data.next[key])).sort();
}`,
    hint: 'Union both key sets — an added or removed prop is a change too.',
    explain:
      'Object.is differs from === only for NaN and -0, and it is what React uses for shallow comparison. Taking the union of keys matters: a prop that appears only in next would be missed by iterating prev alone. Sorted output keeps the result stable for display and for tests.',
    payload: {
      prev: { title: 'Orders', count: 10, page: 1, rows: [1, 2] },
      next: { title: 'Orders', count: 11, page: 1, rows: [1, 2] },
    },
    expected: '["count"] — title, page and rows are referentially equal.',
  },

  /* ------------------------------- PHP ------------------------------- */
  {
    id: 'php-array-fns',
    stack: 'php',
    track: 'arrays',
    title: 'Filter, then reduce',
    brief:
      'Sum total_amount for paid orders only, using array_filter and array_reduce — no foreach loop.',
    difficulty: 'easy',
    xp: 40,
    mode: 'static',
    starter: `function paidTotal(array $orders): float {
    // TODO: array_filter for status === 'paid', then array_reduce to sum
    return 0.0;
}`,
    solution: `function paidTotal(array $orders): float {
    $paid = array_filter($orders, fn ($o) => $o['status'] === 'paid');
    return array_reduce($paid, fn ($sum, $o) => $sum + $o['total_amount'], 0.0);
}`,
    hint: 'array_filter($orders, fn ($o) => $o["status"] === "paid"), then array_reduce with a 0.0 seed.',
    explain:
      'array_filter preserves keys, so the filtered array is sparse — fine for reduce, dangerous for JSON encoding. array_reduce threads an accumulator through every element; the third argument is the starting value.',
    payload: `$orders = [
  ['id' => 1, 'status' => 'paid',      'total_amount' => 120.50],
  ['id' => 2, 'status' => 'pending',   'total_amount' => 89.99],
  ['id' => 3, 'status' => 'paid',      'total_amount' => 240.00],
];`,
    must: ['array_filter\\(', 'array_reduce\\('],
    expected: '360.5 — only the two paid orders are summed.',
  },
  {
    id: 'php-null-coalescing',
    stack: 'php',
    track: 'null safety',
    title: 'Fallback chain',
    brief:
      'Return display_name, falling back to username, then to "anonymous" — without triggering an undefined-index warning.',
    difficulty: 'easy',
    xp: 35,
    mode: 'static',
    starter: `function displayName(array $row): string {
    // TODO: null coalescing chain
    return '';
}`,
    solution: `function displayName(array $row): string {
    return $row['display_name'] ?? $row['username'] ?? 'anonymous';
}`,
    hint: '?? short-circuits: the right side is only evaluated when the left is null or missing.',
    explain:
      '?? checks existence and null at once, suppressing the undefined-index warning. Chaining works left to right, so the first defined non-null value wins. Unlike isset(), it also works with expressions, not just variables.',
    payload: `displayName(['username' => 'ada']);        // "ada"
displayName(['display_name' => 'Ada L']);   // "Ada L"
displayName([]);                            // "anonymous"`,
    must: ['\\?\\?'],
    expected: '"ada" / "Ada L" / "anonymous" — no warnings emitted.',
  },
  {
    id: 'php-collections',
    stack: 'php',
    track: 'collections',
    title: 'Group with Collections',
    brief:
      'Group orders by user_id and sum total_amount per user using Laravel Collections: collect → groupBy → map. Return the collection.',
    difficulty: 'medium',
    xp: 65,
    mode: 'static',
    starter: `function totalsByUser(array $orders) {
    // collect($orders)->groupBy(...)->map(...)
    return collect();
}`,
    solution: `function totalsByUser(array $orders) {
    return collect($orders)
        ->groupBy('user_id')
        ->map(fn ($group) => $group->sum('total_amount'));
}`,
    hint: 'groupBy returns a Collection of Collections — each group can call ->sum("total_amount").',
    explain:
      'Collections wrap arrays with a fluent API. groupBy("user_id") produces a keyed collection whose values are themselves collections, so each group can be aggregated independently. This is the PHP answer to reduce-with-a-map.',
    payload: `collect([
  ['user_id' => 1, 'total_amount' => 120.50],
  ['user_id' => 2, 'total_amount' => 89.99],
  ['user_id' => 1, 'total_amount' => 240.00],
])->groupBy('user_id')->map(fn ($g) => $g->sum('total_amount'));`,
    must: ['collect\\(', '->groupBy\\(', '->map\\('],
    expected: 'Collection { 1 => 360.5, 2 => 89.99 }',
  },
  {
    id: 'php-match',
    stack: 'php',
    track: 'PHP 8',
    title: 'match, not switch',
    brief:
      'Given an OrderStatus enum, return a human label using a match expression. Handle Paid, Pending, Cancelled, Refunded.',
    difficulty: 'medium',
    xp: 65,
    mode: 'static',
    starter: `enum OrderStatus: string {
    case Paid = 'paid';
    case Pending = 'pending';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';
}

function label(OrderStatus $status): string {
    // TODO: match expression
    return '';
}`,
    solution: `enum OrderStatus: string {
    case Paid = 'paid';
    case Pending = 'pending';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';
}

function label(OrderStatus $status): string {
    return match ($status) {
        OrderStatus::Paid => 'Payment captured',
        OrderStatus::Pending => 'Awaiting payment',
        OrderStatus::Cancelled => 'Cancelled by customer',
        OrderStatus::Refunded => 'Refund issued',
    };
}`,
    hint: 'match ($status) { OrderStatus::Paid => "Payment captured", ... }',
    explain:
      'match is an expression, so it returns a value directly. It uses strict === comparison (no loose casting), and an unmatched value throws UnhandledMatchError instead of silently falling through — which is exactly what you want for state machines.',
    payload: `label(OrderStatus::Paid);    // "Payment captured"
label(OrderStatus::Refunded); // "Refund issued"`,
    must: ['enum ', 'match \\(', '=>'],
    expected: '"Payment captured" for Paid, "Refund issued" for Refunded.',
  },
  {
    id: 'php-sort-stable',
    stack: 'php',
    track: 'arrays',
    title: 'Sort by amount, tie-break by id',
    brief:
      'Sort orders by total_amount descending. Ties must fall back to ascending id so the list is deterministic. One usort, one spaceship.',
    difficulty: 'medium',
    xp: 60,
    mode: 'static',
    starter: `function byAmountDesc(array $orders): array {
    // TODO: usort with a comparator that compares [amount, id]
    return $orders;
}`,
    solution: `function byAmountDesc(array $orders): array {
    usort($orders, fn ($a, $b) => [$b['total_amount'], $a['id']] <=> [$a['total_amount'], $b['id']]);
    return $orders;
}`,
    hint: 'Comparing two arrays with <=> compares element by element, left to right.',
    explain:
      'The spaceship operator on arrays compares index by index, so [amount, id] gives you a primary key and a tie-break in one expression. Swapping only the amount (b before a) makes it descending while the id stays ascending. PHP 8.0+ sort is stable, but an explicit tie-break survives refactors.',
    payload: `$orders = [
  ['id' => 1, 'total_amount' => 120.50],
  ['id' => 2, 'total_amount' => 240.00],
  ['id' => 3, 'total_amount' => 120.50],
];
byAmountDesc($orders);`,
    must: ['usort\\(', '<=>'],
    expected: 'id 2 first, then id 1, then id 3 — equal amounts keep ascending id order.',
  },
  {
    id: 'php-map-with-keys',
    stack: 'php',
    track: 'collections',
    title: 'Keyed lookup',
    brief:
      'Turn a list of orders into a collection keyed by order id, where each value is the total_amount. Use mapWithKeys.',
    difficulty: 'hard',
    xp: 90,
    mode: 'static',
    starter: `function amountById(array $orders) {
    // mapWithKeys(fn ($o) => [$o['id'] => $o['total_amount']])
    return collect();
}`,
    solution: `function amountById(array $orders) {
    return collect($orders)->mapWithKeys(
        fn ($o) => [$o['id'] => $o['total_amount']]
    );
}`,
    hint: 'The callback returns a single-pair array: [key => value].',
    explain:
      'mapWithKeys expects each callback to return an array of key => value pairs; those get merged into the result. It is the cleanest way to build an id → row lookup before an O(1) find.',
    payload: `collect([
  ['id' => 1, 'total_amount' => 120.50],
  ['id' => 3, 'total_amount' => 240.00],
])->mapWithKeys(fn ($o) => [$o['id'] => $o['total_amount']]);`,
    must: ['mapWithKeys\\('],
    expected: 'Collection { 1 => 120.5, 3 => 240.0 }',
  },
  {
    id: 'php-value-object',
    stack: 'php',
    track: 'PHP 8',
    title: 'An immutable value object',
    brief:
      'Build a final Money class with promoted readonly properties and an add() method that returns a new instance. No setters, no mutation.',
    difficulty: 'hard',
    xp: 90,
    mode: 'static',
    starter: `final class Money
{
    // TODO: promoted readonly constructor + add(Money $other): self
}`,
    solution: `final class Money
{
    public function __construct(
        public readonly int $amount,
        public readonly string $currency = 'USD',
    ) {}

    public function add(Money $other): self
    {
        return new self($this->amount + $other->amount, $this->currency);
    }
}`,
    hint: 'Constructor property promotion puts public readonly int $amount straight into the signature.',
    explain:
      'readonly makes the property writable once, inside the constructor, and throws on any later assignment. Combined with final and a self-returning add(), the class behaves like a value: two instances with the same amount are interchangeable, and no caller can change one behind your back.',
    payload: `$a = new Money(1250);
$b = new Money(750);
$total = $a->add($b);   // Money(2000, 'USD')
$total->amount = 0;     // Error: Cannot modify readonly property`,
    must: ['readonly ', '__construct\\(', 'function add', ': self'],
    expected: 'Money(2000, "USD") returned as a new instance; the readonly write throws.',
  },
];

export function challengesByStack(stack: Stack): Challenge[] {
  return CHALLENGES.filter((c) => c.stack === stack);
}

export function findChallenge(id: string | null): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/** Drop comments and all whitespace so two snippets can be compared by substance. */
function normalizeCode(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    .replace(/\s/g, '');
}

export function staticCheck(code: string, challenge: Challenge): { ok: boolean; message: string } {
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '');

  // Compare like with like: the starter carries `// TODO` comments, the submission
  // above has already had its comments stripped. Normalising both sides keeps the
  // "nothing changed" guard from rejecting a correct answer on a heavily-commented starter.
  if (normalizeCode(code).length < normalizeCode(challenge.starter).length + 8) {
    return { ok: false, message: 'Nothing changed yet — replace the TODOs with real code.' };
  }

  const missing = (challenge.must ?? []).filter((pattern) => {
    try {
      return !new RegExp(pattern, 'm').test(stripped);
    } catch {
      return true;
    }
  });
  const forbidden = (challenge.mustNot ?? []).filter((pattern) => {
    try {
      return new RegExp(pattern, 'm').test(stripped);
    } catch {
      return false;
    }
  });

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Static check failed: ${missing.length} required construct${missing.length === 1 ? '' : 's'} not found. Compare with the hint.`,
    };
  }
  if (forbidden.length > 0) {
    return { ok: false, message: 'Static check failed: this challenge forbids one of the constructs you used.' };
  }
  return { ok: true, message: 'All required constructs present. Compare your output with the reference.' };
}
