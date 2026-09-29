export const PLAYER = {
    radius: 0.5,
    hp: 100,
    speeds: {
        crouch: 3,
        walk: 6,
        sprint: 10.5,
    },
    // Зрение игрока — только маркер направления взгляда (V-режим).
    // Не влияет на геймплей.
    vision: { range: 12, angle: 20 },
};