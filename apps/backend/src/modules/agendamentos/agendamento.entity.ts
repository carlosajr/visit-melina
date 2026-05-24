import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type TipoVisita = 'amigo' | 'familia';

// Índices únicos parciais: apenas entre agendamentos não-cancelados
@Index('IDX_ag_data_ativo', ['data'], { where: '"cancelado_em" IS NULL', unique: true })
@Index('IDX_ag_whatsapp_digits_ativo', ['whatsappDigits'], { where: '"cancelado_em" IS NULL', unique: true })
@Entity('agendamentos')
export class Agendamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10 })
  tipo: TipoVisita;

  @Column({ length: 10 })
  data: string; // YYYY-MM-DD

  @Column({ length: 5 })
  horario: string; // HH:MM

  @Column()
  nome: string;

  @Column()
  whatsapp: string; // formatado (11) 99999-9999

  @Column({ name: 'whatsapp_digits' })
  whatsappDigits: string; // apenas dígitos

  @Column({ name: 'wa_id', nullable: true })
  waId: string; // número resolvido pelo gateway

  @Column({ nullable: true })
  email: string;

  @Column('text', { array: true, default: [] })
  acompanhantes: string[];

  @Column({ name: 'message_sent', default: false })
  messageSent: boolean;

  @Column({ name: 'invite_sent', default: false })
  inviteSent: boolean;

  @Column({ name: 'google_event_id', nullable: true })
  googleEventId: string;

  @Column({ name: 'cancelado_em', nullable: true })
  canceladoEm: Date;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
