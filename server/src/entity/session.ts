export type Session = {
  sid: string;
  session: string;
};

export const sessionColumns = <const>['sid', 'session'];
