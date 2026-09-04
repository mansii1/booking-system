import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { pool } from './postgres';
import { makeSlots } from './slots';

@Controller('resources')
export class ResourcesController {
  @Get()
  async list() {
    const { rows } = await pool.query(
      'select id, name, iana_timezone from resources order by id',
    );
    return rows;
  }

  @Get(':id/slots')
  async slots(@Param('id') id: string, @Query('date') date: string) {
    if (!date) throw new BadRequestException('pass date=YYYY-MM-DD');

    const roomRes = await pool.query(
      'select id, name, iana_timezone from resources where id = $1',
      [id],
    );
    if (!roomRes.rows.length) throw new NotFoundException('no such room');

    const room = roomRes.rows[0];
    const hours = await pool.query(
      'select weekday, start_time, end_time from weekly_availability where resource_id = $1',
      [id],
    );

    const slots = makeSlots(date, room.iana_timezone, hours.rows);
    if (!slots.length) return [];

    const booked = await pool.query(
      `select start_time, end_time from bookings
       where resource_id = $1 and start_time < $3 and end_time > $2`,
      [id, slots[0].startUtc, slots[slots.length - 1].endUtc],
    );

    return slots.map((s) => {
      const start = new Date(s.startUtc).getTime();
      const end = new Date(s.endUtc).getTime();
      const taken = booked.rows.some(
        (b) => b.start_time.getTime() < end && b.end_time.getTime() > start,
      );
      return { ...s, taken };
    });
  }
}
