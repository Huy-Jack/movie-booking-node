import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    //generate password hash
    const hash = await argon.hash(dto.password);
    //save user to db
    try {
      const user = await this.prisma.user.create({
        data: {
          userName: dto.userName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          dob: dto.dob,
          firstName: dto.firstName,
          lastName: dto.lastName,
          hash,
        },
      });
      const token = await this.signToken(user.id, user.email);
      return {
        meaningful_msg: 'Signed up successfully',
        access_token: token.access_token,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials Taken!');
        }
      }
    }
  }
  async signin(dto: { username: string; password: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          userName: dto.username,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid username or password');
      }

      const pwMatches = await argon.verify(user.hash, dto.password);

      if (!pwMatches) {
        throw new UnauthorizedException('Invalid password');
      }

      return this.signToken(user.id, user.email);
    } catch (error) {
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string; meaningful_msg: string }> {
    const payLoad = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payLoad, {
      expiresIn: '120m',
      secret: secret,
    });
    return {
      meaningful_msg: 'Signed in successfully',
      access_token: token,
    };
  }
}
