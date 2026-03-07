import { SetMetadata } from '@nestjs/common';
import { MODULE_KEY } from '../guards/module-access.guard';

export const ModuleAccess = (moduleName: string) => SetMetadata(MODULE_KEY, moduleName);


