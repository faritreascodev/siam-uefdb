import { Module } from '@nestjs/common';
import { CursilloController } from './cursillo.controller';
import { CursilloService } from './cursillo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CursilloController],
    providers: [CursilloService],
    exports: [CursilloService],
})
export class CursilloModule { }


