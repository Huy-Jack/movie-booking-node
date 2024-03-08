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
async getMovies(
  @Query('ongoing') ongoing: string,
  @Headers('Authorization') userToken?: string,
): Promise<Movie[]> {
  try {
    if (!userToken) {
      throw new UnauthorizedException('JWT token missing');
    }
    const isOngoing = ongoing === 'true';

    if (isOngoing) {
      return await this.movieService.getOngoingMovies(userToken);
    } else {
      return await this.movieService.getUpcomingMovies(userToken);
    }
  } catch (error) {
    throw error;
  }
}

}
