import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
const animalLabels = {
  cats: "Кошки",
  dogs: "Собаки",
  birds: "Птицы",
  fish: "Рыбки",
  reptiles: "Рептилии",
  smallPets: "Мелкие питомцы",
  horses: "Лошади",
};
const petTypes = {
  cat: "Кошка",
  dog: "Собака",
  bird: "Птица",
  fish: "Рыбка",
  reptile: "Рептилия",
  smallPet: "Мелкий питомец",
  horse: "Лошадь",
  other: "Другой питомец",
};
const emptyPet = { petName: "", petAge: "", type: "cat", petPhoto: "" };
export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(null),
    [profile, setProfile] = useState(null),
    [pets, setPets] = useState([]);
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const [petForm, setPetForm] = useState(null),
    [petError, setPetError] = useState(""),
    [petBusy, setPetBusy] = useState(false),
    [deleting, setDeleting] = useState(null);
  const parent = user.role === "parent";
  useEffect(() => {
    let active = true;
    setError("");
    api("/profile")
      .then(async (data) => {
        if (!active) return;
        setProfile(data.profile);
        const p = data.profile || {};
        setForm({
          name: data.user.name,
          surname: data.user.surname || "",
          mainPhoto: data.user.mainPhoto || "",
          country: p.country || "",
          city: p.city || "",
          ...(parent
            ? {
                title: p.title || "",
                introduction: p.introduction || "",
                location: p.location || "",
                responsibilities: p.responsibilities || "",
              }
            : {
                aboutMe: p.aboutMe || "",
                status: p.status || "",
                ...Object.fromEntries(
                  Object.keys(animalLabels).map((k) => [k, !!p[k]]),
                ),
              }),
        });
        if (parent && data.profile) {
          const result = await api("/pets");
          if (active) setPets(result.pets);
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [parent, retry]);
  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const data = await api("/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfile(data.profile);
      setUser(data.user);
      setStatus("Профиль сохранён");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function savePet(e) {
    e.preventDefault();
    setPetBusy(true);
    setPetError("");
    try {
      const { id, ...values } = petForm;
      values.petAge = values.petAge === "" ? null : Number(values.petAge);
      const { pet } = await api("/pets" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(values),
      });
      setPets((old) =>
        id ? old.map((p) => (p.id === id ? pet : p)) : [...old, pet],
      );
      setPetForm(null);
      setStatus("Карточка питомца сохранена");
    } catch (e) {
      setPetError(e.message);
    } finally {
      setPetBusy(false);
    }
  }
  async function removePet(id) {
    setPetBusy(true);
    setPetError("");
    try {
      await api("/pets/" + id, { method: "DELETE" });
      setPets((old) => old.filter((p) => p.id !== id));
      setDeleting(null);
      setStatus("Карточка питомца удалена");
    } catch (e) {
      setPetError(e.message);
    } finally {
      setPetBusy(false);
    }
  }
  return (
    <section className="container page-section">
      <div className="profile-heading">
        <div>
          <span className="eyebrow">
            ЛИЧНЫЙ КАБИНЕТ · {parent ? "ВЛАДЕЛЕЦ" : "ПЕТСИТТЕР"}
          </span>
          <h1>Привет, {user.name}!</h1>
          <p className="lead">
            {parent
              ? "Всё важное о вас и ваших любимцах."
              : "Ваш опыт и забота начинаются здесь."}
          </p>
        </div>
        <div className="id-card">
          <span>Ваш ID для общения</span>
          <strong>#{user.id}</strong>
          <Link to="/chat">Открыть сообщения</Link>
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}{" "}
          {!form && (
            <button onClick={() => setRetry((v) => v + 1)}>Повторить</button>
          )}
        </div>
      )}
      {status && (
        <p role="status" className="success">
          {status}
        </p>
      )}
      {!form && !error && <p role="status">Загружаем профиль…</p>}
      {form && (
        <div className="profile-grid">
          <form className="panel profile-form" onSubmit={saveProfile}>
            <div className="panel-heading">
              <h2>Обо мне</h2>
              <span className="tag">{parent ? "Владелец" : "Петситтер"}</span>
            </div>
            <div className="form-grid">
              <label>
                Имя
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="given-name"
                />
              </label>
              <label>
                Фамилия <span>(необязательно)</span>
                <input
                  name="surname"
                  value={form.surname}
                  onChange={change}
                  maxLength={80}
                  autoComplete="family-name"
                />
              </label>
              <label>
                Страна
                <input
                  name="country"
                  value={form.country}
                  onChange={change}
                  required
                  maxLength={100}
                  autoComplete="country-name"
                />
              </label>
              <label>
                Город
                <input
                  name="city"
                  value={form.city}
                  onChange={change}
                  required
                  maxLength={100}
                  autoComplete="address-level2"
                />
              </label>
            </div>
            <label>
              Ссылка на фото <span>(необязательно, HTTPS)</span>
              <input
                type="url"
                name="mainPhoto"
                value={form.mainPhoto}
                onChange={change}
                maxLength={255}
                placeholder="https://…"
              />
            </label>
            {parent ? (
              <>
                <label>
                  Заголовок профиля
                  <input
                    name="title"
                    value={form.title}
                    onChange={change}
                    required
                    minLength={2}
                    maxLength={160}
                  />
                </label>
                <label>
                  О себе
                  <textarea
                    name="introduction"
                    value={form.introduction}
                    onChange={change}
                    maxLength={4000}
                  />
                </label>
                <label>
                  Условия дома
                  <textarea
                    name="location"
                    value={form.location}
                    onChange={change}
                    maxLength={2000}
                    placeholder="Без точного адреса и личных данных"
                  />
                </label>
                <label>
                  Особенности ухода
                  <textarea
                    name="responsibilities"
                    value={form.responsibilities}
                    onChange={change}
                    maxLength={4000}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Коротко о себе
                  <input
                    name="status"
                    value={form.status}
                    onChange={change}
                    maxLength={160}
                  />
                </label>
                <label>
                  Ваш опыт и подход
                  <textarea
                    name="aboutMe"
                    value={form.aboutMe}
                    onChange={change}
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                </label>
                <fieldset>
                  <legend>С кем готовы проводить время</legend>
                  <div className="animal-options">
                    {Object.entries(animalLabels).map(([key, label]) => (
                      <label className="checkbox-label" key={key}>
                        <input
                          type="checkbox"
                          name={key}
                          checked={form[key]}
                          onChange={change}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <button disabled={busy}>
              {busy ? "Сохраняем…" : "Сохранить профиль"}
            </button>
          </form>
          <aside>
            <div className="panel profile-tip">
              <span className="eyebrow">ВАША ИСТОРИЯ</span>
              <h2>Важны маленькие детали</h2>
              <p>
                Привычки, любимые игры и ваш подход к заботе помогут лучше
                понять друг друга.
              </p>
              <p>
                Профиль доступен вам. В чате собеседник видит имя, роль и фото.
                Не указывайте точный адрес или другие чувствительные данные.
              </p>
              <Link to="/articles">Почитать о питомцах</Link>
            </div>
            {form.mainPhoto && (
              <img
                className="profile-photo"
                src={form.mainPhoto}
                alt="Фотография профиля"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </aside>
        </div>
      )}
      {parent && form && (
        <section className="pets-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ВАШИ МАЛЕНЬКИЕ ДРУЗЬЯ</span>
              <h2>Мои питомцы</h2>
            </div>
            <button
              disabled={!profile || petBusy}
              onClick={() => {
                setPetForm({ ...emptyPet });
                setPetError("");
              }}
            >
              Добавить питомца
            </button>
          </div>
          {!profile && (
            <p className="info-panel">
              Сохраните профиль, чтобы добавить первого питомца.
            </p>
          )}
          {profile && !pets.length && !petForm && (
            <div className="empty">
              <h3>Здесь появятся ваши любимцы</h3>
              <p>Начните с имени, возраста и вида животного.</p>
            </div>
          )}
          {petError && (
            <p role="alert" className="error">
              {petError}
            </p>
          )}
          {petForm && (
            <form className="panel pet-form" onSubmit={savePet}>
              <h3>{petForm.id ? "Редактировать карточку" : "Новый питомец"}</h3>
              <div className="form-grid">
                <label>
                  Имя питомца
                  <input
                    value={petForm.petName}
                    onChange={(e) =>
                      setPetForm({ ...petForm, petName: e.target.value })
                    }
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Вид животного
                  <select
                    value={petForm.type}
                    onChange={(e) =>
                      setPetForm({ ...petForm, type: e.target.value })
                    }
                  >
                    {Object.entries(petTypes).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Возраст, лет <span>(необязательно)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={petForm.petAge}
                    onChange={(e) =>
                      setPetForm({ ...petForm, petAge: e.target.value })
                    }
                  />
                </label>
                <label>
                  Фото питомца <span>(HTTPS, необязательно)</span>
                  <input
                    type="url"
                    maxLength={255}
                    value={petForm.petPhoto}
                    onChange={(e) =>
                      setPetForm({ ...petForm, petPhoto: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="actions">
                <button disabled={petBusy}>
                  {petBusy ? "Сохраняем…" : "Сохранить питомца"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={petBusy}
                  onClick={() => setPetForm(null)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
          <div className="pet-grid">
            {pets.map((p) => (
              <div className="panel pet-card" key={p.id}>
                {p.petPhoto ? (
                  <img
                    src={p.petPhoto}
                    alt={p.petName}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="pet-placeholder" aria-hidden="true">
                    ♡
                  </div>
                )}
                <div>
                  <span className="eyebrow">{petTypes[p.type] || p.type}</span>
                  <h3>{p.petName}</h3>
                  <p>
                    {p.petAge === null
                      ? "Возраст не указан"
                      : "Возраст: " + p.petAge}
                  </p>
                  <div className="actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setPetForm({
                          id: p.id,
                          petName: p.petName,
                          petAge: p.petAge ?? "",
                          type: p.type,
                          petPhoto: p.petPhoto || "",
                        });
                        setPetError("");
                      }}
                    >
                      Изменить
                    </button>
                    <button
                      className="text-button danger"
                      onClick={() => setDeleting(p.id)}
                    >
                      Удалить
                    </button>
                  </div>
                  {deleting === p.id && (
                    <div className="delete-confirm">
                      <p>Удалить карточку {p.petName}?</p>
                      <button
                        disabled={petBusy}
                        onClick={() => removePet(p.id)}
                      >
                        Да, удалить
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setDeleting(null)}
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
