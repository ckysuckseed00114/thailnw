import type {ComponentChildren} from 'preact';

/** Original corner ornament: a curling flame leaf (kranok-inspired), drawn in currentColor. */
function Corner({at}:{at:'tl'|'tr'|'bl'|'br'}){
 return <svg class={`tf-corner ${at}`} viewBox="0 0 18 18" aria-hidden="true"><path d="M1 17V6c0-3 2-5 5-5h11" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 13c0-4 2-8 7-8-2 1-3 3-2 5-2-1-4 0-5 3z" fill="currentColor"/><circle cx="3" cy="3" r="2" fill="currentColor"/></svg>;
}
export function Frame({children,tone='wood',ornate=true,class:className='',...rest}:{children?:ComponentChildren;tone?:'wood'|'ink';ornate?:boolean;class?:string}&Record<string,unknown>){
 return <div class={`tf-frame ${tone==='ink'?'ink':''} ${className}`} {...rest}>
  {ornate&&<><Corner at="tl"/><Corner at="tr"/><Corner at="bl"/><Corner at="br"/></>}
  {children}
 </div>;
}
export function Bar({kind,value,max,label}:{kind:'hp'|'sp'|'xp';value:number;max:number;label?:string}){
 const pct=max>0?Math.max(0,Math.min(100,value/max*100)):0;
 return <div class={`tf-bar ${kind}`} role="meter" aria-label={label??kind.toUpperCase()} aria-valuemin={0} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(value)}>
  <i style={{width:`${pct}%`}}/>{kind!=='xp'&&<b>{Math.floor(value).toLocaleString()} / {Math.floor(max).toLocaleString()}</b>}
 </div>;
}
