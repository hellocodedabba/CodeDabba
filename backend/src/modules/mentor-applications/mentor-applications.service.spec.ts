import { Test, TestingModule } from '@nestjs/testing';
import { MentorApplicationsService } from './mentor-applications.service';

describe('MentorApplicationsService', () => {
  let service: MentorApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MentorApplicationsService],
    }).compile();

    service = module.get<MentorApplicationsService>(MentorApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
