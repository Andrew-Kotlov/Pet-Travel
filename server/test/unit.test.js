const {test}=require('node:test');
const assert=require('node:assert/strict');
const V=require('../src/validation');
const {readConfig}=require('../src/config');
const {publicUser}=require('../src/app');
const base={name:'Test owner',email:'Owner@EXAMPLE.TEST',password:'fictional-password-123',role:'parent'};
test('signup normalizes email and rejects unknown roles',()=>{assert.equal(V.parse(V.signup,base).email,'owner@example.test');assert.throws(()=>V.parse(V.signup,{...base,role:'admin'}));});
test('signup rejects weak and multibyte overlong passwords',()=>{for(const password of ['short','я'.repeat(40)])assert.throws(()=>V.parse(V.signup,{...base,password}));});
test('signup forbids mass assignment',()=>assert.throws(()=>V.parse(V.signup,{...base,id:1})));
test('pet validates age, species, photo URL and ownership fields',()=>{const p={petName:'Test cat',petAge:2,type:'cat',petPhoto:''};assert.equal(V.parse(V.pet,p).petAge,2);for(const patch of [{petAge:-1},{petAge:1.5},{petAge:101},{type:'invalid'},{petPhoto:'javascript:alert(1)'},{ParentProfileId:2}])assert.throws(()=>V.parse(V.pet,{...p,...patch}));});
test('chat rejects empty, overlong and forged-sender messages',()=>{const m={type:'message',recipientId:2,text:'hi'};assert.equal(V.parse(V.message,m).text,'hi');for(const patch of [{text:' '},{text:'x'.repeat(2001)},{senderId:1},{recipientId:-1}])assert.throws(()=>V.parse(V.message,{...m,...patch}));});
test('public user omits private account fields',()=>{const output=publicUser({id:1,name:'Test',role:'parent',email:'test@example.test',password:'secret',telegram:'private'});assert.equal(output.email,undefined);assert.equal(output.password,undefined);assert.equal(output.telegram,undefined);});
test('configuration fails closed without secrets and redacts values',()=>{assert.throws(()=>readConfig({}),/Invalid configuration/);assert.throws(()=>readConfig({DATABASE_URL:'not-a-secret-url',SESSION_SECRET:'s'}),e=>!e.message.includes('not-a-secret-url'));});
test('production requires secure origins and valid proxy depth',()=>{const base={DATABASE_URL:'postgresql://localhost/test',SESSION_SECRET:'x'.repeat(32),NODE_ENV:'production'};assert.throws(()=>readConfig(base),/HTTPS/);assert.throws(()=>readConfig({...base,ALLOWED_ORIGINS:'https://app.example.test',TRUST_PROXY:'true'}));assert.equal(readConfig({...base,ALLOWED_ORIGINS:'https://app.example.test'}).PORT,3001);});
test('profile payload cannot change role or account ownership',()=>{const p={name:'Test',surname:'',mainPhoto:'',country:'Test',city:'Test',title:'Home',introduction:'',location:'',responsibilities:''};assert.ok(V.parse(V.parentProfile,p));assert.throws(()=>V.parse(V.parentProfile,{...p,role:'sitter'}));assert.throws(()=>V.parse(V.parentProfile,{...p,UserId:2}));});
test('identifiers reject zero, arrays and SQL fragments',()=>{for(const id of [0,-1,'1 OR 1=1',2147483648])assert.throws(()=>V.parse(V.id,id));});

