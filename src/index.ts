import { Hono } from 'hono';
import { ModelNotFoundError, sutando } from 'sutando';
import { User } from './models';
import ClientD1 from 'knex-cloudflare-d1';

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/users', async (c) => {
  const users = await User.query().withCount({
    posts: q => q.where('published', true)
  }).get();
  return c.json(users);
});

app.onError((err, c) => {
  if (err instanceof ModelNotFoundError) {
    return c.json({
      message: err.message
    }, 404);
  }

  return c.json({
    message: 'Something went wrong'
  }, 500);
});

export default {
  fetch: (req: Request, env: Bindings) => {
    sutando.addConnection({
      client: ClientD1,
      connection: {
        database: env.DB
      },
      useNullAsDefault: true,
    });

    return app.fetch(req, env)
  },
}