import { State, Ledger, readState, reconcile, startGame, freshState } from './game';
export interface Persistence { read():Promise<string|null>; write(value:string):Promise<void>; readLedger():Promise<string|null>; writeLedger(value:string):Promise<void> }
// Serial writes prevent older keystrokes from overwriting newer saves.
export class GameRepository {
 state:State=freshState(); private tail:Promise<void>=Promise.resolve(); private starting=false; ready=false;
 constructor(private store:Persistence){}
 async load(){const [raw,ledger]=await Promise.all([this.store.read(),this.store.readLedger()]);this.state=reconcile(readState(raw),ledger?JSON.parse(ledger) as Ledger:null);await this.store.write(JSON.stringify(this.state));this.ready=true;return this.state;}
 save(state:State){if(!this.ready)throw Error('Not loaded');this.state=state;const value=JSON.stringify(state);const next=this.tail.catch(()=>{}).then(()=>this.store.write(value));this.tail=next;return next;}
 async start(date=new Date()){
  if(!this.ready||this.starting)return this.state;this.starting=true;
  try{await this.tail;const next=startGame(this.state,date);if(next===this.state)return this.state;
   const g=next.games[0];const ledger:Ledger={next:next.next,lastDay:next.lastDay,pending:{puzzleId:g.puzzleId,day:g.day,openedAt:g.openedAt}};
   // Reserve first. If writing the game fails, load() recovers this exact puzzle.
   await this.store.writeLedger(JSON.stringify(ledger));await this.save(next);return this.state;
  }finally{this.starting=false;}
 }
}
