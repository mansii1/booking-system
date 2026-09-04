import 'reflect-metadata';
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { pool } from '../src/postgres';

test('two parallel bookings: only one row, other gets 409', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const base = await app.getUrl();

  t.after(async () => {
    await app.close();
    await pool.end();
  });

  const rooms = await (await fetch(`${base}/resources`)).json();
  const roomId = rooms[0].id;

  // a Friday far enough out that it won't clash with manual testing
  const date = '2026-11-06';
  await pool.query(
    `delete from bookings
     where resource_id = $1
       and start_time >= $2::date
       and start_time < ($2::date + interval '1 day')`,
    [roomId, date],
  );

  const slots = await (await fetch(`${base}/resources/${roomId}/slots?date=${date}`)).json();
  const slot = slots[0];
  assert.ok(slot, 'expected at least one slot');

  const send = (userId: string) =>
    fetch(`${base}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: roomId,
        userId,
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
      }),
    });

  const [a, b] = await Promise.all([send('race-a'), send('race-b')]);
  const codes = [a.status, b.status].sort((x, y) => x - y);
  assert.deepEqual(codes, [201, 409]);

  const { rows } = await pool.query(
    'select count(*)::int as n from bookings where resource_id = $1 and start_time = $2',
    [roomId, slot.startUtc],
  );
  assert.equal(rows[0].n, 1);

  await pool.query(`delete from bookings where user_id in ('race-a', 'race-b')`);
});
