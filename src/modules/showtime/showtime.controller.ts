import { Controller, Get, Headers, Param } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';

@Controller('showtime')
export class ShowtimeController {
  constructor(private showtimeService: ShowtimeService) {}

  @Get('/:movieId')
  getShowtimeByMovieId(
    @Param('movieId') movieId: string,
    @Headers('Authorization') userToken: string,
  ) {
    return this.showtimeService.getShowtimeByMovieId(movieId, userToken);
  }
}
