import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Banner } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BannerService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getBannerList(userToken: string): Promise<Banner[]> {
    try {
      if (!userToken) {
        throw new UnauthorizedException('JWT token missing');
      }
      this.jwtService.verify(userToken);
      return await this.prisma.banner.findMany();
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
