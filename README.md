# Веб-стандарты
[![](https://github.com/web-standards/web-standards.ru/workflows/editorconfig/badge.svg)](https://github.com/web-standards/web-standards.ru/actions?query=workflow%3aeditorconfig)
[![](https://github.com/web-standards/web-standards.ru/workflows/markdown/badge.svg)](https://github.com/web-standards/web-standards.ru/actions?query=workflow%3amarkdown)
[![](https://github.com/web-standards/web-standards.ru/workflows/stylelint/badge.svg)](https://github.com/web-standards/web-standards.ru/actions?query=workflow%3astylelint)
[![](https://github.com/web-standards/web-standards.ru/workflows/eslint/badge.svg)](https://github.com/web-standards/web-standards.ru/actions?query=workflow%3aeslint)
[![](https://github.com/web-standards/web-standards.ru/workflows/yaml/badge.svg)](https://github.com/web-standards/web-standards.ru/actions?query=workflow%3ayaml)

Сайт сообщества: статьи и подкаст.

## Разработка

- Установка зависимостей: `npm install`
- Старт сервера для локальной разработки: `npm start`
- Запуск сборки для деплоя: `npm run build`

## Участие в разработке

Вы можете выбрать [ишью из списка](https://github.com/web-standards/web-standards.ru/issues) и сказать, что берётесь за работу.

Форкните и присылайте пулреквесты.

## Окружение и технологии

Движок [Eleventy](https://www.11ty.io/) собирает Markdown и JSON по шаблонам [Nunjucks](https://mozilla.github.io/nunjucks/) и генерирует статичные HTML-страницы. Стили пишутся на чистом CSS, соединяются импортами, сжимаются и оптимизируются. Браузерная совместимость описана в ключе `browserlist` в [package.json](https://github.com/web-standards/web-standards.ru/blob/master/package.json), если коротко — «без IE11».

## Принципы верстки

**Mobile-first.** Сначала мы делаем мобильную версию интерфейса, а потом начинаем увеличивать с помощью `@media`. Например, кнопка открытия главного меню спрячется, когда для меню будет достаточно места на экране.

**Нет брекпоинтов для адаптации.** Каждый компонент для себя решает, когда ему адаптироваться. Например, когда пункты меню начинают помещаться — пора развернуть его во всю ширину и спрятать кнопку-гамбургер.

---
Работает на [Eleventy](https://www.11ty.io/).
