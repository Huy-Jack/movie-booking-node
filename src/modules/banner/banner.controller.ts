import { Controller, Get, Headers } from '@nestjs/common';
import { Banner } from '@prisma/client';
import { BannerService } from './banner.service';

@Controller('banner')
export class BannerController {
  constructor(private bannerService: BannerService) {}

  @Get('all')
  getAllBanners(
    @Headers('Authorization') userToken: string,
  ): Promise<Banner[]> {
    return this.bannerService.getBannerList(userToken);
  }
}
