export const createNotificationPlatform = <
  Credentials extends ReadonlyArray<string> = [],
  PlatformName extends string = never,
  CredentialName extends string = never
>(
  args: {
    name: PlatformName;
    sendFunction: (args: {
      title: string;
      message: string;
      messageMarkdown?: string;
      imagePath?: string;
      credentials: Credentials extends readonly []
        ? Record<CredentialName, string>
        : Record<Credentials[number], string>;
    }) => Promise<void>;
  } & (
    | {
        credentialNames?: Credentials;
      }
    | { credentialName?: CredentialName }
  )
) => {
  return {
    name: args.name,
    credentialNames:
      'credentialNames' in args ? args.credentialNames : undefined,
    credentialName: 'credentialName' in args ? args.credentialName : undefined,
    sendFunction: args.sendFunction,
  };
};
