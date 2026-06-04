const{createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const{data:profiles}=await s.from('profiles').select('id,full_name').limit(250);
  const{data:courts}=await s.from('courts').select('id,hourly_rate,facility_id').limit(20);
  const uids=profiles.map(p=>p.id);
  const names=profiles.reduce((m,p)=>{m[p.id]=p.full_name;return m},{});
  const fid=courts[0].facility_id;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  console.log(uids.length+' users, '+courts.length+' courts, facility: '+fid);

  // MORE BOOKINGS - use minutes offset to avoid duplicates
  console.log('Creating bookings with unique time slots...');
  let bc=0;
  for(let d=30;d>=0;d--){
    const dt=new Date();dt.setDate(dt.getDate()-d);
    const ds=dt.toISOString().split('T')[0];
    const isWknd=dt.getDay()===0||dt.getDay()===6;
    const n=isWknd?rnd(35,55):rnd(18,35);
    for(let i=0;i<n;i++){
      const c=pick(courts);
      const hr=[6,7,7,8,8,8,9,9,9,10,10,11,12,14,15,16,16,17,17,17,18,18,19,19,20,21][rnd(0,25)];
      const min=rnd(0,1)*30;
      const dur=pick([1,1,1,1.5]);
      const endMin=min+(dur*60);
      const endHr=hr+Math.floor(endMin/60);
      const endM=endMin%60;
      const st=String(hr).padStart(2,'0')+':'+String(min).padStart(2,'0')+':00';
      const et=String(endHr).padStart(2,'0')+':'+String(endM).padStart(2,'0')+':00';
      const r=await s.from('bookings').insert({court_id:c.id,user_id:pick(uids),booking_date:ds,start_time:st,end_time:et,duration_hours:dur,total_amount:dur*(c.hourly_rate||30),status:'confirmed',facility_id:fid}).select('id').maybeSingle();
      if(r.data)bc++;
    }
    if(d%5===0)console.log('  day -'+d+': '+bc+' total');
  }
  console.log(bc+' bookings created');

  // MORE BLOCKS for Smart Analytics
  console.log('Creating availability blocks...');
  let blk=0;
  for(let d=60;d>=0;d--){
    const dt=new Date();dt.setDate(dt.getDate()-d);
    const ds=dt.toISOString().split('T')[0];
    const isWknd=dt.getDay()===0||dt.getDay()===6;
    const n=isWknd?rnd(30,50):rnd(15,30);
    const batch=[];
    for(let i=0;i<n;i++){
      const c=pick(courts);
      const hr=[6,7,8,8,9,9,10,10,11,12,14,16,16,17,17,18,18,19,20][rnd(0,18)];
      const min=rnd(0,1)*30;
      const dur=pick([1,1,1.5]);
      const endMin=min+(dur*60);
      const endHr=hr+Math.floor(endMin/60);
      const endM=endMin%60;
      const uid=pick(uids);
      batch.push({facility_id:fid,court_id:c.id,block_date:ds,start_time:String(hr).padStart(2,'0')+':'+String(min).padStart(2,'0')+':00',end_time:String(endHr).padStart(2,'0')+':'+String(endM).padStart(2,'0')+':00',block_type:'reservation',notes:names[uid]||'Reserved',player_count:rnd(2,4)});
    }
    const r=await s.from('court_availability_blocks').insert(batch);
    if(!r.error)blk+=batch.length;
  }
  console.log(blk+' blocks created');

  // RECENT POSTS - last 7 days
  console.log('Creating recent social posts...');
  const postBodies=['Great session today! Courts were in perfect shape','Who else is playing this Saturday morning?','Just hit my first ace in a competitive match!','Shoutout to the staff for keeping these courts pristine','New paddle day! Testing the Selkirk Vanguard','Love the new court lighting for evening sessions','Tournament next month - looking for a 4.0+ partner','Perfect morning for paddle - 65 degrees no wind','Been playing 6 months and just broke 4.0 DUPR!','Tips for improving my backhand? Need help','Wednesday night social is the highlight of my week','Post-game smoothie hits different after a 3-set battle','Congrats to the Thursday league winners!','Anyone recommend good paddle tennis shoes?','Brought a friend who never played - they are hooked now','That feeling when the third shot drop finally clicks','Signed up for my first tournament! Any advice?','Beautiful sunset game tonight - this is why I play','Looking to organize a round-robin this weekend','5 straight wins without dropping a game - new PR!','The community here keeps me coming back every day','Recovery day - ice bath after yesterday marathon session','Just completed my 100th booking on PaddleGrid!','Teaching beginners is so rewarding to watch','Weekend warrior reporting for duty - who needs a 4th?','That 30-shot dink rally was pure adrenaline','Upgraded to carbon fiber paddle - the control is unreal','Rain delay turned into great clubhouse hangout','My serve improved 200% since I started recording myself','Happy birthday to my doubles partner - 15 years strong','Evening lights plus great opponents equals perfect night','Can we appreciate how good this scheduling system is?','First time on Court 6 - those pickleball lines are perfect','Down 8-2 came back to win 11-9 - never give up','The 6am crew is the best crew - early birds unite','Grateful for this community - moved here knowing nobody','Just ordered matching team jerseys for league night','The kitchen game is where matches are won and lost','Anyone else obsessed with watching pro pickleball?','New member orientation was so welcoming - love this club'];
  let pc=0;
  for(let i=0;i<50;i++){
    const daysAgo=rnd(0,7);
    const hoursAgo=rnd(1,23);
    const ca=new Date(Date.now()-daysAgo*86400000-hoursAgo*3600000);
    const r=await s.from('posts').insert({author_id:pick(uids),club_id:fid,kind:'text',body:postBodies[i%postBodies.length],like_count:rnd(3,30),comment_count:rnd(1,12),created_at:ca.toISOString()});
    if(!r.error)pc++;else if(i===0)console.log('POST ERR:',r.error.message);
  }
  console.log(pc+' recent posts created');

  // POST LIKES for existing posts
  console.log('Adding likes to posts...');
  const{data:posts}=await s.from('posts').select('id').order('created_at',{ascending:false}).limit(60);
  let lc=0;
  for(const post of (posts||[])){
    const numLikes=rnd(3,20);
    const likers=uids.sort(()=>Math.random()-0.5).slice(0,numLikes);
    for(const uid of likers){
      const r=await s.from('post_likes').insert({post_id:post.id,user_id:uid});
      if(!r.error)lc++;
    }
  }
  console.log(lc+' post likes added');

  // COMMENTS on recent posts
  console.log('Adding comments...');
  const commentBodies=['Great job!','Congrats!','Count me in!','Impressive!','Keep it up!','Love this!','So true!','Same here!','Lets run it back!','Beast mode!','See you tomorrow!','Good luck!','Following this!','Thanks for sharing!','Love the energy!','Your game is looking solid!','I use HEAD Motion shoes - recommend!','Let me know if you need tips','Wednesday nights are legendary','Count me in next time!','Totally agree with this','What a match that was','You inspire me to play more','This club is the best','See you on the courts!'];
  let cc=0;
  const recentPosts=(posts||[]).slice(0,30);
  for(const post of recentPosts){
    const numComments=rnd(1,5);
    for(let c=0;c<numComments;c++){
      const r=await s.from('comments').insert({post_id:post.id,author_id:pick(uids),body:pick(commentBodies),created_at:new Date(Date.now()-rnd(0,7)*86400000).toISOString()});
      if(!r.error)cc++;else if(cc===0)console.log('COMMENT ERR:',r.error.message);
    }
  }
  console.log(cc+' comments added');

  console.log('\n=== BOOST COMPLETE ===');
  console.log('Go refresh your app - it should look alive now!');
})().catch(e=>console.error(e.message));
