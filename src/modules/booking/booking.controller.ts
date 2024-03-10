import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import BookTicketDto from './dto/booking.dto';
import { BookingService } from './booking.service';

@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('ticket')
  bookTicket(
    @Body() dto: BookTicketDto,
    @Headers('Authorization') userToken: string,
  ) {
    try {
      return this.bookingService.bookTicket(dto, userToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Unauthorized access');
      } else if (error.response?.statusCode === 401) {
        throw new UnauthorizedException('Invalid or expired token');
      } else {
        throw error;
      }
    }
  }
}
