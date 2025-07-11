"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/players/register-player',
            handler: 'player.registerPlayer',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/players/join-team-request',
            handler: 'player.requestJoinTeam',
            config: {
                auth: false,
            },
        },
    ],
};
