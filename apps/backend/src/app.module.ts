import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validationSchema } from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { AgendamentosModule } from './modules/agendamentos/agendamentos.module';
import { GoogleCalendarModule } from './modules/google-calendar/google-calendar.module';
import { OtpModule } from './modules/otp/otp.module';
import { SlotsModule } from './modules/slots/slots.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { Agendamento } from './modules/agendamentos/agendamento.entity';
import { GoogleToken } from './modules/google-calendar/google-token.entity';
import { OtpCode } from './modules/otp/otp.entity';
import { Slot } from './modules/slots/slot.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASSWORD'),
        database: cfg.get<string>('DB_NAME'),
        entities: [Slot, Agendamento, OtpCode, GoogleToken],
        synchronize: true, // usar migrations em produção
        ssl: { rejectUnauthorized: false },
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    WhatsAppModule,
    SlotsModule,
    AgendamentosModule,
    OtpModule,
    GoogleCalendarModule,
  ],
})
export class AppModule {}
