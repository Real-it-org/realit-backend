import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class MarkReadDto {
    @ApiProperty({ type: [String], description: 'Array of notification IDs to mark as read' })
    @IsArray()
    @IsUUID('4', { each: true })
    ids: string[];
}
