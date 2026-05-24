import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot } from './slot.entity';
import { CreateSlotDto, UpdateSlotDto } from './slots.dto';

function tipoDoDia(iso: string): 'amigo' | 'familia' {
  const d = new Date(`${iso}T12:00:00`);
  const dow = d.getDay(); // 6=sábado, 0=domingo
  if (dow === 6) return 'amigo';
  if (dow === 0) return 'familia';
  throw new BadRequestException('A data deve ser um sábado (amigo) ou domingo (família)');
}

@Injectable()
export class SlotsService {
  constructor(@InjectRepository(Slot) private repo: Repository<Slot>) {}

  findAll(): Promise<Slot[]> {
    return this.repo.find({ order: { data: 'ASC' } });
  }

  async create(dto: CreateSlotDto): Promise<Slot> {
    tipoDoDia(dto.data); // valida dia da semana
    const exists = await this.repo.findOneBy({ data: dto.data });
    if (exists) throw new BadRequestException('Já existe um slot para esta data');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateSlotDto): Promise<Slot> {
    const slot = await this.repo.findOneBy({ id });
    if (!slot) throw new NotFoundException('Slot não encontrado');

    if (dto.data && dto.data !== slot.data) {
      tipoDoDia(dto.data); // valida dia da semana
      const existe = await this.repo.findOneBy({ data: dto.data });
      if (existe) throw new BadRequestException('Já existe um slot para esta data');
      slot.data = dto.data;
    }

    if (dto.horario) slot.horario = dto.horario;
    return this.repo.save(slot);
  }

  async remove(id: string): Promise<void> {
    const slot = await this.repo.findOneBy({ id });
    if (!slot) throw new NotFoundException('Slot não encontrado');
    await this.repo.remove(slot);
  }

  // Derivar tipo a partir da data (usado por outros serviços)
  tipoDoDia = tipoDoDia;
}
