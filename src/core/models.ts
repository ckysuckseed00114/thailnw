export const CLASSES = ['Sword','Spear','Wand','Axe','Dagger'] as const;
export type HeroClass = typeof CLASSES[number];
export const SLOTS = ['Weapon','Helmet','Armor','Shield','Boots','Ring','Amulet'] as const;
export type Slot = typeof SLOTS[number];
export const RARITIES = ['Common','Uncommon','Rare','Epic','Legendary','Mythic'] as const;
export type Rarity = typeof RARITIES[number];
export const ATTRIBUTES = ['Strength','Vitality','Agility','Defense','Vampirism'] as const;
export type Attribute = typeof ATTRIBUTES[number];
export const PETS = ['Leafhopper','Shellby','Craboulder','Emberkit'] as const;
export type Pet = typeof PETS[number];
export type Shrine = 'Fury'|'Fortune'|'Haste'|'Renewal';
export interface Item { id:number; slot:Slot; rarity:Rarity; name:string; base:number; forge:number; invested:number; locked:boolean }
export interface Enemy { id:number; name:string; hp:number; maxHp:number; damage:number; boss:boolean; attackAt:number; stunnedUntil:number; attacks:number; summons:number;
 /** Hall the enemy waits in (0 = left, 1 = right). Only the current wave fights; the rest wake when the hero walks in. */
 wave:number }
export interface Reward { lm:number; xp:number; bone:number; loot:number }
export interface Performance extends Reward { at:number; seconds:number }
export interface GameState {
 version:6; rng:number; serial:number; now:number; savedAt:number; started:boolean;
 hero:{ name:string; class:HeroClass; level:number; xp:number; hp:number; points:number; attributes:Record<Attribute,number> };
 lm:number; bone:number; inventory:Item[]; chest:Item[]; equipped:Partial<Record<Slot,number>>;
 floor:number; region:number; room:number; unlocked:number; cleared:number; autoAdvance:boolean; travelAt:number;
 enemies:Enemy[]; attackAt:number; petAt:number; respawnAt:number; nextRoomAt:number;
 /** Active hall wave; hallAt ends the walk into the next hall (0 = not walking); walkFrom starts the current hall or room walk. */
 wave:number; hallAt:number; walkFrom:number;
 /** Per-skill ready timestamps and auto-cast switches (missing = ready / auto on). See Skills.ts. */
 cooldowns:Record<string,number>; autoCast:Record<string,boolean>;
 /** Player-chosen enemy id for single-target attacks; 0 = automatic (front of the line). Cleared on each spawn. */
 target:number;
 shrine:{kind:Shrine; until:number}|null; pets:Record<Pet,{level:number;xp:number}>; pet:Pet; shield:boolean;
 kills:number; bosses:number; questClaims:string[]; history:Performance[]; afk:Reward & {seconds:number};
 log:string[];
}
export type Command = {type:'class';value:HeroClass;name?:string}|{type:'name';value:string}|{type:'allocate';value:Attribute}|{type:'equip'|'unequip'|'forge'|'salvage'|'lock';id:number}|{type:'claim'|'best'|'seal'|'advance'|'afk'}|{type:'pet';value:Pet}|{type:'feed';amount:number}|{type:'travel';region:number}|{type:'quest';id:string}|{type:'buy';offer:'potion'|'cache'}|{type:'cast';id:string}|{type:'autocast';id:string;value:boolean}|{type:'target';id:number};
/** `log` carries a journal line; `skill` and skill hits carry the skill id and element for the HUD. */
export interface GameEvent {type:'hit'|'skill'|'pet'|'death'|'room'|'summon'|'wake'|'log';target:number;source?:number;amount?:number;critical?:boolean;label?:string;skill?:string;element?:string}
export const REGIONS = ['Stone Halls','Mossbound Vault','Flooded Depths','The Catacombs','Ember Passage','Crystal Hollow','Sunken Sanctum','Ashen Keep','Obsidian Gate','Hollow Throne','The Abyss'];
export const SKILLS:Record<HeroClass,{name:string;mult:number}> = {Sword:{name:'Whirlwind',mult:2.15},Spear:{name:'Pierce',mult:2.6},Wand:{name:'Fireball',mult:2.7},Axe:{name:'Cleave',mult:3.1},Dagger:{name:'Shadow Step',mult:2}};
export const ROOMS = 8;
// Bounded storage keeps the LocalStorage save small; overflow drops are salvaged into Bone.
export const MAX_INVENTORY = 300;
export const MAX_CHEST = 150;
export const DEFAULT_NAME = 'Wanderer';
export const NAME_MAX = 16;
/** Normalises a player name, or returns null if it is not 2–16 letters, digits, spaces or _ ' . - (any script, e.g. Thai). */
export function cleanName(value:unknown):string|null{
 if(typeof value!=='string')return null;const name=value.normalize('NFC').replace(/\s+/g,' ').trim();const length=[...name].length;
 return length>=2&&length<=NAME_MAX&&/^[\p{L}\p{N}][\p{L}\p{M}\p{N} _'.-]*$/u.test(name)?name:null;
}
