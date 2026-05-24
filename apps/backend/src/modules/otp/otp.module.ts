import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendamentosModule } from '../agendamentos/agendamentos.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { OtpCode } from './otp.entity';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OtpCode]),
    WhatsAppModule,
    forwardRef(() => AgendamentosModule),
  ],
  providers: [OtpService],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
