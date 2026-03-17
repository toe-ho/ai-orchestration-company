import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/** Threaded comment on a board approval */
@Entity('approval_comments')
export class ApprovalCommentModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  approvalId!: string;

  @Column({ type: 'text' })
  authorId!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
