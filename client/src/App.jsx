import { useEffect, useState, useRef } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Protected, useAuth } from "./auth";
import { articles } from "./articles";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
export function Paw({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="22" cy="15" rx="7" ry="10" />
      <ellipse cx="42" cy="15" rx="7" ry="10" />
      <ellipse cx="9" cy="32" rx="6" ry="9" />
      <ellipse cx="55" cy="32" rx="6" ry="9" />
      <path d="M15 49c-3-8 8-22 17-22s20 14 17 22-12 8-17 4c-5 4-14 4-17-4" />
    </svg>
  );
}
function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Pet&Travel — главная">
            <Paw />
            <span>
              Pet<span className="brand-accent">&Travel</span>
              <small>Рядом с теми, кого любим</small>
            </span>
          </Link>
          <button
            className="menu-toggle secondary"
            aria-expanded={open}
            aria-controls="navigation"
            onClick={() => setOpen(!open)}
          >
            Меню
          </button>
          <nav
            id="navigation"
            className={open ? "navigation is-open" : "navigation"}
            aria-label="Основная навигация"
          >
            <NavLink to="/" end>
              Главная
            </NavLink>
            <NavLink to="/articles">Статьи</NavLink>
            <NavLink to="/aboutus">О проекте</NavLink>
            {user ? (
              <>
                <NavLink to="/chat">Сообщения</NavLink>
                <NavLink to="/profile" className="nav-profile">
                  Мой профиль
                </NavLink>
                <button
                  className="text-button"
                  onClick={async () => {
                    try {
                      await logout();
                      setError("");
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <NavLink to="/signin">Войти</NavLink>
                <Link className="button small" to="/signup">
                  Присоединиться
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {error && (
        <p className="error container" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="brand">
            <Paw />
            <span>Pet&Travel</span>
          </Link>
          <p>
            Большая забота о маленьких друзьях.
            <br />И о тех, кто всегда рядом с ними.
          </p>
        </div>
        <div>
          <h2>Знакомство</h2>
          <Link to="/aboutus">О проекте</Link>
          <Link to="/signup">Создать профиль</Link>
          <Link to="/signin">Войти в аккаунт</Link>
        </div>
        <div>
          <h2>Полезно почитать</h2>
          <Link to="/cat-sitters">О ситтерах для кошек</Link>
          <Link to="/dog-sitters">О ситтерах для собак</Link>
          <Link to="/articles">Все статьи</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Pet&Travel</span>
        <a href="/photo-credits.html">Авторы фотографий</a>
      </div>
    </footer>
  );
}
export function ArticleCard({ article }) {
  return (
    <Link to={"/" + article.slug} className="article-card">
      <div className="card-image">
        <img src={"/images/" + article.image + ".jpg"} alt="" loading="lazy" />
        <span className="tag">{article.category}</span>
      </div>
      <div className="card-content">
        <h3>{article.title}</h3>
        <p>{article.summary}</p>
        <span className="read-link">Читать статью</span>
      </div>
    </Link>
  );
}
function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ДЛЯ ЛЮДЕЙ, КОТОРЫЕ ЛЮБЯТ ЖИВОТНЫХ</span>
          <h1>
            Спокойно вам.
            <br />
            <em>Хорошо им.</em>
          </h1>
          <p>
            У каждого питомца — свой характер.
            <br className="desktop-break" /> У каждого хозяина — своя история.
            <br className="desktop-break" /> Здесь есть место вашей.
          </p>
          <div className="actions">
            <Link className="button" to={user ? "/profile" : "/signup"}>
              {user ? "Открыть мой профиль" : "Создать свой профиль"}
            </Link>
            <Link className="button secondary" to="/articles">
              Почитать о заботе
            </Link>
          </div>
          <div className="hero-note">
            <Paw />
            <span>Владельцы, петситтеры и их маленькие друзья</span>
          </div>
        </div>
        <div className="hero-photo">
          <img
            src="/images/dog.jpg"
            alt="Золотистый ретривер на прогулке"
            fetchPriority="high"
          />
          <div className="photo-note">
            <span className="note-icon">♡</span>
            <span>
              Для них мы —<br />
              <strong>целый мир.</strong>
            </span>
          </div>
        </div>
      </section>
      <section className="container intro-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ЗАБОТА НАЧИНАЕТСЯ СО ЗНАКОМСТВА</span>
            <h2>Каждому — своё место</h2>
          </div>
          <p>
            Расскажите о себе. Сохраните важное.
            <br />
            Будьте на связи.
          </p>
        </div>
        <div className="role-grid">
          <div className="role-card mint">
            <span className="role-symbol" aria-hidden="true">
              ♡
            </span>
            <div>
              <h3>У меня есть питомец</h3>
              <p>
                Расскажите о любимце и его привычках. Заполните свой профиль и
                общайтесь с петситтером.
              </p>
              <Link to={user ? "/profile" : "/signup?role=parent"}>
                Профиль владельца
              </Link>
            </div>
          </div>
          <div className="role-card peach">
            <Paw className="role-symbol" />
            <div>
              <h3>Хочу заботиться о животных</h3>
              <p>
                Поделитесь опытом и укажите, с какими животными вам комфортно.
                Начните с профиля ситтера.
              </p>
              <Link to={user ? "/profile" : "/signup?role=sitter"}>
                Профиль петситтера
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="articles-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">МАЛЕНЬКИЕ ЗНАНИЯ — БОЛЬШАЯ ЗАБОТА</span>
              <h2>Понимать друг друга лучше</h2>
            </div>
            <Link className="button secondary" to="/articles">
              Все статьи
            </Link>
          </div>
          <div className="article-grid">
            {articles.slice(0, 3).map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>
      <section className="container about-strip">
        <Paw />
        <div>
          <h2>Любовь к животным объединяет</h2>
          <p>
            Pet&Travel — место для полезных знаний, личных профилей и общения о
            питомцах.
          </p>
        </div>
        <Link className="button secondary" to="/aboutus">
          Познакомиться с проектом
        </Link>
      </section>
    </>
  );
}
function Articles() {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("Все");
  const filtered = articles.filter(
    (a) =>
      (category === "Все" || a.category === category) &&
      (a.title + " " + a.summary).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="container page-section">
      <span className="eyebrow">БИБЛИОТЕКА ЗАБОТЫ</span>
      <h1>Ближе к миру питомцев</h1>
      <p className="lead">
        О привычках, знакомстве и маленьких ежедневных радостях.
      </p>
      <div className="article-tools">
        <label className="search-field">
          Найти статью
          <input
            type="search"
            placeholder="Например, кошки или фотографии"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filter-tabs" aria-label="Темы статей">
          {["Все", ...new Set(articles.map((a) => a.category))].map((c) => (
            <button
              key={c}
              className={category === c ? "chip selected" : "chip"}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <p className="muted" role="status">
        Статей: {filtered.length}
      </p>
      <div className="article-grid">
        {filtered.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          Таких статей пока нет. Попробуйте другую тему или запрос.
        </div>
      )}
    </section>
  );
}
function Article({ article }) {
  const Component = article.Component;
  return (
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/articles">Статьи</Link>
        <span>/</span>
        <span>{article.category}</span>
      </nav>
      <div className="article-layout">
        <article className="article-body">
          <span className="eyebrow">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="lead">{article.summary}</p>
          <img
            className="article-cover"
            src={"/images/" + article.image + ".jpg"}
            alt={
              article.image === "cat"
                ? "Домашняя кошка"
                : article.image === "dog"
                  ? "Собака на прогулке"
                  : "Птица на ветке"
            }
          />
          {["cat-sitters", "dog-sitters", "top-5-dog-sitting-tips"].includes(
            article.slug,
          ) && (
            <p className="editor-note">
              Материал о петситтинге. Условия ухода обсуждаются лично; каталог,
              бронирование и оплата в Pet&Travel пока не предусмотрены.
            </p>
          )}
          <div className="article-prose">
            <Component />
          </div>
        </article>
        <aside className="article-sidebar">
          <h2>Ещё немного заботы</h2>
          {articles
            .filter((a) => a.slug !== article.slug)
            .slice(0, 3)
            .map((a) => (
              <Link key={a.slug} to={"/" + a.slug}>
                <span className="eyebrow">{a.category}</span>
                <h3>{a.title}</h3>
              </Link>
            ))}
          <Link to="/articles" className="button secondary">
            Все материалы
          </Link>
        </aside>
      </div>
    </div>
  );
}
function About() {
  return (
    <section className="container page-section">
      <div className="about-hero">
        <div>
          <span className="eyebrow">О PET&TRAVEL</span>
          <h1>
            Ближе друг к другу.
            <br />
            <em>Ближе к питомцам.</em>
          </h1>
          <p className="lead">
            Мы собираем в одном месте то, с чего начинается забота: знакомство,
            полезные знания и общение.
          </p>
          <p>
            Владелец может рассказать о себе и своих животных. Петситтер —
            поделиться опытом и указать животных, за которыми готов
            присматривать. В личных сообщениях можно обсудить привычки и детали
            ухода.
          </p>
          <p>
            Наша библиотека — девять материалов о кошках, собаках, птицах и
            повседневной заботе. Статьи не заменяют индивидуальные рекомендации
            ветеринара.
          </p>
          <Link className="button" to="/articles">
            Открыть библиотеку
          </Link>
        </div>
        <img src="/images/cat.jpg" alt="Любопытная кошка" />
      </div>
      <div className="info-panel">
        <h2>Понятные возможности</h2>
        <p>
          В Pet&Travel работают профили, карточки питомцев и личный чат по ID
          собеседника. Поиск ситтеров, проверка исполнителей, отзывы,
          бронирование и оплата пока не доступны.
        </p>
      </div>
    </section>
  );
}
function NotFound() {
  return (
    <section className="container empty not-found">
      <Paw />
      <span className="eyebrow">404 · СТРАНИЦА НЕ НАЙДЕНА</span>
      <h1>Кажется, здесь никто не прятался</h1>
      <p>Вернёмся туда, где нас ждут.</p>
      <Link className="button" to="/">
        На главную
      </Link>
    </section>
  );
}
function NavigationEffects() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (previous.current !== pathname)
      document.querySelector("main")?.focus({ preventScroll: true });
    previous.current = pathname;
    document.title =
      (articles.find((a) => "/" + a.slug === pathname)?.title ||
        {
          "/": "Рядом с теми, кого любим",
          "/articles": "Статьи",
          "/profile": "Мой профиль",
          "/chat": "Сообщения",
          "/signin": "Вход",
          "/signup": "Регистрация",
          "/aboutus": "О проекте",
        }[pathname] ||
        "Страница не найдена") + " — Pet&Travel";
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <Header />
      <main id="main" tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/aboutus" element={<About />} />
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage signup />} />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path="/chat"
            element={
              <Protected>
                <Chat />
              </Protected>
            }
          />
          {articles.map((a) => (
            <Route
              key={a.slug}
              path={"/" + a.slug}
              element={<Article article={a} />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <NavigationEffects />
    </>
  );
}
