import { Body, Controller, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: { username: string; password: string }) {
    return this.authService.signin(dto);
  }

  @Post('reset-password/request')
  resetPasswordRequest(@Body() dto: { email: string }) {
    return this.authService.resetPasswordRequest(dto.email);
  }

  @Post('reset-password/:token')
  resetPassword(
    @Param('token') token: string,
    @Body() dto: { password: string },
  ) {
    return this.authService.resetPassword(token, dto.password);
  }
}
