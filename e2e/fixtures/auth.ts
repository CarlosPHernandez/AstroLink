import path from 'node:path';

const authDir = path.join(__dirname, '..', '.auth');

export const menteeAuthFile = path.join(authDir, 'mentee.json');
export const mentorAuthFile = path.join(authDir, 'mentor.json');
export const adminAuthFile = path.join(authDir, 'admin.json');
