import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSlotDto {
  @IsDateString()
  data: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horario deve estar no formato HH:MM' })
  horario: string;
}

export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horario deve estar no formato HH:MM' })
  horario?: string;
}
