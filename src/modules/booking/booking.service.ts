import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookTicketDto } from './dto/booking.dto';
import { JwtService } from '@nestjs/jwt';
import { Big } from 'big.js';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async bookTicket(bookTicketDto: BookTicketDto, userToken: string) {
    try {
      const user = await this.jwtService.verify(userToken);
      const { showtimeId, seat } = bookTicketDto;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (user.exp && user.exp < currentTimestamp) {
        throw new UnauthorizedException('Token has expired');
      }

      (await this.prisma.showtime.findUnique({
        where: { id: showtimeId },
        include: { cinema: true, movie: true },
      })) || throwError(`Showtime with ID ${showtimeId} not found`);

      const seats = await this.prisma.showtimeSeat.findMany({
        where: { seatId: { in: seat }, showtimeId: showtimeId },
      });

      if (
        seats.length !== seat.length ||
        seats.some((seat) => seat.isAvailable !== 'TRUE')
      ) {
        throw new NotFoundException(
          'One or more selected seats not found or not available',
        );
      }

      const userName = await this.getUserNameById(user.sub);

      await this.prisma.ticket.createMany({
        data: seat.map((seatId) => ({ userName, seatId, showtimeId })),
      });

      const updateResult = await this.prisma.showtimeSeat.updateMany({
        where: { seatId: { in: seat }, showtimeId: showtimeId },
        data: { isAvailable: 'FALSE' },
      });

      const seatPrices = await this.getSeatPrices(seat);
      const sumTotal = seatPrices
        .reduce((total, price) => total.plus(price), new Big(0))
        .toString();

      if (updateResult.count > 0) {
        return {
          message: 'Booking successful',
          count: updateResult.count,
          userName,
          bookTicketDto,
          sumTotal,
        };
      } else {
        throw new NotFoundException(
          'One or more selected seats could not be booked',
        );
      }
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof UnauthorizedException) {
        return {
          message: 'One or more selected seats are not available',
          error: 'Unauthorized',
          statusCode: 401,
        };
      } else if (error instanceof NotFoundException) {
        return {
          message: 'One or more selected seats not found',
          error: 'Not Found',
          statusCode: 404,
        };
      }
      console.error('JWT Verification Error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async getUserNameById(userId: string) {
    const user =
      (await this.prisma.user.findUnique({
        where: { id: userId },
        select: { userName: true },
      })) || throwError(`User with ID ${userId} not found`);
    return user.userName;
  }

  private async getSeatPrices(seat: string[]) {
    const prices = await Promise.all(
      seat.map((seatId) =>
        this.prisma.seat.findUnique({ where: { id: seatId } }),
      ),
    );
    return prices.map((seatPrice) => new Big(seatPrice?.price || 0));
  }
}

function throwError(message: string): never {
  throw new NotFoundException(message);
}
