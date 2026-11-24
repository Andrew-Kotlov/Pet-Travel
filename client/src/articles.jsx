import BirdsPets from "./components/Articles/BirdsPets/BirdsPets";
import CatSitterArticle from "./components/Articles/CatSitterArticle/CatSitterArticle";
import DogSitterArticle from "./components/Articles/DogSitterArticle/DogSitterArticle";
import DogSittingTips from "./components/Articles/DogSittingTips/DogSittingTips";
import DogsThatDontShed from "./components/Articles/DogsThatDontShed/DogsThatDontShed";
import GreatPhotosTips from "./components/Articles/GreatPhotosTips/GreatPhotosTips";
import LoveInDogLanguage from "./components/Articles/LoveInDogLanguage/LoveInDogLanguage";
import MaleVsFemaleDogs from "./components/Articles/MaleVsFemaleDogs/MaleVsFemaleDogs";
import TipsForSeniorPets from "./components/Articles/TipsForSeniorPets/TipsForSeniorPets";
export const articles = [
  {
    slug: "cat-sitters",
    title: "Кому доверить заботу о кошке",
    category: "Кошки",
    image: "cat",
    summary:
      "Кто такой кошачий ситтер, чем он помогает и что обсудить перед знакомством.",
    Component: CatSitterArticle,
  },
  {
    slug: "dog-sitters",
    title: "Знакомство с петситтером для собаки",
    category: "Собаки",
    image: "dog",
    summary:
      "Привычки, прогулки и спокойствие: готовимся к встрече с новым другом.",
    Component: DogSitterArticle,
  },
  {
    slug: "top-5-dog-sitting-tips",
    title: "5 советов ситтеру для собак",
    category: "Петситтерам",
    image: "dog",
    summary:
      "От первого знакомства до привычного распорядка — внимание к деталям.",
    Component: DogSittingTips,
  },
  {
    slug: "7-top-tips-for-senior-pets",
    title: "Забота о пожилом питомце",
    category: "Уход",
    image: "cat",
    summary: "Семь способов сделать повседневную жизнь любимца комфортнее.",
    Component: TipsForSeniorPets,
  },
  {
    slug: "how-to-take-great-pet-photos",
    title: "Как фотографировать любимца",
    category: "Уход",
    image: "cat",
    summary:
      "Свет, терпение и любимая игрушка. Простые советы для живых кадров.",
    Component: GreatPhotosTips,
  },
  {
    slug: "dogs-that-dont-shed",
    title: "8 пород собак, которые почти не линяют",
    category: "Собаки",
    image: "dog",
    summary: "Знакомимся с особенностями шерсти и ухода за разными породами.",
    Component: DogsThatDontShed,
  },
  {
    slug: "male-vs-female-dogs",
    title: "Выбираем друга: самец или самка",
    category: "Собаки",
    image: "dog",
    summary: "Характер, здоровье и ваши обстоятельства при выборе питомца.",
    Component: MaleVsFemaleDogs,
  },
  {
    slug: "how-to-show-love-in-dog-language",
    title: "Как сказать собаке «люблю»",
    category: "Собаки",
    image: "dog",
    summary: "Игры, общение и маленькие привычки, которые сближают.",
    Component: LoveInDogLanguage,
  },
  {
    slug: "reasons-birds-make-perfect-pets",
    title: "7 причин подружиться с птицей",
    category: "Другие питомцы",
    image: "bird",
    summary: "Умные, общительные и удивительные: знакомимся с пернатыми.",
    Component: BirdsPets,
  },
];
