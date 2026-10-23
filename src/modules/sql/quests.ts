export interface World {
  id: number;
  name: string;
  subtitle: string;
  focus: string;
  xp: number;
}

export interface Quest {
  id: string;
  world: number;
  title: string;
  brief: string;
  dataset: string;
  xp: number;
  hint: string;
  starter: string;
  solutions: string[];
  teaches: string[];
}

export const WORLDS: World[] = [
  {
    id: 1,
    name: 'The Basics',
    subtitle: 'SELECT & filtering',
    focus: 'Columns, aliases, DISTINCT, WHERE, IN, BETWEEN, LIKE',
    xp: 30,
  },
  {
    id: 2,
    name: 'Order & Bounds',
    subtitle: 'Sorting & pagination',
    focus: 'ORDER BY, LIMIT, OFFSET',
    xp: 40,
  },
  {
    id: 3,
    name: 'Aggregates',
    subtitle: 'Counting & grouping',
    focus: 'COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING',
    xp: 50,
  },
  {
    id: 4,
    name: 'The Art of the Join',
    subtitle: 'Relationships',
    focus: 'INNER, LEFT, multi-table joins',
    xp: 60,
  },
  {
    id: 5,
    name: 'Advanced Sorcery',
    subtitle: 'Subqueries & windows',
    focus: 'Subqueries, CTEs, CASE, window functions',
    xp: 80,
  },
];

export const QUESTS: Quest[] = [
  /* ------------------------------ World 1 ------------------------------ */
  {
    id: 'w1-1',
    world: 1,
    title: 'Every customer',
    brief: 'Return every column and every row from the users table. No filtering, no trimming.',
    dataset: 'ecommerce',
    xp: 30,
    hint: 'The asterisk is a wildcard for "all columns".',
    starter: '-- every column, every row\nSELECT ',
    solutions: ['SELECT * FROM users'],
    teaches: ['SELECT', '*'],
  },
  {
    id: 'w1-2',
    world: 1,
    title: 'Names and inboxes',
    brief: 'Return exactly two columns, in this order: full_name, then email — for all users.',
    dataset: 'ecommerce',
    xp: 30,
    hint: 'List the columns explicitly, separated by a comma.',
    starter: 'SELECT full_name, email\nFROM ',
    solutions: ['SELECT full_name, email FROM users'],
    teaches: ['SELECT', 'columns'],
  },
  {
    id: 'w1-3',
    world: 1,
    title: 'Where do they live?',
    brief: 'Return the distinct set of countries in the users table. One column, no duplicates.',
    dataset: 'ecommerce',
    xp: 30,
    hint: 'DISTINCT removes duplicate values from the output.',
    starter: 'SELECT DISTINCT ',
    solutions: ['SELECT DISTINCT country FROM users'],
    teaches: ['DISTINCT'],
  },
  {
    id: 'w1-4',
    world: 1,
    title: 'Active Germans',
    brief: 'Return full_name and country for users who are active (is_active = 1) AND live in Germany.',
    dataset: 'ecommerce',
    xp: 35,
    hint: 'Two conditions, joined with AND.',
    starter: "SELECT full_name, country\nFROM users\nWHERE ",
    solutions: ["SELECT full_name, country FROM users WHERE is_active = 1 AND country = 'Germany'"],
    teaches: ['WHERE', 'AND'],
  },
  {
    id: 'w1-5',
    world: 1,
    title: 'Pattern hunting',
    brief: "Return name and sku for every product whose name contains the word 'Aero'.",
    dataset: 'ecommerce',
    xp: 35,
    hint: "LIKE with % on both sides matches anything around the word: '%Aero%'.",
    starter: "SELECT name, sku\nFROM products\nWHERE name LIKE ",
    solutions: ["SELECT name, sku FROM products WHERE name LIKE '%Aero%'"],
    teaches: ['LIKE'],
  },
  {
    id: 'w1-6',
    world: 1,
    title: 'The middle shelf',
    brief: 'Return name and price for products priced between 100 and 300 inclusive, cheapest first.',
    dataset: 'ecommerce',
    xp: 40,
    hint: 'BETWEEN is inclusive on both ends.',
    starter: 'SELECT name, price\nFROM products\nWHERE price BETWEEN ',
    solutions: ['SELECT name, price FROM products WHERE price BETWEEN 100 AND 300 ORDER BY price'],
    teaches: ['BETWEEN', 'ORDER BY'],
  },

  /* ------------------------------ World 2 ------------------------------ */
  {
    id: 'w2-1',
    world: 2,
    title: 'Newest signups',
    brief: 'Return full_name and signup_date for the 10 most recently registered users.',
    dataset: 'ecommerce',
    xp: 40,
    hint: 'DESC puts the newest first; LIMIT caps the rows.',
    starter: 'SELECT full_name, signup_date\nFROM users\nORDER BY ',
    solutions: ['SELECT full_name, signup_date FROM users ORDER BY signup_date DESC LIMIT 10'],
    teaches: ['ORDER BY', 'DESC', 'LIMIT'],
  },
  {
    id: 'w2-2',
    world: 2,
    title: 'Page two of the catalogue',
    brief: 'Return name and price of products 6–10 when sorted by price from most expensive to cheapest.',
    dataset: 'ecommerce',
    xp: 45,
    hint: 'Skip the first five rows with OFFSET 5, then take five.',
    starter: 'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 5 OFFSET ',
    solutions: ['SELECT name, price FROM products ORDER BY price DESC LIMIT 5 OFFSET 5'],
    teaches: ['LIMIT', 'OFFSET'],
  },
  {
    id: 'w2-3',
    world: 2,
    title: 'Biggest baskets',
    brief: 'Return id and total_amount for the three largest orders.',
    dataset: 'ecommerce',
    xp: 40,
    hint: 'Sort by total_amount descending, then LIMIT 3.',
    starter: 'SELECT id, total_amount\nFROM orders\nORDER BY ',
    solutions: ['SELECT id, total_amount FROM orders ORDER BY total_amount DESC LIMIT 3'],
    teaches: ['ORDER BY', 'LIMIT'],
  },
  {
    id: 'w2-4',
    world: 2,
    title: 'Bounty board',
    brief: 'Return title and reward_gold for the seven most valuable quests.',
    dataset: 'rpg',
    xp: 40,
    hint: 'Highest reward first — that is a DESC sort.',
    starter: 'SELECT title, reward_gold\nFROM quests\nORDER BY reward_gold DESC\n',
    solutions: ['SELECT title, reward_gold FROM quests ORDER BY reward_gold DESC LIMIT 7'],
    teaches: ['ORDER BY', 'LIMIT'],
  },
  {
    id: 'w2-5',
    world: 2,
    title: 'Leaderboard',
    brief: 'Return name and level for the 8 highest-level heroes. Break ties alphabetically by name.',
    dataset: 'rpg',
    xp: 50,
    hint: 'ORDER BY supports several keys: level DESC, name ASC.',
    starter: 'SELECT name, level\nFROM heroes\nORDER BY level DESC, ',
    solutions: ['SELECT name, level FROM heroes ORDER BY level DESC, name ASC LIMIT 8'],
    teaches: ['ORDER BY', 'multi-key sort'],
  },

  /* ------------------------------ World 3 ------------------------------ */
  {
    id: 'w3-1',
    world: 3,
    title: 'How many orders?',
    brief: 'Return a single value: the total number of rows in orders.',
    dataset: 'ecommerce',
    xp: 45,
    hint: 'COUNT(*) counts rows, including rows with NULLs.',
    starter: 'SELECT COUNT(*) FROM ',
    solutions: ['SELECT COUNT(*) FROM orders'],
    teaches: ['COUNT'],
  },
  {
    id: 'w3-2',
    world: 3,
    title: 'Orders by status',
    brief: 'Return two columns: status and the number of orders in that status, one row per status, ordered by status.',
    dataset: 'ecommerce',
    xp: 50,
    hint: 'GROUP BY status, then COUNT(*).',
    starter: 'SELECT status, COUNT(*)\nFROM orders\nGROUP BY ',
    solutions: ['SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status'],
    teaches: ['GROUP BY', 'COUNT'],
  },
  {
    id: 'w3-3',
    world: 3,
    title: 'Average shelf price',
    brief: 'Return category_id and the average product price per category, ordered by category_id.',
    dataset: 'ecommerce',
    xp: 50,
    hint: 'AVG(price) with GROUP BY category_id.',
    starter: 'SELECT category_id, AVG(price)\nFROM products\nGROUP BY ',
    solutions: ['SELECT category_id, AVG(price) FROM products GROUP BY category_id ORDER BY category_id'],
    teaches: ['AVG', 'GROUP BY'],
  },
  {
    id: 'w3-4',
    world: 3,
    title: 'Repeat buyers',
    brief: 'Return user_id and their order count, but only for users with 4 or more orders. Order by user_id.',
    dataset: 'ecommerce',
    xp: 60,
    hint: 'Filter on an aggregate with HAVING, not WHERE.',
    starter: 'SELECT user_id, COUNT(*)\nFROM orders\nGROUP BY user_id\nHAVING ',
    solutions: [
      'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING COUNT(*) >= 4 ORDER BY user_id',
    ],
    teaches: ['HAVING'],
  },
  {
    id: 'w3-5',
    world: 3,
    title: 'Delivered revenue',
    brief: "Return one value: the sum of total_amount for orders with status 'delivered'.",
    dataset: 'ecommerce',
    xp: 50,
    hint: 'SUM() ignores NULLs; WHERE narrows the rows first.',
    starter: "SELECT SUM(total_amount)\nFROM orders\nWHERE status = ",
    solutions: ["SELECT SUM(total_amount) FROM orders WHERE status = 'delivered'"],
    teaches: ['SUM', 'WHERE'],
  },
  {
    id: 'w3-6',
    world: 3,
    title: 'Hardest bounty per tier',
    brief: 'Return difficulty and the maximum reward_gold within that difficulty, ordered by difficulty.',
    dataset: 'rpg',
    xp: 55,
    hint: 'MAX(reward_gold) per difficulty.',
    starter: 'SELECT difficulty, MAX(reward_gold)\nFROM quests\nGROUP BY ',
    solutions: ['SELECT difficulty, MAX(reward_gold) FROM quests GROUP BY difficulty ORDER BY difficulty'],
    teaches: ['MAX', 'GROUP BY'],
  },

  /* ------------------------------ World 4 ------------------------------ */
  {
    id: 'w4-1',
    world: 4,
    title: 'Who paid?',
    brief: "Return order id, the customer's full_name and total_amount for every 'paid' order, ordered by order id.",
    dataset: 'ecommerce',
    xp: 60,
    hint: 'JOIN users u ON u.id = o.user_id.',
    starter: 'SELECT o.id, u.full_name, o.total_amount\nFROM orders o\nJOIN users u ON ',
    solutions: [
      "SELECT o.id, u.full_name, o.total_amount FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status = 'paid' ORDER BY o.id",
    ],
    teaches: ['INNER JOIN', 'aliases'],
  },
  {
    id: 'w4-2',
    world: 4,
    title: 'Everyone, even window shoppers',
    brief: 'Return every user id, full_name and their number of orders — including users with zero orders. Order by user id.',
    dataset: 'ecommerce',
    xp: 65,
    hint: 'LEFT JOIN keeps users with no matching order; COUNT(o.id) then yields 0.',
    starter: 'SELECT u.id, u.full_name, COUNT(o.id)\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nGROUP BY ',
    solutions: [
      'SELECT u.id, u.full_name, COUNT(o.id) FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id, u.full_name ORDER BY u.id',
    ],
    teaches: ['LEFT JOIN', 'COUNT'],
  },
  {
    id: 'w4-3',
    world: 4,
    title: 'What was actually delivered',
    brief: "Return order id, product name and quantity for delivered orders. Order by order id, then product name. Limit to 25 rows.",
    dataset: 'ecommerce',
    xp: 70,
    hint: 'Three tables: order_items → orders, order_items → products.',
    starter: 'SELECT o.id, p.name, oi.quantity\nFROM order_items oi\nJOIN orders o ON ',
    solutions: [
      "SELECT o.id, p.name, oi.quantity FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id WHERE o.status = 'delivered' ORDER BY o.id, p.name LIMIT 25",
    ],
    teaches: ['multi-table JOIN'],
  },
  {
    id: 'w4-4',
    world: 4,
    title: 'Follow graph',
    brief: 'Return the follower username and the followed username for the first 12 follow rows (ordered by follows.id).',
    dataset: 'social',
    xp: 70,
    hint: 'Join profiles twice — once as the follower, once as the followed.',
    starter: 'SELECT a.username, b.username\nFROM follows f\nJOIN profiles a ON ',
    solutions: [
      'SELECT a.username, b.username FROM follows f JOIN profiles a ON a.id = f.follower_id JOIN profiles b ON b.id = f.following_id ORDER BY f.id LIMIT 12',
    ],
    teaches: ['self-join', 'aliases'],
  },
  {
    id: 'w4-5',
    world: 4,
    title: 'Guild or lone wolf',
    brief: 'Return every hero name and their guild name — heroes without a guild must still appear, with a NULL guild. Order by hero id.',
    dataset: 'rpg',
    xp: 65,
    hint: 'LEFT JOIN guilds so guild-less heroes survive the join.',
    starter: 'SELECT h.name, g.name\nFROM heroes h\nLEFT JOIN guilds g ON ',
    solutions: [
      'SELECT h.name, g.name FROM heroes h LEFT JOIN guilds g ON g.id = h.guild_id ORDER BY h.id',
    ],
    teaches: ['LEFT JOIN', 'NULL'],
  },

  /* ------------------------------ World 5 ------------------------------ */
  {
    id: 'w5-1',
    world: 5,
    title: 'Order count per user (correlated)',
    brief: 'For every user, return full_name and their number of orders using a correlated subquery. Order by user id.',
    dataset: 'ecommerce',
    xp: 80,
    hint: 'A subquery in the SELECT list can reference the outer row.',
    starter: 'SELECT u.full_name,\n  (SELECT COUNT(*) FROM orders o WHERE ',
    solutions: [
      'SELECT u.full_name, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) FROM users u ORDER BY u.id',
    ],
    teaches: ['subquery', 'correlation'],
  },
  {
    id: 'w5-2',
    world: 5,
    title: 'Big spenders, with a CTE',
    brief: 'Using a CTE, return user_id and total spend for users who spent more than 500 in total. Order by spend descending.',
    dataset: 'ecommerce',
    xp: 85,
    hint: 'WITH spend AS (SELECT user_id, SUM(total_amount) ... ) SELECT ... FROM spend WHERE ...',
    starter: 'WITH spend AS (\n  SELECT user_id, SUM(total_amount) AS total\n  FROM orders\n  GROUP BY user_id\n)\nSELECT ',
    solutions: [
      'WITH spend AS (SELECT user_id, SUM(total_amount) AS total FROM orders GROUP BY user_id) SELECT user_id, total FROM spend WHERE total > 500 ORDER BY total DESC',
    ],
    teaches: ['CTE', 'WITH'],
  },
  {
    id: 'w5-3',
    world: 5,
    title: 'Bucket the baskets',
    brief: "Return order id, total_amount and a label: 'high' when the total is at least 1000, 'mid' when at least 400, otherwise 'low'. Order by id.",
    dataset: 'ecommerce',
    xp: 80,
    hint: 'CASE WHEN ... THEN ... WHEN ... THEN ... ELSE ... END.',
    starter: 'SELECT id, total_amount,\n  CASE\n    WHEN ',
    solutions: [
      "SELECT id, total_amount, CASE WHEN total_amount >= 1000 THEN 'high' WHEN total_amount >= 400 THEN 'mid' ELSE 'low' END FROM orders ORDER BY id",
    ],
    teaches: ['CASE WHEN'],
  },
  {
    id: 'w5-4',
    world: 5,
    title: 'Rank heroes inside their class',
    brief: 'Return class, name, level and a ROW_NUMBER ranking heroes within each class by level descending.',
    dataset: 'rpg',
    xp: 90,
    hint: 'ROW_NUMBER() OVER (PARTITION BY class ORDER BY level DESC).',
    starter: 'SELECT class, name, level,\n  ROW_NUMBER() OVER (PARTITION BY ',
    solutions: [
      'SELECT class, name, level, ROW_NUMBER() OVER (PARTITION BY class ORDER BY level DESC) FROM heroes',
    ],
    teaches: ['window function', 'ROW_NUMBER', 'PARTITION BY'],
  },
  {
    id: 'w5-5',
    world: 5,
    title: 'Guild gold ranking',
    brief: 'For heroes that belong to a guild, return guild_id, name, gold and a RANK within the guild ordered by gold descending.',
    dataset: 'rpg',
    xp: 90,
    hint: 'RANK() keeps ties; WHERE guild_id IS NOT NULL removes lone wolves.',
    starter: 'SELECT guild_id, name, gold,\n  RANK() OVER (PARTITION BY guild_id ORDER BY gold DESC)\nFROM heroes\nWHERE ',
    solutions: [
      'SELECT guild_id, name, gold, RANK() OVER (PARTITION BY guild_id ORDER BY gold DESC) FROM heroes WHERE guild_id IS NOT NULL',
    ],
    teaches: ['RANK', 'window function'],
  },
];

export function questsByWorld(world: number): Quest[] {
  return QUESTS.filter((q) => q.world === world);
}

export function findQuest(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function isWorldUnlocked(world: number, completed: string[]): boolean {
  if (world === 1) return true;
  const previous = questsByWorld(world - 1);
  const done = previous.filter((q) => completed.includes(q.id)).length;
  return done >= Math.ceil(previous.length * 0.8);
}
