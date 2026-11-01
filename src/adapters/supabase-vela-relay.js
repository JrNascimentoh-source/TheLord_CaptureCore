const SUPABASE_URL="https://aypjaqmmlurlqeotbepp.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cGphcW1tbHVybHFlb3RiZXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMDU2MTAsImV4cCI6MjEwNTg4MTYxMH0.IeAT6gwsAfzfw2N4BIxg9gc5pRqZH0ELn3Xo9fogHnY";
const TABLE_URL=SUPABASE_URL+"/rest/v1/velas";
const QUEUE_KEY="thelord_capturecore_pending_velas_v1";
const ALLOWED_GAMES=new Set(["aviator","aviator2"]);

function readQueue(storage){
  try{
    const value=JSON.parse(storage?.getItem(QUEUE_KEY)||"[]");
    return Array.isArray(value)?value.filter(item=>ALLOWED_GAMES.has(item?.game)): [];
  }catch{return [];}
}

export class SupabaseVelaRelay{
  constructor({fetchImpl=globalThis.fetch,storage=globalThis.localStorage}={}){
    this.fetchImpl=fetchImpl;
    this.storage=storage;
    this.sending=false;
  }
  save(queue){
    try{this.storage?.setItem(QUEUE_KEY,JSON.stringify(queue));return true;}
    catch{return false;}
  }
  async enqueue({game,value,detectedAt}){
    const numeric=Number(value);
    if(!ALLOWED_GAMES.has(game)||!Number.isFinite(numeric)||numeric<1||numeric>=1000000){
      return {ok:false,reason:"invalid-payload"};
    }
    const queue=readQueue(this.storage);
    queue.push({game,value:numeric,created_at:Number.isFinite(Date.parse(detectedAt))?new Date(detectedAt).toISOString():new Date().toISOString()});
    if(!this.save(queue))return {ok:false,reason:"queue-storage"};
    return this.flush();
  }
  async flush(){
    if(this.sending)return {ok:false,reason:"busy"};
    if(typeof this.fetchImpl!=="function")return {ok:false,reason:"fetch-unavailable"};
    this.sending=true;
    let sent=0;
    try{
      let queue=readQueue(this.storage);
      while(queue.length){
        const item=queue[0];
        let response;
        try{
          response=await this.fetchImpl(TABLE_URL,{
            method:"POST",
            headers:{
              apikey:SUPABASE_ANON_KEY,
              Authorization:"Bearer "+SUPABASE_ANON_KEY,
              "Content-Type":"application/json",
              Prefer:"return=minimal"
            },
            body:JSON.stringify({game:item.game,value:item.value,created_at:item.created_at})
          });
        }catch{return {ok:false,reason:"network",sent};}
        if(!response?.ok)return {ok:false,reason:"http-"+(response?.status||"unknown"),sent};
        queue.shift();
        if(!this.save(queue))return {ok:false,reason:"queue-storage",sent};
        sent++;
      }
      return {ok:true,sent};
    }finally{this.sending=false;}
  }
}
