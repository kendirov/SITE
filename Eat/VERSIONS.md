# Версии бота Eatventure

## Стабильная (stable)

Текущая проверенная версия сохранена как **тег** `stable`.

- Запуск с этой версией: в корне репо (`App`) выполнить  
  `git checkout stable`
- Посмотреть, что зафиксировано:  
  `git show stable --stat`

## Экспериментальная (experimental)

Ветка **experimental** создана от стабильной для проб и доработок.

- Переключиться на эксперименты:  
  `git checkout experimental`
- Работать в этой ветке как обычно (коммиты, правки).

## Откат к стабильной

Если экспериментальная версия ведёт себя плохо:

```bash
# Из корня репо (App):
git checkout stable
# или остаться на текущей ветке, но вернуть код к стабильной:
git checkout stable -- Eat/
```

После `git checkout stable` вы в состоянии "detached HEAD" на коммите стабильной версии. Чтобы снова работать в ветке:

```bash
git checkout Работает   # или experimental
```

**Кратко:** стабильная = тег `stable`, эксперименты = ветка `experimental`, откат = `git checkout stable` или `git checkout stable -- Eat/`.
