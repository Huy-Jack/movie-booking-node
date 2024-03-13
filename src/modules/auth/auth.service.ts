import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
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
  ): Promise<{ access_token: string; meaningful_msg: string; user: User }> {
    const payLoad = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payLoad, {
      expiresIn: '120m',
      secret: secret,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    delete user.hash;
    if (!user) {
      throw new NotFoundException(`No user with id ${userId} found`);
    }
    return {
      meaningful_msg: 'Signed in successfully',
      access_token: token,
      user,
    };
  }

  async resetPasswordRequest(email: string): Promise<{ email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const token = await this.generateResetToken(user.id);

    // Send email with reset token
    await this.emailService.sendResetPasswordEmail(user.email, token);

    return { email: user.email };
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<Omit<User, 'hash'>> {
    try {
      const secret = this.config.get('JWT_SECRET');
      const { userId } = this.jwt.verify(token, { secret });

      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const newPassword = await argon.hash(password);

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { hash: newPassword },
        select: {
          id: true,
          userName: true,
          email: true,
          phoneNumber: true,
          dob: true,
          firstName: true,
          lastName: true,
        },
      });

      // Omit the 'hash' property from the returned type
      const { hash, ...userWithoutHash } = updatedUser as User;

      return userWithoutHash;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async generateResetToken(userId: string): Promise<string> {
    const secret = this.config.get('JWT_SECRET');
    return this.jwt.signAsync({ userId }, { expiresIn: '1h', secret });
  }
}
