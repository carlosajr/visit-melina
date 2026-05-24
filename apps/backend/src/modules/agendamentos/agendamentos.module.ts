import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { SlotsModule } from '../slots/slots.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { Agendamento } from './agendamento.entity';
import { AgendamentosController } from './agendamentos.controller';
import { AgendamentosService } from './agendamentos.service';
import { LembreteCron } from './lembrete.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agendamento]),
    WhatsAppModule,
    SlotsModule,
    GoogleCalendarModule,
  ],
  providers: [AgendamentosService, LembreteCron],
  controllers: [AgendamentosController],
  exports: [AgendamentosService],
})
export class AgendamentosModule {}
