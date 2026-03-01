import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FeedQueryDto {
    @ApiPropertyOptional({
        description: 'Cursor: ID of the last post from the previous page',
        example: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({
        description: 'Number of posts to return (default: 10, max: 50)',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;
}
