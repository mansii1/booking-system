import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { BookingsController } from './bookings.controller';

@Module({
  controllers: [ResourcesController, BookingsController],
})
export class AppModule {}
