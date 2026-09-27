# Strategic Survival 3D

Twin-stick survival в one-point perspective. Three.js + Vite.

## Запуск
- Локально: `npm install && npm run dev`
- В Codespaces: открыть Codespace, `npm run dev`, перейти по ссылке

## Структура
- `src/core/` — движок (Loop, Renderer, Game)
- `src/systems/` — логика без геометрии (Input, Camera, Noise, Collision)
- `src/entities/` — игрок, враги, пули
- `src/world/` — окружение, свет, загрузка уровней
- `src/config/` — все тюнинг-константы
- `levels/` — JSON-описания локаций

## Правила
- Один файл — одна ответственность, до 300 строк
- Все константы — в `src/config/`
- Сущности не знают друг о друге, связывает `Game.js`
- Уровни — только данные, без логики

## Roadmap
- [ ] Скелет проекта
- [ ] InputSystem + AimSystem
- [ ] Player (движение + прицел)
- [ ] CameraRig (загляд за прицелом)
- [ ] NoiseSystem
- [ ] CollisionSystem
- [ ] Zombie + SpawnSystem
- [ ] LevelLoader + levels/town_01.json
- [ ] HUD