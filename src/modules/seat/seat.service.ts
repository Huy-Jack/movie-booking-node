import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowtimeSeat } from '@prisma/client';

@Injectable()
export class SeatService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async getSeatbyShowtimeId(
    showtimeId: string,
    userToken: string,
  ): Promise<Omit<ShowtimeSeat, 'showtimeId'>[]> {
    try {
      if (!userToken) {
        throw new UnauthorizedException('JWT token missing');
      }
      this.jwtService.verify(userToken);
      const seats = await this.prisma.showtimeSeat.findMany({
        where: { showtimeId: showtimeId },
        select: {
          isAvailable: true,
          seatId: true,
        },
      });

      // Check if seats are found
      if (!seats || seats.length === 0) {
        throw new NotFoundException(
          `No seats found for showtime with ID: ${showtimeId}`,
        );
      }
      return seats;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(
          'Invalid or expired authentication token',
        );
      } else {
        throw error;
      }
    }
  }
}
