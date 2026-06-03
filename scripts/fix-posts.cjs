const{createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const{data:profiles}=await s.from('profiles').select('id').limit(250);
  const uids=profiles.map(p=>p.id);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const bodies=['Great session today courts were in perfect shape','Who is playing this Saturday morning','Just hit my first ace in a competitive match','Shoutout to staff for keeping courts pristine','New paddle day testing the Selkirk Vanguard','Love the new court lighting for evening sessions','Tournament next month looking for a 4.0 partner','Perfect morning for paddle 65 degrees no wind','Been playing 6 months and just broke 4.0 DUPR','Tips for improving my backhand need help','Wednesday night social is highlight of my week','Post-game smoothie after a 3-set battle','Congrats to the Thursday league winners','Anyone recommend good paddle tennis shoes','Brought a friend who never played they are hooked','The third shot drop finally clicks','Signed up for my first tournament any advice','Beautiful sunset game tonight','Looking to organize a round-robin this weekend','5 straight wins without dropping a game new PR','The community here keeps me coming back every day','Just completed my 100th booking on PaddleGrid','Teaching beginners is so rewarding to watch','Weekend warrior reporting for duty who needs a 4th','Upgraded to carbon fiber paddle control is unreal','My serve improved so much since recording myself','The 6am crew is the best crew early birds unite','Grateful for this community moved here knowing nobody','New member orientation was so welcoming love this club','The kitchen game is where matches are won and lost'];
  console.log('Creating 50 recent posts...');
  let pc=0;
  for(let i=0;i<50;i++){
    const daysAgo=rnd(0,6);
    const hoursAgo=rnd(1,23);
    const ca=new Date(Date.now()-daysAgo*86400000-hoursAgo*3600000);
    const r=await s.from('posts').insert({author_id:pick(uids),kind:'text',body:bodies[i%bodies.length],like_count:rnd(3,30),comment_count:rnd(1,12),created_at:ca.toISOString()});
    if(r.error){if(i===0)console.log('ERR:',r.error.message);}else{pc++;}
  }
  console.log(pc+' posts created');
  console.log('Adding likes...');
  const{data:posts}=await s.from('posts').select('id').order('created_at',{ascending:false}).limit(50);
  let lc=0;
  for(const post of (posts||[])){
    const n=rnd(3,15);
    const likers=uids.sort(()=>Math.random()-0.5).slice(0,n);
    for(const uid of likers){
      const r=await s.from('post_likes').insert({post_id:post.id,user_id:uid});
      if(r.data!==null)lc++;
    }
  }
  console.log(lc+' likes added');
  console.log('DONE - refresh your feed');
})().catch(e=>console.error(e.message));
