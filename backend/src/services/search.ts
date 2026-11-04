import { Client } from '@elastic/elasticsearch';
import { pool } from '../db';

const es = new Client({ node: process.env.ES_URL ?? 'http://localhost:9200' });
const INDEX = 'emails';

export async function indexEmail(emailId: string) {
  try {
    const { rows } = await pool.query('SELECT * FROM emails WHERE id=$1', [emailId]);
    if (!rows[0]) return;
    const { id, ...doc } = rows[0];
    await es.index({ index: INDEX, id, document: doc });
  } catch (e: any) {
    console.error('index failed', e.message); // never break sending because of search
  }
}

export async function searchEmails(q: string, userId?: number) {
  const must: any[] = [{
    multi_match: { query: q, fields: ['to_email', 'subject', 'body'], fuzziness: 'AUTO' },
  }];
  const filter = userId ? [{ term: { user_id: userId } }] : [];
  const r = await es.search({ index: INDEX, size: 50, query: { bool: { must, filter } } });
  return r.hits.hits.map(h => ({ id: h._id, ...(h._source as object) }));
}