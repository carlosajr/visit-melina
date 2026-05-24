import { IsArray, IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateAgendamentoDto {
  @IsDateString()
  data: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horario deve estar no formato HH:MM' })
  horario: string;

  @IsString()
  @MinLength(2)
  nome: string;

  @IsString()
  whatsapp: string; // formato mascarado (11) 99999-9999

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acompanhantes?: string[];
}

export class UpdateAgendamentoDto {
  @IsDateString()
  data: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  horario: string;
}
