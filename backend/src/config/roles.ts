import { Role } from '../generated/prisma/index.js';

const allRoles = {
    [Role.USER]: ['getDashboard', 'getEvents', 'manageEvents', 'getAttendees', 'getMessages', 'manageMessages'],
    [Role.ADMIN]: [
        'getUsers',
        'manageUsers',
        'getDashboard',
        'getEvents',
        'manageEvents',
        'getAttendees',
        'manageAttendees',
        'getMessages',
        'manageMessages'
    ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
