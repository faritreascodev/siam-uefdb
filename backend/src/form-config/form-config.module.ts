import { Module, Global } from '@nestjs/common';
import { FormConfigService } from './form-config.service';
import { FormConfigController } from './form-config.controller';

@Global()
@Module({
    providers: [FormConfigService],
    controllers: [FormConfigController],
    exports: [FormConfigService],
})
export class FormConfigModule { }


