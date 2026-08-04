import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CONTRACT_REPOSITORY } from './contract-repository.token';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { InMemoryContractRepository } from './in-memory-contract.repository';

@Module({
  imports: [AuthModule],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    // ÜBERGANGSLÖSUNG: In-Memory-Repository, siehe in-memory-contract.repository.ts.
    { provide: CONTRACT_REPOSITORY, useClass: InMemoryContractRepository },
  ],
})
export class ContractsModule {}
