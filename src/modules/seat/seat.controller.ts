import { Controller, Get, Headers, Param } from '@nestjs/common';
import { SeatService } from './seat.service';

@Controller('seat')
export class SeatController {
  constructor(private seatService: SeatService) {}

  @Get('/:showtimeId')
  getSeatbyShowtimeId(
    @Param('showtimeId') showtimeId: string,
    @Headers('Authorization') userToken: string,
  ) {
    return this.seatService.getSeatbyShowtimeId(showtimeId, userToken);
  }
}
