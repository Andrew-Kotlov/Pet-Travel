const { z } = require('zod');
const text = (max = 255) => z.string().trim().max(max);
const photo = text().refine(v => !v || (/^https:\/\//.test(v) && (() => { try { const u = new URL(v); return !u.username && !u.password; } catch { return false; } })()), 'Укажите публичный HTTPS-адрес фотографии');
const signup = z.object({name: text(80).min(2), email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(12).max(72).refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Пароль должен занимать не более 72 байт'), role: z.enum(['parent', 'sitter'])}).strict();
const login = z.object({email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(256)}).strict();
const common = {name: text(80).min(2), surname: text(80), mainPhoto: photo, country: text(100).min(1), city: text(100).min(1)};
const parentProfile = z.object({...common, title: text(160).min(2), introduction: text(4000), location: text(2000), responsibilities: text(4000)}).strict();
const animals = ['cats', 'dogs', 'reptiles', 'fish', 'smallPets', 'horses', 'birds'];
const sitterProfile = z.object({...common, aboutMe: text(4000).min(10), status: text(160), ...Object.fromEntries(animals.map(a => [a, z.boolean()]))}).strict();
const pet = z.object({petName: text(80).min(1), petAge: z.number().int().min(0).max(100).nullable(), type: z.enum(['cat','dog','bird','fish','reptile','smallPet','horse','other']), petPhoto: photo}).strict();
const message = z.object({type: z.literal('message'), recipientId: z.number().int().positive(), text: text(2000).min(1)}).strict();
const id = z.coerce.number().int().positive().max(2147483647);
function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) { const error = new Error('Проверьте заполнение полей'); error.status = 400; error.fields = [...new Set(result.error.issues.map(i => i.path.join('.')))]; throw error; }
  return result.data;
}
module.exports = { signup, login, parentProfile, sitterProfile, pet, message, id, parse, animals };
