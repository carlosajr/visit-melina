import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  data: string; // YYYY-MM-DD

  @Column({ length: 5 })
  horario: string; // HH:MM

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
