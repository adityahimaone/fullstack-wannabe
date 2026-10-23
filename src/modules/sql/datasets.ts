import { faker } from '@faker-js/faker';

export interface Dataset {
  id: string;
  name: string;
  theme: string;
  blurb: string;
  accent: 'lime' | 'amber' | 'violet';
  tables: string[];
  buildScript: () => string;
}

type Row = (string | number | null)[];

function lit(value: string | number | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  return `'${value.replace(/'/g, "''")}'`;
}

function insert(table: string, columns: string[], rows: Row[]): string {
  if (rows.length === 0) return '';
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${rows
    .map((r) => `(${r.map(lit).join(', ')})`)
    .join(',\n')};\n`;
}

function stamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/* ------------------------------------------------------------------ */
/* 1. E-Commerce Empire                                                */
/* ------------------------------------------------------------------ */
function ecommerceScript(): string {
  faker.seed(101);
  const countries = ['Indonesia', 'Singapore', 'Japan', 'Germany', 'Brazil', 'Canada', 'India', 'Spain'];
  const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;
  const statusWeights = [3, 4, 4, 8, 2];

  const sql: string[] = [];
  sql.push(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  signup_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price REAL NOT NULL,
  stock INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  total_amount REAL NOT NULL,
  placed_at TEXT NOT NULL
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);
`);

  const userRows: Row[] = range(30).map((id) => {
    const name = faker.person.fullName();
    return [
      id,
      name,
      `${faker.helpers.slugify(name).toLowerCase().replace(/[^a-z]/g, '.')}${id}@example.dev`,
      pick(countries),
      day(faker.date.past({ years: 2 })),
      Math.random() > 0.18 ? 1 : 0,
    ];
  });
  sql.push(insert('users', ['id', 'full_name', 'email', 'country', 'signup_date', 'is_active'], userRows));

  const categories = ['Audio', 'Wearables', 'Home', 'Gaming', 'Photography', 'Office'];
  sql.push(
    insert(
      'categories',
      ['id', 'name', 'slug'],
      categories.map((name, i) => [i + 1, name, name.toLowerCase()]),
    ),
  );

  const adjectives = ['Aero', 'Pulse', 'Nimbus', 'Vertex', 'Lumen', 'Terra', 'Echo', 'Orbit'];
  const nouns = ['Headphones', 'Watch', 'Lamp', 'Controller', 'Camera', 'Keyboard', 'Speaker', 'Monitor'];
  const productRows: Row[] = [];
  const productPrices: number[] = [];
  for (let i = 1; i <= 24; i++) {
    const price = Number((faker.number.float({ min: 19, max: 899, fractionDigits: 2 })).toFixed(2));
    productPrices.push(price);
    productRows.push([
      i,
      faker.number.int({ min: 1, max: 6 }),
      `${adjectives[(i - 1) % adjectives.length]} ${nouns[(i - 1) % nouns.length]}`,
      `SKU-${String(i).padStart(4, '0')}`,
      price,
      faker.number.int({ min: 0, max: 120 }),
      stamp(faker.date.past({ years: 1 })),
    ]);
  }
  sql.push(
    insert('products', ['id', 'category_id', 'name', 'sku', 'price', 'stock', 'created_at'], productRows),
  );

  const orderRows: Row[] = [];
  const itemRows: Row[] = [];
  let itemId = 1;
  for (let orderId = 1; orderId <= 80; orderId++) {
    const itemCount = faker.number.int({ min: 1, max: 4 });
    let total = 0;
    for (let k = 0; k < itemCount; k++) {
      const productId = faker.number.int({ min: 1, max: 24 });
      const quantity = faker.number.int({ min: 1, max: 3 });
      const unitPrice = productPrices[productId - 1];
      total += quantity * unitPrice;
      itemRows.push([itemId++, orderId, productId, quantity, unitPrice]);
    }
    // weighted status
    const bucket = Math.random() * statusWeights.reduce((a, b) => a + b, 0);
    let acc = 0;
    let status: string = statuses[0];
    for (let s = 0; s < statuses.length; s++) {
      acc += statusWeights[s];
      if (bucket <= acc) {
        status = statuses[s];
        break;
      }
    }
    orderRows.push([
      orderId,
      faker.number.int({ min: 1, max: 30 }),
      status,
      Number(total.toFixed(2)),
      stamp(faker.date.recent({ days: 180 })),
    ]);
  }
  sql.push(
    insert('orders', ['id', 'user_id', 'status', 'total_amount', 'placed_at'], orderRows),
  );
  sql.push(
    insert('order_items', ['id', 'order_id', 'product_id', 'quantity', 'unit_price'], itemRows),
  );

  return sql.join('\n');
}

/* ------------------------------------------------------------------ */
/* 2. Social Media Network                                             */
/* ------------------------------------------------------------------ */
function socialScript(): string {
  faker.seed(202);
  const sql: string[] = [];
  sql.push(`
CREATE TABLE profiles (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  follower_count INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  caption TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  posted_at TEXT NOT NULL
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE likes (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL
);

CREATE TABLE follows (
  id INTEGER PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES profiles(id),
  following_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL
);
`);

  const profileRows: Row[] = range(30).map((id) => {
    const first = faker.person.firstName().toLowerCase();
    const last = faker.person.lastName().toLowerCase();
    return [
      id,
      `${first}${last.slice(0, 3)}${id}`,
      faker.person.fullName(),
      faker.lorem.sentence({ min: 4, max: 10 }),
      faker.number.int({ min: 0, max: 9000 }),
      stamp(faker.date.past({ years: 3 })),
    ];
  });
  sql.push(
    insert(
      'profiles',
      ['id', 'username', 'display_name', 'bio', 'follower_count', 'joined_at'],
      profileRows,
    ),
  );

  const postRows: Row[] = range(60).map((id) => [
    id,
    faker.number.int({ min: 1, max: 30 }),
    faker.lorem.sentence({ min: 4, max: 12 }).replace(/\.$/, ''),
    faker.number.int({ min: 0, max: 540 }),
    stamp(faker.date.recent({ days: 90 })),
  ]);
  sql.push(insert('posts', ['id', 'profile_id', 'caption', 'like_count', 'posted_at'], postRows));

  const commentRows: Row[] = range(120).map((id) => [
    id,
    faker.number.int({ min: 1, max: 60 }),
    faker.number.int({ min: 1, max: 30 }),
    faker.lorem.sentence({ min: 3, max: 10 }),
    stamp(faker.date.recent({ days: 60 })),
  ]);
  sql.push(
    insert('comments', ['id', 'post_id', 'profile_id', 'body', 'created_at'], commentRows),
  );

  const likePairs = new Set<string>();
  const likeRows: Row[] = [];
  let likeId = 1;
  while (likeRows.length < 150) {
    const post = faker.number.int({ min: 1, max: 60 });
    const profile = faker.number.int({ min: 1, max: 30 });
    const key = `${post}:${profile}`;
    if (likePairs.has(key)) continue;
    likePairs.add(key);
    likeRows.push([likeId++, post, profile, stamp(faker.date.recent({ days: 60 }))]);
  }
  sql.push(insert('likes', ['id', 'post_id', 'profile_id', 'created_at'], likeRows));

  const followPairs = new Set<string>();
  const followRows: Row[] = [];
  let followId = 1;
  while (followRows.length < 80) {
    const a = faker.number.int({ min: 1, max: 30 });
    const b = faker.number.int({ min: 1, max: 30 });
    if (a === b) continue;
    const key = `${a}:${b}`;
    if (followPairs.has(key)) continue;
    followPairs.add(key);
    followRows.push([followId++, a, b, stamp(faker.date.recent({ days: 200 }))]);
  }
  sql.push(insert('follows', ['id', 'follower_id', 'following_id', 'created_at'], followRows));

  return sql.join('\n');
}

/* ------------------------------------------------------------------ */
/* 3. Guild RPG Manager                                                */
/* ------------------------------------------------------------------ */
function rpgScript(): string {
  faker.seed(303);
  const sql: string[] = [];
  sql.push(`
CREATE TABLE guilds (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  faction TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  founded_at TEXT NOT NULL
);

CREATE TABLE heroes (
  id INTEGER PRIMARY KEY,
  guild_id INTEGER REFERENCES guilds(id),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL,
  gold INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE quests (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  reward_gold INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE inventory (
  id INTEGER PRIMARY KEY,
  hero_id INTEGER NOT NULL REFERENCES heroes(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  rarity TEXT NOT NULL
);

CREATE TABLE loot_drops (
  id INTEGER PRIMARY KEY,
  quest_id INTEGER NOT NULL REFERENCES quests(id),
  hero_id INTEGER NOT NULL REFERENCES heroes(id),
  item_name TEXT NOT NULL,
  dropped_at TEXT NOT NULL
);
`);

  const factions = ['Order of Ash', 'Tidebound', 'Ironroot', 'Nightglass', 'Sunforge', 'Verdant Pact'];
  sql.push(
    insert(
      'guilds',
      ['id', 'name', 'faction', 'member_count', 'founded_at'],
      factions.map((faction, i) => [
        i + 1,
        `${faction} ${pick(['Chapter', 'Lodge', 'Keep', 'Circle'])}`,
        faction,
        faker.number.int({ min: 3, max: 40 }),
        day(faker.date.past({ years: 6 })),
      ]),
    ),
  );

  const classes = ['Mage', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Warlock'];
  const heroRows: Row[] = range(24).map((id) => [
    id,
    Math.random() > 0.1 ? faker.number.int({ min: 1, max: 6 }) : null,
    faker.person.firstName(),
    pick(classes),
    faker.number.int({ min: 1, max: 60 }),
    faker.number.int({ min: 0, max: 9000 }),
  ]);
  sql.push(insert('heroes', ['id', 'guild_id', 'name', 'class', 'level', 'gold'], heroRows));

  const questTitles = [
    'The Ashen Gate',
    'Tide of Broken Oaths',
    'Roots Beneath the Keep',
    'A Glass Moon Rises',
    'Ember Cartography',
    'The Silent Pact',
    'Wolves at the Threshold',
    'Ledger of Lost Names',
    'The Hollow Bell',
    'Salt and Iron',
    'Ninefold Debt',
    'The Last Cartographer',
    'Cinders in the Archive',
    'Where the River Ends',
  ];
  const difficulties = ['easy', 'normal', 'hard', 'epic'];
  sql.push(
    insert(
      'quests',
      ['id', 'title', 'difficulty', 'reward_gold', 'is_active'],
      questTitles.map((title, i) => [
        i + 1,
        title,
        pick(difficulties),
        faker.number.int({ min: 50, max: 2400 }),
        Math.random() > 0.15 ? 1 : 0,
      ]),
    ),
  );

  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const items = ['Ember Shard', 'Tideglass', 'Ironroot Bark', 'Moonlit Thread', 'Ashen Sigil', 'Sunforged Nail'];
  const invRows: Row[] = range(60).map((id) => [
    id,
    faker.number.int({ min: 1, max: 24 }),
    pick(items),
    faker.number.int({ min: 1, max: 12 }),
    pick(rarities),
  ]);
  sql.push(insert('inventory', ['id', 'hero_id', 'item_name', 'quantity', 'rarity'], invRows));

  const lootRows: Row[] = range(90).map((id) => [
    id,
    faker.number.int({ min: 1, max: 14 }),
    faker.number.int({ min: 1, max: 24 }),
    pick(items),
    stamp(faker.date.recent({ days: 120 })),
  ]);
  sql.push(
    insert('loot_drops', ['id', 'quest_id', 'hero_id', 'item_name', 'dropped_at'], lootRows),
  );

  return sql.join('\n');
}

export const DATASETS: Dataset[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Empire',
    theme: 'Orders, revenue, retention',
    blurb: '30 customers, 24 products, 80 orders and every line item behind them.',
    accent: 'lime',
    tables: ['users', 'categories', 'products', 'orders', 'order_items'],
    buildScript: ecommerceScript,
  },
  {
    id: 'social',
    name: 'Social Network',
    theme: 'Graphs, engagement, reach',
    blurb: 'Profiles, posts, comments, likes and a follow graph with cycles.',
    accent: 'amber',
    tables: ['profiles', 'posts', 'comments', 'likes', 'follows'],
    buildScript: socialScript,
  },
  {
    id: 'rpg',
    name: 'Guild RPG Manager',
    theme: 'Ranking, loot, guild politics',
    blurb: 'Heroes, guilds, quests, inventory and loot drops — window functions love this one.',
    accent: 'violet',
    tables: ['guilds', 'heroes', 'quests', 'inventory', 'loot_drops'],
    buildScript: rpgScript,
  },
];

export function getDataset(id: string): Dataset | undefined {
  return DATASETS.find((d) => d.id === id);
}
