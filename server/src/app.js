const express = require('express');
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { randomUUID, randomBytes, timingSafeEqual } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Op, fn, col, where } = require('sequelize');
const V = require('./validation');
const { createLogger } = require('./logger');
const publicUser = user => user ? Object.fromEntries(['id','name','surname','role','mainPhoto'].map(k => [k,user[k]])) : null;
const csrf = req => req.session.csrfToken || (req.session.csrfToken = randomBytes(32).toString('hex'));
const save = req => new Promise((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
const regenerate = req => new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
function createApp({db, config, log = createLogger(config.LOG_LEVEL)}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  const pool = new Pool({connectionString: config.DATABASE_URL, ssl: config.DB_SSL === 'true' ? {rejectUnauthorized: true} : false, connectionTimeoutMillis: 5000, ...(config.schema ? {options: '-c search_path=' + config.schema} : {})});
  pool.on('error', () => log('error', 'session_database_error'));
  const store = new PgStore({pool, tableName: 'session', schemaName: config.schema || 'public', createTableIfMissing: false, errorLog: () => log('error','session_store_error')});
  const sessionParser = session({name:'pet_travel.sid', store, secret:config.SESSION_SECRET, resave:false, saveUninitialized:false, cookie:{httpOnly:true, secure:config.NODE_ENV === 'production', sameSite:'lax', maxAge:7*86400000}});
  app.use((req, res, next) => {
    req.requestId = randomUUID(); res.setHeader('X-Request-ID', req.requestId);
    const started = Date.now();
    res.on('finish', () => log(res.statusCode >= 500 ? 'error' : 'info', 'request', {requestId:req.requestId, method:req.method, status:res.statusCode, durationMs:Date.now()-started}));
    next();
  });
  app.use(helmet({contentSecurityPolicy:{directives:{"img-src":["'self'",'https:','data:']}}}));
  app.get('/health/live', (_req,res) => res.json({status:'ok'}));
  app.get('/health/ready', async (_req,res) => {
    if (app.locals.draining) return res.status(503).json({status:'not_ready'});
    try { await db.sequelize.query('SELECT 1 FROM "Users" LIMIT 1'); await pool.query('SELECT 1 FROM session LIMIT 1'); await db.sequelize.query('SELECT 1 FROM "Messages" LIMIT 1'); res.json({status:'ready'}); }
    catch { res.status(503).json({status:'not_ready'}); }
  });
  app.get('/version', (_req,res) => res.json({name:'pet-travel',version:require('../package.json').version}));
  app.use('/api', cors({origin(origin, callback) { callback(null, !origin || config.origins.includes(origin)); }, credentials:true, allowedHeaders:['Content-Type','X-CSRF-Token']}));
  app.use('/api', express.json({limit:'32kb'}), sessionParser);
  app.use('/api', (req,res,next) => {
    res.setHeader('Cache-Control','no-store');
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
    if (!config.origins.includes(req.headers.origin)) return res.status(403).json({error:'Недопустимый источник запроса'});
    const token = req.headers['x-csrf-token'];
    const expected = req.session.csrfToken;
    if (typeof token !== 'string' || !expected || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(token),Buffer.from(expected))) return res.status(403).json({error:'Обновите страницу и повторите действие'});
    next();
  });
  const authLimit = rateLimit({windowMs:15*60*1000, limit:config.NODE_ENV === 'test' ? 100 : 25, standardHeaders:'draft-8', legacyHeaders:false, message:{error:'Слишком много попыток. Попробуйте позже.'}});
  const dummyHash = bcrypt.hashSync('not-a-real-account-password', 12);
  async function establish(req, user) { await regenerate(req); req.session.userId = user.id; csrf(req); await save(req); }
  app.get('/api/auth/session', async (req,res) => {
    const user = req.session.userId ? await db.User.findByPk(req.session.userId) : null;
    res.json({user:publicUser(user),csrfToken:csrf(req)});
  });
  app.post('/api/auth/signup', authLimit, async (req,res) => {
    const data = V.parse(V.signup,req.body);
    const password = await bcrypt.hash(data.password,12);
    const user = await db.User.create({...data,password});
    await establish(req,user);
    res.status(201).json({user:publicUser(user),csrfToken:csrf(req)});
  });
  app.post('/api/auth/login', authLimit, async (req,res) => {
    const data = V.parse(V.login,req.body);
    const user = await db.User.findOne({where:where(fn('lower',col('email')),data.email)});
    const valid = await bcrypt.compare(data.password,user?.password || dummyHash);
    if (!user || !valid) return res.status(401).json({error:'Неверная почта или пароль'});
    await establish(req,user); res.json({user:publicUser(user),csrfToken:csrf(req)});
  });
  app.post('/api/auth/logout', async (req,res,next) => {
    const sid = req.sessionID;
    req.session.destroy(error => {
      if (error) return next(error);
      app.locals.closeSession?.(sid);
      res.clearCookie('pet_travel.sid',{httpOnly:true,secure:config.NODE_ENV==='production',sameSite:'lax',path:'/'});
      res.status(204).end();
    });
  });
  app.use('/api', async (req,res,next) => {
    const user = req.session.userId ? await db.User.findByPk(req.session.userId) : null;
    if (!user) return res.status(401).json({error:'Войдите в аккаунт'});
    req.user = user; next();
  });
  app.get('/api/profile', async (req,res) => {
    const Model = req.user.role === 'parent' ? db.ParentProfile : db.SitterProfile;
    const profile = await Model.findOne({where:{UserId:req.user.id}});
    res.json({user:publicUser(req.user),profile});
  });
  app.put('/api/profile', async (req,res) => {
    const isParent = req.user.role === 'parent';
    const data = V.parse(isParent ? V.parentProfile : V.sitterProfile,req.body);
    const {name,surname,mainPhoto,...fields} = data;
    const profile = await db.sequelize.transaction(async transaction => {
      await req.user.update({name,surname,mainPhoto},{transaction});
      const Model = isParent ? db.ParentProfile : db.SitterProfile;
      const [record] = await Model.findOrCreate({where:{UserId:req.user.id},defaults:fields,transaction});
      await record.update(fields,{transaction}); return record;
    });
    res.json({user:publicUser(req.user),profile});
  });
  app.use('/api/pets', async (req,res,next) => {
    if (req.user.role !== 'parent') return res.status(403).json({error:'Питомцы доступны владельцам животных'});
    req.parent = await db.ParentProfile.findOne({where:{UserId:req.user.id}});
    if (!req.parent) return res.status(409).json({error:'Сначала заполните профиль владельца'});
    next();
  });
  app.get('/api/pets', async (req,res) => res.json({pets:await db.Pet.findAll({where:{ParentProfileId:req.parent.id},order:[['id','ASC']]})}));
  app.post('/api/pets', async (req,res) => res.status(201).json({pet:await db.Pet.create({...V.parse(V.pet,req.body),ParentProfileId:req.parent.id})}));
  async function ownPet(req,res,next) {
    req.pet = await db.Pet.findOne({where:{id:V.parse(V.id,req.params.id),ParentProfileId:req.parent.id}});
    if (!req.pet) return res.status(404).json({error:'Питомец не найден'});
    next();
  }
  app.put('/api/pets/:id', ownPet, async (req,res) => res.json({pet:await req.pet.update(V.parse(V.pet,req.body))}));
  app.delete('/api/pets/:id', ownPet, async (req,res) => { await req.pet.destroy(); res.status(204).end(); });
  // A contact is addressed by an ID shared by its owner. No public directory or email enumeration.
  app.get('/api/chat/contacts/:id', async (req,res) => {
    const id = V.parse(V.id,req.params.id);
    const user = await db.User.findByPk(id);
    if (!user || id === req.user.id) return res.status(404).json({error:'Собеседник не найден'});
    res.json({user:publicUser(user)});
  });
  app.get('/api/chat/messages/:id', async (req,res) => {
    const id = V.parse(V.id,req.params.id);
    const before = req.query.before ? V.parse(V.id,req.query.before) : 2147483647;
    const messages = await db.Message.findAll({where:{id:{[Op.lt]:before},[Op.or]:[{senderId:req.user.id,recipientId:id},{senderId:id,recipientId:req.user.id}]},order:[['id','DESC']],limit:50});
    res.json({messages:messages.reverse(),hasMore:messages.length===50});
  });
  app.use('/api', (_req,res) => res.status(404).json({error:'Маршрут не найден'}));
  const path = require('node:path');
  const fs = require('node:fs');
  const dist = path.join(__dirname,'../../client/dist');
  if (fs.existsSync(path.join(dist,'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*path}', (req,res,next) => req.accepts('html') ? res.sendFile(path.join(dist,'index.html')) : next());
  }
  app.use((_req,res) => res.status(404).json({error:'Маршрут не найден'}));
  app.use((error,req,res,_next) => {
    let status = error.status || 500;
    if (error.name === 'SequelizeUniqueConstraintError') status = 409;
    if (error instanceof SyntaxError && error.type === 'entity.parse.failed') status = 400;
    const errorText = status === 409 ? 'Такая запись уже существует' : status === 400 ? 'Проверьте заполнение полей' : status === 413 ? 'Слишком большой запрос' : status < 500 ? error.message : 'Не удалось выполнить запрос';
    if (status >= 500) log('error','request_failed',{requestId:req.requestId});
    res.status(status).json({error:errorText,fields:error.fields,requestId:req.requestId});
  });
  return {app,sessionParser,store,pool,log};
}
module.exports = {createApp,publicUser};
