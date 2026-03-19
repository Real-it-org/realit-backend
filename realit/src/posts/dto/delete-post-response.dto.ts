import { ApiProperty } from '@nestjs/swagger';

export class DeletePostResponseDto {
    @ApiProperty({ example: 'Post and all associated media deleted' })
    message: string;
}
