export class UploadPreparedEvent {
  constructor(
    public readonly uploadId: string,
    public readonly url: string
  ) {}
}
