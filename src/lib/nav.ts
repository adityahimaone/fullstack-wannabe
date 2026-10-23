import {
  Boxes,
  Braces,
  LayoutDashboard,
  Network,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  code: string;
  icon: LucideIcon;
  blurb: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Overview',
    short: 'Home',
    code: '00',
    icon: LayoutDashboard,
    blurb: 'Progress, badges, and the route ahead.',
  },
  {
    to: '/erd',
    label: 'Schema Studio',
    short: 'ERD',
    code: '01',
    icon: Boxes,
    blurb: 'Draw entities, wire relations, watch DDL compile.',
  },
  {
    to: '/sql',
    label: 'Query Arena',
    short: 'SQL',
    code: '02',
    icon: SquareTerminal,
    blurb: 'Five worlds of quests against live data.',
  },
  {
    to: '/dojo',
    label: 'Polyglot Dojo',
    short: 'Dojo',
    code: '03',
    icon: Braces,
    blurb: 'Maps, arrays, collections — by hand.',
  },
  {
    to: '/blueprint',
    label: 'API Blueprint',
    short: 'API',
    code: '04',
    icon: Network,
    blurb: 'Six layers from migration to router.',
  },
];
