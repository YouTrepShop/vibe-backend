import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pg from 'pg';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway')
    ? { rejectUnauthorized: false }
    : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT,
      avatar TEXT,
      online BOOLEAN DEFAULT false,
      last_seen TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_a, user_b)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      text TEXT NOT NULL,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function directChatId(a, b) {
  return [a, b].sort().join('__');
}

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'vibe-backend' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  let currentUserId = null;

  socket.on('user:online', async (user) => {
    currentUserId = String(user.id);
    socket.join(currentUserId);

    await pool.query(
      `
      INSERT INTO users (id, name, username, avatar, online, last_seen)
      VALUES ($1, $2, $3, $4, true, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        avatar = EXCLUDED.avatar,
        online = true,
        last_seen = NOW()
      `,
      [
        currentUserId,
        user.name || 'Vibe user',
        user.username || '',
        user.avatar || ''
      ]
    );

    const { rows } = await pool.query(
      'SELECT id, name, username, avatar, online, last_seen FROM users WHERE id <> $1 ORDER BY last_seen DESC LIMIT 100',
      [currentUserId]
    );

    socket.emit('users:online', rows);
    socket.broadcast.emit('user:online', {
      id: currentUserId,
      name: user.name || 'Vibe user',
      username: user.username || '',
      avatar: user.avatar || '',
      online: true
    });
  });

  socket.on('message:send', async (payload) => {
    const senderId = String(payload.senderId);
    const recipientId = String(payload.recipientId);
    const chatId = directChatId(senderId, recipientId);
    const messageId = payload.id || crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO chats (id, user_a, user_b, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id)
      DO UPDATE SET updated_at = NOW()
      `,
      [chatId, ...[senderId, recipientId].sort()]
    );

    const { rows } = await pool.query(
      `
      INSERT INTO messages (id, chat_id, sender_id, recipient_id, text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, chat_id, sender_id, recipient_id, text, read_at, created_at
      `,
      [messageId, chatId, senderId, recipientId, payload.text]
    );

    io.to(senderId).emit('message:new', rows[0]);
    io.to(recipientId).emit('message:new', rows[0]);
  });

  socket.on('messages:load', async ({ userId, otherUserId }) => {
    const chatId = directChatId(String(userId), String(otherUserId));

    const { rows } = await pool.query(
      `
      SELECT id, chat_id, sender_id, recipient_id, text, read_at, created_at
      FROM messages
      WHERE chat_id = $1
      ORDER BY created_at ASC
      `,
      [chatId]
    );

    socket.emit('messages:loaded', { chatId, messages: rows });
  });

  socket.on('message:read', async ({ messageId, readerId }) => {
    const { rows } = await pool.query(
      `
      UPDATE messages
      SET read_at = NOW()
      WHERE id = $1 AND recipient_id = $2
      RETURNING id, chat_id, sender_id, recipient_id, read_at
      `,
      [messageId, String(readerId)]
    );

    if (rows[0]) {
      io.to(rows[0].sender_id).emit('message:read', rows[0]);
    }
  });

  socket.on('call:offer', (payload) => {
    io.to(String(payload.recipientId)).emit('call:incoming', payload);
  });

  socket.on('call:answer', (payload) => {
    io.to(String(payload.recipientId)).emit('call:answer', payload);
  });

  socket.on('call:ice', (payload) => {
    io.to(String(payload.recipientId)).emit('call:ice', payload);
  });

  socket.on('call:end', (payload) => {
    io.to(String(payload.recipientId)).emit('call:end', payload);
  });

  socket.on('disconnect', async () => {
    if (!currentUserId) return;

    await pool.query(
      'UPDATE users SET online = false, last_seen = NOW() WHERE id = $1',
      [currentUserId]
    );

    socket.broadcast.emit('user:offline', { id: currentUserId });
  });
});

const port = process.env.PORT || 3000;

initDb()
  .then(() => {
    server.listen(port, () => {
      console.log(`Vibe backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
  });
