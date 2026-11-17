export type Tier = "inner" | "crew" | "outer";
export type Kind = "inperson" | "video" | "call" | "text";

export interface Friend {
  id: string;
  name: string;
  tier: Tier;
  about?: string;
  /** Birthday as MM-DD (year not needed). */
  birthday?: string;
  createdAt: string;
}

export interface Interaction {
  id: string;
  friendId: string;
  kind: Kind;
  minutes: number;
  /** Local calendar date, YYYY-MM-DD. */
  occurredAt: string;
  note?: string;
  /** Shared by interactions logged together as one group hang. */
  groupId?: string;
}

export interface StockPick {
  friendId: string;
  /** Day the log was placed (YYYY-MM-DD). Hangs on or after it burn the log. */
  placedOn: string;
}

export interface Stockpile {
  /** Logs available per week. */
  size: number;
  /** Monday of the week these picks belong to (YYYY-MM-DD). */
  weekStart: string;
  picks: StockPick[];
}

export interface CampData {
  version: 1;
  friends: Friend[];
  interactions: Interaction[];
  stockpile?: Stockpile;
}
