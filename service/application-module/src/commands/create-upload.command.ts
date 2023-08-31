export class CreateUploadCommand {
  constructor(
    public readonly uploadId: string,
    public readonly initiatorId: string,
    public readonly bucket: string,
    public readonly name: string,
    public readonly size: number
  ) {}
}
