const{createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const{data:profiles}=await s.from('profiles').select('id').limit(212);
  const{data:courts}=await s.from('courts').select('id,hourly_rate,facility_id').limit(20);
  const uids=profiles.map(p=>p.id);
  const fid=courts[0].facility_id;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  console.log('Creating bookings...');
  let bc=0;
  for(let d=56;d>=0;d--){
    const dt=new Date();dt.setDate(dt.getDate()-d);
    const ds=dt.toISOString().split('T')[0];
    const dow=dt.getDay();
    const n=Math.round((dow===0||dow===6?rnd(25,40):rnd(12,28))*(1+(56-d)/56*0.4));
    const batch=[];
    for(let i=0;i<n;i++){
      const c=pick(courts);
      const hr=[6,7,8,8,9,9,10,10,11,12,13,14,15,16,16,17,17,18,18,19,20,21][rnd(0,21)];
      const dur=Math.random()>0.3?1:1.5;
      const endHr=hr+dur;
      batch.push({court_id:c.id,user_id:pick(uids),booking_date:ds,start_time:String(hr).padStart(2,'0')+':00:00',end_time:String(Math.floor(endHr)).padStart(2,'0')+':'+String((endHr%1)*60).padStart(2,'0')+':00',duration_hours:dur,total_amount:dur*(c.hourly_rate||30),status:'confirmed',facility_id:fid});
    }
    const r=await s.from('bookings').insert(batch);
    if(r.error){if(d===56)console.log('BOOK ERR:',r.error.message);}else{bc+=batch.length;}
  }
  console.log(bc+' bookings created');
  console.log('Creating court blocks...');
  let blk=0;
  for(let d=56;d>=0;d--){
    const dt=new Date();dt.setDate(dt.getDate()-d);
    const ds=dt.toISOString().split('T')[0];
    const n=Math.round((dt.getDay()===0||dt.getDay()===6?rnd(20,35):rnd(10,25))*(1+(56-d)/56*0.4));
    const batch=[];
    for(let i=0;i<n;i++){
      const c=pick(courts);
      const hr=[7,8,8,9,9,10,11,16,16,17,17,18,19,20][rnd(0,13)];
      const dur=Math.random()>0.3?1:1.5;
      const endHr=hr+dur;
      batch.push({facility_id:fid,court_id:c.id,block_date:ds,start_time:String(hr).padStart(2,'0')+':00:00',end_time:String(Math.floor(endHr)).padStart(2,'0')+':'+String((endHr%1)*60).padStart(2,'0')+':00',block_type:'reservation',notes:pick(['James S','Sarah M','Carlos G','Brandon T','Emily R','Mike W','Priya K','Jordan C','Alex R','Connor P']),player_count:rnd(2,4)});
    }
    const r=await s.from('court_availability_blocks').insert(batch);
    if(r.error){if(d===56)console.log('BLOCK ERR:',r.error.message);}else{blk+=batch.length;}
  }
  console.log(blk+' blocks created');
  console.log('Creating posts...');
  const bodies=['Great session today','Looking for doubles partner Saturday','Just broke 4.0 DUPR','New paddle day Selkirk review soon','Wednesday night social is the best','Tournament next month who is in','My serve improved so much','Third shot drop finally clicked','Grateful for this community','Weekend warrior reporting for duty','Came back from 8-2 to win 11-9','Teaching beginners is rewarding','Post-game smoothie hits different','The 6am crew is the best crew','Evening lights plus great opponents','Scheduling system is so good','Recovery day ice bath time','Brought a friend they are hooked','Tips for improving backhand','New personal record 5 straight wins'];
  let pc=0;
  for(let i=0;i<60;i++){
    const ca=new Date(Date.now()-rnd(1,45)*86400000);
    const r=await s.from('posts').insert({author_id:pick(uids),club_id:Math.random()>0.3?fid:null,kind:'text',body:pick(bodies),like_count:rnd(2,20),comment_count:rnd(0,8),created_at:ca.toISOString()});
    if(r.error){if(i===0)console.log('POST ERR:',r.error.message);}else{pc++;}
  }
  console.log(pc+' posts created');
  console.log('Creating messages...');
  const{data:convos}=await s.from('conversations').select('id').limit(40);
  let mc=0;
  const threads=[['Hey want to play Saturday?','Absolutely 9am?','Perfect see you there'],['Great game today','Thanks same time next week?','Definitely'],['Tournament next month?','Looking for partner?','Lets do it'],['That last game was brutal','11-9 in the third','Rematch next week?','You are on']];
  for(const conv of (convos||[])){
    const t=pick(threads);
    const{data:members}=await s.from('conversation_members').select('user_id').eq('conversation_id',conv.id).limit(2);
    if(!members||members.length<2)continue;
    for(let m=0;m<t.length;m++){
      const r=await s.from('messages').insert({conversation_id:conv.id,sender_id:members[m%2].user_id,content:t[m],created_at:new Date(Date.now()-rnd(1,14)*86400000+m*rnd(120,1800)*1000).toISOString()});
      if(r.error){if(mc===0)console.log('MSG ERR:',r.error.message);break;}else{mc++;}
    }
  }
  console.log(mc+' messages created');
  console.log('DONE');
})().catch(e=>console.error(e.message))
