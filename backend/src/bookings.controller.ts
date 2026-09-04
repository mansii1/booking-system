import { BadRequestException, ConflictException, Controller, Post, Body } from '@nestjs/common';
import { DateTime } from 'luxon';
import { pool } from './postgres';
import { makeSlots } from './slots';

@Controller('bookings')
export class BookingsController {
  @Post()
  async create(@Body() body: any) {
    const { resourceId, startUtc, endUtc } = body;
    const userId = body.userId || 'mansi';

    if (!resourceId || !startUtc || !endUtc) {
      throw new BadRequestException('need resourceId, startUtc, endUtc');
    }

    const { rows } = await pool.query(
      'select iana_timezone from resources where id = $1',
      [resourceId],
    );
    if (!rows.length) throw new BadRequestException('no such room');

    const zone = rows[0].iana_timezone;
    const date = DateTime.fromISO(startUtc, { zone: 'utc' }).setZone(zone).toISODate();

    const hours = await pool.query(
      'select weekday, start_time, end_time from weekly_availability where resource_id = $1',
      [resourceId],
    );

    const match = makeSlots(date!, zone, hours.rows).find(
      (s) => s.startUtc === startUtc && s.endUtc === endUtc,
    );
    if (!match) throw new BadRequestException('not a valid slot for this room');

    try {
      const { rows: created } = await pool.query(
        `insert into bookings (resource_id, user_id, start_time, end_time)
         values ($1, $2, $3, $4)
         returning *`,
        [resourceId, userId, startUtc, endUtc],
      );
      return created[0];
    } catch (err: any) {
      if (err.code === '23P01') throw new ConflictException('slot already booked');
      throw err;
    }
  }
}
