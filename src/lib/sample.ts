import { daysAgoToDay, toDay } from "./dates";
import type { CampData, Friend, Interaction, Kind, Tier } from "./types";

type Row = [name: string, tier: Tier, about: string, log: [Kind, number, number, string?][], birthday?: string];

const ROWS: Row[] = [
  ["Jake Morrison", "inner", "College roommate. Best man at your wedding.", [
    ["text", 15, 1, "Fantasy trade negotiations"], ["inperson", 120, 3, "Wings + the Sunday game"],
    ["call", 30, 9, "Talked about his new job"], ["inperson", 60, 12, "Gym session"]]],
  ["Tommy Alvarez", "inner", "Brother-in-law. Weekend golf partner.", [
    ["text", 20, 2, "Planning the spring trip"], ["inperson", 240, 5, "18 holes at Pine Ridge"], ["video", 30, 14]]],
  ["Dev Patel", "inner", "Childhood friend. Just had his first kid.", [
    ["text", 10, 2, "Sent baby pics"], ["video", 45, 8, "Catch-up call"], ["inperson", 180, 40, "Poker night"]]],
  ["Marcus Reed", "inner", "Old teammate. Going through a rough patch.", [
    ["text", 5, 12, "Quick “you good?”"], ["inperson", 90, 19, "Beers at Kelly’s"]]],
  ["Chris Nguyen", "crew", "Work friend turned real friend.", [
    ["text", 15, 5, "Group chat banter"], ["video", 40, 12, "Watched the fight together remotely"], ["text", 10, 20]]],
  ["Ben Carter", "crew", "Neighbor. Kids are the same age.", [["text", 5, 3, "Borrowed the ladder"], ["call", 25, 9]]],
  ["Sam Brooks", "crew", "Rec league basketball.", [["text", 5, 15], ["text", 10, 35]]],
  ["Ryan O’Connell", "crew", "Old fraternity brother. Moved to Denver.", [["inperson", 60, 70, "Summer BBQ"]]],
  ["Alex Kim", "outer", "Grad school classmate.", [["video", 30, 95, "Career advice chat"]]],
  ["Luis Ortega", "outer", "Former colleague.", [["text", 10, 45, "Congrats on the promotion"]]],
  ["Pete Wallace", "outer", "Cousin’s husband. Great fishing stories.", [["inperson", 120, 260, "Family reunion"]]],
  ["Mike Sullivan", "outer", "First manager. Gave you your break.", [["text", 5, 320, "Happy New Year"]]],
];

/** Demo camp with dates relative to `now`. */
export function sampleCamp(now: Date, uid: () => string): CampData {
  const friends: Friend[] = [];
  const interactions: Interaction[] = [];
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 4);
  const bday = `${String(soon.getMonth() + 1).padStart(2, "0")}-${String(soon.getDate()).padStart(2, "0")}`;
  ROWS.forEach(([name, tier, about, log], idx) => {
    const id = uid();
    friends.push({ id, name, tier, about, createdAt: toDay(now), birthday: idx === 4 ? bday : undefined });
    for (const [kind, minutes, days, note] of log) {
      interactions.push({ id: uid(), friendId: id, kind, minutes, occurredAt: daysAgoToDay(days, now), note });
    }
  });
  return { version: 1, friends, interactions };
}
