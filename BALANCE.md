cat > BALANCE.md << 'ENDOFBALANCE'
# Balance

Фиксация всех тюнинг-чисел проекта. Меняем здесь — обновляем документ.

## Шум (dB)

### База от движения
| Режим | dB |
|---|---|
| Crouch | 30 |
| Walk | 50 |
| Sprint | 70 |

### Импульсы (L0 dB, k dB/сек)
| Источник | L0 | k | Слышен до 18 dB |
|---|---|---|---|
| melee | 20 | 80 | 0.03 с |
| door | 15 | 80 | мгновенно |
| axe | 35 | 70 | 0.24 с |
| box | 40 | 65 | 0.34 с |
| hammer | 45 | 65 | 0.42 с |
| glass | 60 | 70 | 0.6 с |
| shot | 110 | 70 | 1.3 с |
| shotgun | 125 | 55 | 1.9 с |
| rifle | 130 | 60 | 1.9 с |
| boom | 145 | 45 | 2.8 с |
| scream | 120 | 20 | 5.1 с |

### Константы
- Energy sum: LSum = 10·log10( SUM 10^(Li/10) )
- Distance falloff: L(d) = L0 − 20·log10(d), d0 = 1 м
- silentThreshold: 0.5 dB
- max: 150 dB
- criticalEnter: 120 dB
- criticalExit: 60 dB
- lerpSpeed: 6

## Зомби — восприятие

### Общие
- hearingThreshold: 18 dB
- confidenceGain: 0.8
- confidenceDecay: 0.4
- confidenceTrigger: 0.5
- chaseLossTimeout: 1.5 сек
- chaseJumpConfidence: 0.7
- confidenceAlertBonus: 0.5 (макс −50% к ALERT)

### По типам
| Тип | Speed | HP | Vision (range/angle) | Hearing | Smell (range/angle) | ALERT base | SEARCH (base/persist/radius) |
|---|---|---|---|---|---|---|---|
| Walker | 3.2 | 100 | 30 / 60 | x1.0 | — | 0.8 | 5 / 1.0 / 4 |
| Sniffer | 2.4 | 100 | 12 / 50 | x0.6 | 45 / 90 | 1.1 | 5 / 0.6 / 6 |
| Listener | 3.6 | 80 | 15 / 60 | x2.5 | — | 0.5 | 5 / 2.0 / 8 |
| Screamer | 2.5 | 60 | 25 / 70 | x1.2 | — | 1.4 | 5 / 2.0 / 6 |

### Attack
- Range: 1.4 м
- Damage: 10
- Cooldown: 1.0 сек

## Игрок

- HP: 100
- Speeds (crouch / walk / sprint): 3 / 6 / 10.5
- Invulnerability: 0.4 сек
- Fire cooldown: 0.16 сек

## Камера

- Height: 34
- FOV: 65
- maxLook: 10 м
- lookK: 0.6
- lerpIn: 8, lerpOut: 3
- deadZone: 3 м

## Мир

- worldHalf: 195
- worldSize: 400
- SPACING (город): 26
- Домов: ~55% от ячеек
- Деревьев на ячейку: 2-4

## Проверка формул

### 1. Энергетическая сумма
- 110 + 110 = 113 dB (не 220)
- 110 + 20 = 110.04 dB (не 130)

### 2. Затухание линейное
- 110 − 70·t
- t=1.3 → 19 dB (почти порог)
- t=1.4 → удалён

### 3. Затухание с расстоянием
- 120 dB на 10 м → 100 dB
- 120 dB на 100 м → 80 dB
- 120 dB на 1000 м → 60 dB

### 4. Слышимость от порога 18 dB
- Walk 50 dB → d = 10^((50-18)/20) ≈ 40 м
- Shot 110 dB → d = 10^((110-18)/20) ≈ 1000 м
- Scream 120 dB → d = 10^((120-18)/20) ≈ 1250 м

## Что менять, а что нет

Меняем: base ALERT, search.persist, hearingThreshold, speeds.
Не меняем без причины: формулы (это физика), silentThreshold, confidenceTrigger.
ENDOFBALANCE