export class ConfirmUploadCommand {
  constructor(
    public readonly uploadId: string,
    public readonly ownerId: string
  ) {}
}
