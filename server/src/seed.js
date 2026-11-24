const bcrypt = require('bcryptjs');
const {createDatabase} = require('../db/models');
async function seed(db,password) {
  if (!password || Buffer.byteLength(password)<12 || Buffer.byteLength(password)>72) throw new Error('DEMO_PASSWORD must be 12–72 bytes');
  const hash = await bcrypt.hash(password,12);
  await db.sequelize.transaction(async transaction => {
    for (const [email,name,role] of [['owner@example.test','Демо Владелец','parent'],['sitter@example.test','Демо Ситтер','sitter']]) {
      const [user] = await db.User.findOrCreate({where:{email},defaults:{name,role,password:hash},transaction});
      if(role==='parent') {
        const [profile] = await db.ParentProfile.findOrCreate({where:{UserId:user.id},defaults:{country:'Пример',city:'Демо-город',title:'Знакомьтесь, мой питомец',introduction:'Вымышленный профиль для локальной разработки.'},transaction});
        await db.Pet.findOrCreate({where:{ParentProfileId:profile.id,petName:'Демо Барсик'},defaults:{type:'cat',petAge:3,petPhoto:''},transaction});
      } else await db.SitterProfile.findOrCreate({where:{UserId:user.id},defaults:{country:'Пример',city:'Демо-город',aboutMe:'Вымышленный профиль петситтера для проверки приложения.',cats:true,dogs:true},transaction});
    }
  });
}
if(require.main===module) {
  if(process.env.ALLOW_DEMO_SEED!=='true' || process.env.NODE_ENV==='production')throw new Error('Seed requires ALLOW_DEMO_SEED=true outside production');
  const db=createDatabase(process.env.DATABASE_URL,process.env.DB_SSL==='true');
  seed(db,process.env.DEMO_PASSWORD).then(() => console.log('Fictional seed data ready')).catch(() => {console.error('Seed failed');process.exitCode=1;}).finally(() => db.sequelize.close());
}
module.exports={seed};
