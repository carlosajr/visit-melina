import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  whatsapp: string; // dígitos normalizados

  @Column({ name: 'code_hash' })
  codeHash: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ nullable: true })
  ip: string;

  @Column({ name: 'used_at', nullable: true })
  usedAt: Date;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
