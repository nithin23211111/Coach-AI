declare namespace Deno {
  function serve(handler: (req: Request) => Promise<Response> | Response): void
  const env: {
    get(key: string): string | undefined
  }
}
