import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Showtime } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShowtimeService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async getShowtimeByMovieId(
    movieId: string,
    userToken: string,
  ): Promise<Showtime[]> {
    try {
      if (!userToken) {
        throw new UnauthorizedException('JWT token missing');
      }
      this.jwtService.verify(userToken);

      return await this.prisma.showtime.findMany({
        where: { movieId: movieId },
      });
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
