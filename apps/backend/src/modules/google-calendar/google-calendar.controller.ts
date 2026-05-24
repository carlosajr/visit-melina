import { Controller, Get, Query, Redirect, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { GoogleCalendarService } from './google-calendar.service';

@ApiTags('google')
@Controller('google')
export class GoogleCalendarController {
  constructor(private service: GoogleCalendarService) {}

  @Get('auth-url')
  @UseGuards(AdminJwtGuard)
  getAuthUrl() {
    return { url: this.service.getAuthUrl() };
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('code') code: string) {
    await this.service.handleCallback(code);
    // Redireciona de volta ao painel admin após autenticação
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return { url: `${frontendUrl}?google_auth=success` };
  }

  @Get('status')
  @UseGuards(AdminJwtGuard)
  status() {
    return this.service.getStatus();
  }
}
