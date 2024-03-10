import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class BookTicketDto {
  @IsNotEmpty()
  @IsString()
  showtimeId: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  seat: string[];
}

export default BookTicketDto;
