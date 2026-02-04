import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPostMediaDto {
    @ApiProperty({ description: 'ID of the post to confirm media for' })
    @IsString()
    @IsNotEmpty()
    post_id: string;

    @ApiProperty({ description: 'List of asset IDs that were successfully uploaded' })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    uploaded_asset_ids: string[];
}
