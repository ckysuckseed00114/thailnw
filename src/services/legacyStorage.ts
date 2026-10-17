/**
 * The project was renamed from Embermarch to Thailnw, which renamed every browser-storage key.
 * Reads a `thailnw.*` key and, when it is still missing, moves the value over from its old `embermarch.*` name.
 * keepOld leaves the old copy in place (used for the save, so a rollback can still find it).
 */
export function readStored(key:string,keepOld=false):string|null{
 const value=localStorage.getItem(key);if(value!==null)return value;
 const legacy=key.replace(/^thailnw\./,'embermarch.'),old=legacy===key?null:localStorage.getItem(legacy);
 if(old!==null){try{localStorage.setItem(key,old);if(!keepOld)localStorage.removeItem(legacy);}catch{/* still usable for this session */}}
 return old;
}
