import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './db';

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
  },
  async (_at, _rt, profile, done) => {
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (google_id, email, name, avatar) VALUES ($1,$2,$3,$4)
         ON CONFLICT (google_id) DO UPDATE SET email=$2, name=$3, avatar=$4
         RETURNING *`,
        [profile.id, profile.emails?.[0]?.value, profile.displayName, profile.photos?.[0]?.value]
      );
      done(null, rows[0]);
    } catch (e) { done(e as Error); }
  }
));

passport.serializeUser((u: any, done) => done(null, u.id));
passport.deserializeUser(async (id: number, done) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
  done(null, rows[0] ?? false);
});

export const requireAuth = (req: Request, res: Response, next: NextFunction) =>
  req.user ? next() : res.status(401).json({ error: 'unauthorized' });

export const authRouter = Router();
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
authRouter.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (_req, res) => res.redirect(`${process.env.FRONTEND_URL}/dashboard`));
authRouter.get('/me', requireAuth, (req, res) => {
  const { id, name, email, avatar } = req.user as any;
  res.json({ id, name, email, avatar });
});
authRouter.post('/logout', (req, res, next) =>
  req.logout(err => (err ? next(err) : res.json({ ok: true }))));