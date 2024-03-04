import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto';
import { Movie } from '@prisma/client';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post('create')
  createMovie(
    @Body() dto: CreateMovieDto,
    @Headers('Authorization') userToken: string,
  ) {
    try {
      return this.movieService.createMovie(dto, userToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Handle unauthorized access
        throw new UnauthorizedException('Unauthorized access');
      } else if (error.response?.statusCode === 401) {
        // Handle JWT verification failure
        throw new UnauthorizedException(
          'Invalid or expired authentication token',
        );
      } else {
        // Handle other errors
        throw error;
      }
    }
  }

  @Get('get-all')
  async getMovies(@Query('ongoing') ongoing?: boolean): Promise<Movie[]> {
    try {
      if (ongoing) {
        return await this.movieService.getOngoingMovies();
      } else {
        return await this.movieService.getAllMovies();
      }
    } catch (error) {
      throw error;
    }
  }
}
