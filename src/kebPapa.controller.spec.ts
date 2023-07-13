import { Test, TestingModule } from '@nestjs/testing';
import { KebPapaController } from './kebPapa.controller';

describe('KebPapaController', () => {
  let controller: KebPapaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KebPapaController],
    }).compile();

    controller = module.get<KebPapaController>(KebPapaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
