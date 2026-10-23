import type { Stack } from '@/lib/progress';

export interface Challenge {
  id: string;
  stack: Stack;
  track: string;
  title: string;
  brief: string;
  xp: number;
  level: 'warmup' | 'core' | 'boss';
  mode: 'run' | 'static';
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

export const STACK_META: Record<Stack, { label: string; tagline: string; file: string; lang: 'go' | 'javascript' | 'php' }> = {
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
    xp: 55,
    level: 'warmup',
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
    xp: 60,
    level: 'core',
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
    xp: 55,
    level: 'core',
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
    xp: 60,
    level: 'core',
    mode: 'static',
    starter: `type User struct {
	Name string
	Age  int
}

// Rename must mutate the receiver, not a copy.
func (u *User) Rename(name string) {
	// TODO
}`,
    solution: `func (u *User) Rename(name string) {
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
    id: 'go-channels',
    stack: 'go',
    track: 'concurrency',
    title: 'Fan out, fan in',
    brief:
      'Sum a slice in parallel: one goroutine per part, each sending its value on a channel, the caller receiving the same number of values.',
    xp: 75,
    level: 'boss',
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

  /* ------------------------------ NODE ------------------------------- */
  {
    id: 'node-reduce',
    stack: 'node',
    track: 'array methods',
    title: 'Reduce the ledger',
    brief:
      'Return an object mapping each user_id to the total of all their orders (every status counts). Numbers, not strings.',
    xp: 50,
    level: 'warmup',
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
    xp: 55,
    level: 'core',
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
    xp: 50,
    level: 'core',
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
    xp: 65,
    level: 'core',
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
    xp: 70,
    level: 'boss',
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

  /* ------------------------------- PHP ------------------------------- */
  {
    id: 'php-array-fns',
    stack: 'php',
    track: 'arrays',
    title: 'Filter, then reduce',
    brief:
      'Sum total_amount for paid orders only, using array_filter and array_reduce — no foreach loop.',
    xp: 55,
    level: 'warmup',
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
    id: 'php-collections',
    stack: 'php',
    track: 'collections',
    title: 'Group with Collections',
    brief:
      'Group orders by user_id and sum total_amount per user using Laravel Collections: collect → groupBy → map. Return the collection.',
    xp: 60,
    level: 'core',
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
    id: 'php-null-coalescing',
    stack: 'php',
    track: 'null safety',
    title: 'Fallback chain',
    brief:
      'Return display_name, falling back to username, then to "anonymous" — without triggering an undefined-index warning.',
    xp: 50,
    level: 'core',
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
    id: 'php-match',
    stack: 'php',
    track: 'PHP 8',
    title: 'match, not switch',
    brief:
      'Given an OrderStatus enum, return a human label using a match expression. Handle Paid, Pending, Cancelled, Refunded.',
    xp: 60,
    level: 'core',
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
    solution: `function label(OrderStatus $status): string {
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
    id: 'php-map-with-keys',
    stack: 'php',
    track: 'collections',
    title: 'Keyed lookup',
    brief:
      'Turn a list of orders into a collection keyed by order id, where each value is the total_amount. Use mapWithKeys.',
    xp: 55,
    level: 'boss',
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
];

export function challengesByStack(stack: Stack): Challenge[] {
  return CHALLENGES.filter((c) => c.stack === stack);
}

export function findChallenge(id: string | null): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export function staticCheck(code: string, challenge: Challenge): { ok: boolean; message: string } {
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '');

  if (stripped.replace(/\s/g, '').length < challenge.starter.replace(/\s/g, '').length + 8) {
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
