import { LoggerService } from '../logger/logger.service';
import { Logger } from '../common/logger/interfaces/logger.interface';

export class CreateHandler {
  constructor(private logger: Logger = LoggerService.getLogger()) {}

  public handle() {}
}
