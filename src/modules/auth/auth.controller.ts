import { Body, Controller, HttpException, HttpStatus, Param, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: AuthDto) {
    const { verificationNumber } = await this.authService.signup(dto);
    return { verificationSent: true, verificationNumber };
  }

  @Post('verify')
  async verify(@Body() dto: { email: string, verificationNumber: string }) {
    try {
      const { email, verificationNumber } = dto;
      // Call the verify method of the authService
      const result = await this.authService.verify(email, verificationNumber);
      return { success: true, message: result.meaningful_msg }; // Returning success message
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED); // Throwing an Unauthorized exception
    }
  }

  @Post('signin')
  async signin(@Body() dto: { username: string; password: string }) {
    return this.authService.signin(dto.username, dto.password);
  }

  @Post('reset-password/request')
  async resetPasswordRequest(@Body() dto: { email: string }) {
    return this.authService.resetPasswordRequest(dto.email);
  }

  @Post('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() dto: { password: string },
  ) {
    return this.authService.resetPassword(token, dto.password);
  }
}
