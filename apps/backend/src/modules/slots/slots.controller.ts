import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CreateSlotDto, UpdateSlotDto } from './slots.dto';
import { SlotsService } from './slots.service';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private service: SlotsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AdminJwtGuard)
  create(@Body() dto: CreateSlotDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(AdminJwtGuard)
  update(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
