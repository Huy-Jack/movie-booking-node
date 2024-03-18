import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { EmailService } from './email.service';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  private storedVerificationNumber: string;
  private verificationTimeout: any;
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}
  async signup(dto: AuthDto) {
    // Generate and send verification number to email
    const { verificationNumber } = await this.sendVerificationNumber(dto.email);
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
        verificationNumber,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials Taken!');
        }
      }
    }
  }

  async sendVerificationNumber(
    email: string,
  ): Promise<{ verificationNumber: string }> {
    const verificationNumber = Math.floor(Math.random() * 9000000) + 1000000;

    await this.emailService.sendVerificationEmail(
      email,
      verificationNumber.toString(),
    );
    this.verificationTimeout = setTimeout(async () => {
      await this.prisma.user.delete({ where: { email: email } });
      throw new UnauthorizedException('Verification timed out');
    }, 60000);

    this.storedVerificationNumber = verificationNumber.toString();

    return { verificationNumber: verificationNumber.toString() };
  }

  async verify(email: string, verificationNumber: string) {
    if (this.storedVerificationNumber !== verificationNumber) {
      clearTimeout(this.verificationTimeout);
      await this.prisma.user.delete({ where: { email } });
      throw new UnauthorizedException('Invalid verification number');
    }
    clearTimeout(this.verificationTimeout);
    return { meaningful_msg: 'User verified successfully' };
  }

  async signin(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { userName: username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const pwMatches = await argon.verify(user.hash, password);

    if (!pwMatches) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.signToken(user.id, user.email);
  }

  async resetPasswordRequest(email: string): Promise<{ email: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = await this.generateResetToken(user.id);

    await this.emailService.sendResetPasswordEmail(user.email, token);

    return { email: user.email };
  }

  async resetPassword(token: string, password: string) {
    try {
      const { userId } = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      const newPasswordHash = await argon.hash(password);

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { hash: newPasswordHash },
      });

      return updatedUser;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async signToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '120m',
      secret,
    });

    return { access_token: accessToken };
  }

  private async generateResetToken(userId: string) {
    const secret = this.config.get('JWT_SECRET');
    return this.jwt.signAsync({ userId }, { expiresIn: '1h', secret });
  }
}
