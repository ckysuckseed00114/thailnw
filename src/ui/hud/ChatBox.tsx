import {useLayoutEffect,useRef,useState} from 'preact/hooks';
import {feed,type FeedEntry} from './gameSignal';
import {prefs,setPref} from './prefs';

type Tab='all'|'general'|'system'|'whisper';
const TABS:[Tab,string][]=[['all','ทั้งหมด'],['general','ทั่วไป'],['system','ระบบ'],['whisper','กระซิบ']];
const CHANNEL:Record<FeedEntry['channel'],string>={system:'ระบบ',general:'ทั่วไป',whisper:'กระซิบ'};
const pad=(n:number)=>String(n).padStart(2,'0');
const clock=(t:number)=>{const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
/** Tabbed message box (UI_UX_PLAN 2.6). Only the system journal exists until the online server adds player chat. */
export function ChatBox(){
 const [tab,setTab]=useState<Tab>('all');const open=prefs.value.chatOpen;const list=useRef<HTMLOListElement>(null);const stick=useRef(true);
 const entries=feed.value.filter(m=>tab==='all'||m.channel===tab);const latest=feed.value[feed.value.length-1];
 // Keep following new messages unless the reader has scrolled up to read history.
 useLayoutEffect(()=>{const el=list.current;if(el&&stick.current)el.scrollTop=el.scrollHeight;},[entries.length,tab,open]);
 if(!open)return <button type="button" class="chat chat-min" onClick={()=>setPref('chatOpen',true)} aria-label="เปิดกล่องข้อความ" title="เปิดกล่องข้อความ">
  <span class="chat-tag">{latest?CHANNEL[latest.channel]:'ระบบ'}</span><span class="chat-min-text">{latest?.text??'ยังไม่มีข้อความ'}</span><span aria-hidden="true">▴</span>
 </button>;
 return <section class="chat" aria-label="กล่องข้อความ">
  <div class="chat-tabs" role="tablist">
   {TABS.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} class={tab===id?'on':''} onClick={()=>setTab(id)}>{label}</button>)}
   <button type="button" class="chat-close" aria-label="ย่อกล่องข้อความ" title="ย่อ" onClick={()=>setPref('chatOpen',false)}>▾</button>
  </div>
  <ol ref={list} class="chat-list" aria-live="polite" onScroll={e=>{const el=e.currentTarget;stick.current=el.scrollHeight-el.scrollTop-el.clientHeight<24;}}>
   {entries.length?entries.map(m=><li key={m.id}><time>{clock(m.at)}</time><span class={`chat-tag ${m.channel}`}>[{CHANNEL[m.channel]}]</span> {m.text}</li>)
    :<li class="chat-empty">{tab==='general'||tab==='whisper'?'แชตผู้เล่นจะเปิดเมื่อเชื่อมต่อเซิร์ฟเวอร์ออนไลน์':'ยังไม่มีข้อความ'}</li>}
  </ol>
  <input class="chat-input" readOnly placeholder="แชตออนไลน์ยังไม่เปิด (รอเซิร์ฟเวอร์)" aria-label="ช่องพิมพ์ข้อความ (ยังไม่เปิดใช้)"/>
 </section>;
}
