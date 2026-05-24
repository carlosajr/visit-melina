import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Visitor } from '../../common/decorators/visitor.decorator';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { VisitorJwtGuard } from '../../common/guards/visitor-jwt.guard';
import type { VisitorPayload } from '../../common/guards/visitor-jwt.guard';
import { CreateAgendamentoDto, UpdateAgendamentoDto } from './agendamentos.dto';
import { AgendamentosService } from './agendamentos.service';

@ApiTags('agendamentos')
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private service: AgendamentosService) {}

  // Público — verifica duplicidade de whatsapp em tempo real
  @Get('check-whatsapp')
  checkWhatsapp(@Query('whatsapp') whatsapp: string) {
    return this.service.checkWhatsapp(whatsapp);
  }

  // Público — retorna datas que já têm agendamento (para bloquear no calendário)
  @Get('datas-ocupadas')
  async datasOcupadas() {
    const lista = await this.service.findAll();
    return lista.map((a) => a.data);
  }

  // Público — cria agendamento
  @Post()
  create(@Body() dto: CreateAgendamentoDto) {
    return this.service.create(dto);
  }

  // Visitante autenticado — ver seu agendamento
  @Get('meu')
  @UseGuards(VisitorJwtGuard)
  meu(@Visitor() v: VisitorPayload) {
    return this.service.buscarPorWhatsappDigits(v.sub);
  }

  // Visitante autenticado — alterar data
  @Patch(':id')
  @UseGuards(VisitorJwtGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendamentoDto,
    @Visitor() v: VisitorPayload,
  ) {
    return this.service.update(id, dto, v.sub);
  }

  // Visitante autenticado — cancelar
  @Delete(':id')
  @UseGuards(VisitorJwtGuard)
  cancel(@Param('id') id: string, @Visitor() v: VisitorPayload) {
    return this.service.cancel(id, v.sub);
  }

  // Admin — listar todos
  @Get('admin')
  @UseGuards(AdminJwtGuard)
  findAll() {
    return this.service.findAll();
  }

  // Admin — cancelar qualquer agendamento
  @Delete('admin/:id')
  @UseGuards(AdminJwtGuard)
  cancelAdmin(@Param('id') id: string) {
    return this.service.cancelByAdmin(id);
  }
}
