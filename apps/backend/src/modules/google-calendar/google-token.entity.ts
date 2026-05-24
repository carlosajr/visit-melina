import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('google_tokens')
export class GoogleToken {
  @PrimaryColumn({ default: 'admin' })
  id: string; // singleton — sempre 'admin'

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text' })
  refreshToken: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ nullable: true })
  email: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
