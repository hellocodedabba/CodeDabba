import { Test, TestingModule } from '@nestjs/testing';
import { MentorApplicationsController } from './mentor-applications.controller';

describe('MentorApplicationsController', () => {
  let controller: MentorApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MentorApplicationsController],
    }).compile();

    controller = module.get<MentorApplicationsController>(MentorApplicationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
