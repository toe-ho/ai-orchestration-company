import { ConflictException } from '@nestjs/common';

/** Thrown when an agent tries to checkout an issue already held by another run */
export class IssueAlreadyCheckedOutException extends ConflictException {
  constructor(issueId: string) {
    super(`Issue ${issueId} is already checked out`);
  }
}
