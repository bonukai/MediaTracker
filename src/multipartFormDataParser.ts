abstract class IReader<T extends { length: number }, U = T> {
  protected data: T;
  protected pos: number;

  constructor(data: T) {
    this.data = data;
    this.pos = 0;
  }

  abstract peek(k: number): U;

  public isEOF(): boolean {
    return !(this.pos < this.data.length);
  }

  public consume(k: number): U {
    const res = this.peek(k);
    this.pos += k;
    return res;
  }
}

class InputReader extends IReader<string> {
  public peek(k: number): string {
    return this.data.substring(this.pos, this.pos + k);
  }
}

class TokenReader extends IReader<Token[], (Token | undefined)[]> {
  public peek(k: number): (Token | undefined)[] {
    return this.data.slice(this.pos, this.pos + k);
  }
}

type StringToken = {
  type: 'string';
  value: string;
};

type WhiteSpaceToken = {
  type: 'white-space';
  value: string;
};

type NewLineToken = {
  type: 'new-line';
  value: string;
};

type AssignmentToken = {
  type: 'assignment';
};

type SeparatorToken = {
  type: 'separator';
};

type EndOfInputToken = {
  type: 'end-of-input';
};

type DataDefinitionStartToken = {
  type: 'data-definition-start';
};

type PayloadData = {
  type: 'payload-data';
  value: string;
};

type Token =
  | StringToken
  | DataDefinitionStartToken
  | WhiteSpaceToken
  | AssignmentToken
  | SeparatorToken
  | NewLineToken
  | PayloadData
  | EndOfInputToken;

type TokenType = Token['type'];

const consumeQuotedString = (inputReader: InputReader) => {
  if (inputReader.peek(1) !== '"') {
    throw new Error(`quoted string should start with a double quote`);
  }

  inputReader.consume(1);

  let res: string = '';

  while (!inputReader.isEOF()) {
    if (inputReader.peek(1) === '"') {
      if (inputReader.peek(2) === '""') {
        res += inputReader.consume(2);
      } else {
        inputReader.consume(1);
        return res;
      }
    } else {
      res += inputReader.consume(1);
    }
  }

  throw new Error(`missing end double quote`);
};

const consumeBoundaryData = (args: {
  inputReader: InputReader;
  boundary: string;
}) => {
  const { inputReader, boundary } = args;

  const peekAndConsumeOnMatch = (text: string): boolean => {
    if (inputReader.peek(text.length) === text) {
      inputReader.consume(text.length);
      return true;
    }

    return false;
  };

  let data = '';

  while (!inputReader.isEOF()) {
    if (peekAndConsumeOnMatch(`\r\n${boundary}--\r\n`)) {
      return data;
    } else if (peekAndConsumeOnMatch(`\r\n${boundary}`)) {
      return data;
    } else {
      data += inputReader.consume(1);
    }
  }

  throw new Error(`missing closing boundary`);
};

const tokenize = (args: { data: string; boundary?: string }): Token[] => {
  const { data, boundary } = args;

  const inputReader = new InputReader(data);

  const tokens: Token[] = [];

  const pushToken = (token: Token) => {
    const previousToken = tokens.at(-1);

    if (
      expectTokenToBe(token, 'string') &&
      expectTokenToBe(previousToken, 'string')
    ) {
      previousToken.value += token.value;
      return;
    } else if (
      expectTokenToBe(token, 'white-space') &&
      expectTokenToBe(previousToken, 'white-space')
    ) {
      previousToken.value += token.value;
      return;
    } else if (
      expectTokenToBe(token, 'data-definition-start') &&
      expectTokenToBe(previousToken, 'string')
    ) {
      if (
        previousToken.value.match(
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        )
      ) {
        previousToken.value += ':';
        return;
      }
    }

    tokens.push(token);
  };

  const consumeSingleCharToken = (token: Token) => {
    pushToken(token);
    inputReader.consume(1);
  };

  while (!inputReader.isEOF()) {
    const nextChar = inputReader.peek(1);

    switch (nextChar) {
      case ':':
        consumeSingleCharToken({ type: 'data-definition-start' });
        break;

      case ';':
        consumeSingleCharToken({ type: 'separator' });
        break;

      case '=':
        consumeSingleCharToken({ type: 'assignment' });
        break;

      // @ts-expect-error
      case '\r':
        if (boundary && inputReader.peek(4) === '\r\n\r\n') {
          pushToken({ type: 'new-line', value: '\r\n' });
          inputReader.consume(4);
          pushToken({
            type: 'payload-data',
            value: consumeBoundaryData({
              inputReader,
              boundary,
            }),
          });

          break;
        } else if (inputReader.peek(2) === '\r\n') {
          pushToken({ type: 'new-line', value: '\r\n' });
          inputReader.consume(2);
          break;
        }

      case '\t':
      case ' ':
        pushToken({
          type: 'white-space',
          value: inputReader.consume(1),
        });
        break;

      case '"':
        pushToken({
          type: 'string',
          value: consumeQuotedString(inputReader),
        });
        break;

      // @ts-expect-error
      case '-':
        if (inputReader.peek(4) === '--\r\n') {
          pushToken({ type: 'end-of-input' });
          inputReader.consume(4);
          break;
        }

      default:
        pushToken({ type: 'string', value: nextChar });
        inputReader.consume(1);
        break;
    }
  }

  return tokens;
};

const expectTokenToBe = <T extends TokenType>(
  token: Token | undefined,
  expectedType: T,
  value?: T extends 'string' ? string : never
): token is Token & { type: T } => {
  if (typeof value === 'string') {
    return token?.type === 'string' && token.value === value;
  }

  return token?.type === expectedType;
};

type Header = { name: string; value: string; values: Map<string, string> };
type Headers = Map<string, Header>;
type FormDataPart = {
  headers: Headers;
  data: string;
  name?: string;
};

const consumeHeader = (tokenReader: TokenReader): Map<string, string> => {
  const res = new Map<string, string>();

  while (!tokenReader.isEOF()) {
    const [token1, token2, token3, token4, token5] = tokenReader.peek(5);

    if (expectTokenToBe(token1, 'new-line')) {
      return res;
    }

    if (
      expectTokenToBe(token1, 'separator') &&
      expectTokenToBe(token2, 'white-space') &&
      expectTokenToBe(token3, 'string') &&
      expectTokenToBe(token4, 'assignment') &&
      expectTokenToBe(token5, 'string')
    ) {
      res.set(token3.value, token5.value);
      tokenReader.consume(5);
    } else {
      tokenReader.consume(1);
    }
  }

  throw new Error(`unexpected end of the header`);
};

const parseMultipartFormDataFromTokens = (args: {
  boundary: string;
  tokens: Token[];
}): FormDataPart[] => {
  const { boundary, tokens } = args;
  const tokenReader = new TokenReader(tokens);

  const payloads: FormDataPart[] = [];

  const consumePayload = (tokenReader: TokenReader): string => {
    const [token1, token2] = tokenReader.peek(2);
    if (
      !(
        expectTokenToBe(token1, 'new-line') &&
        expectTokenToBe(token2, 'new-line')
      )
    ) {
      throw new Error(`payload should start with double CRLF`);
    }

    tokenReader.consume(2);

    let data = '';

    while (!tokenReader.isEOF()) {
      const [token1, token2, token3] = tokenReader.peek(3);

      if (
        expectTokenToBe(token1, 'new-line') &&
        (expectTokenToBe(token2, 'string', boundary) ||
          expectTokenToBe(token2, 'string', `${boundary}--`))
      ) {
        if (expectTokenToBe(token3, 'end-of-input')) {
          tokenReader.consume(3);
          return data;
        } else {
          tokenReader.consume(2);
          return data;
        }
      } else {
        if (token1 && 'value' in token1) {
          data += token1.value;
        }
        tokenReader.consume(1);
      }
    }

    throw new Error(`unexpected end of data`);
  };

  const [firstToken] = tokenReader.consume(1);

  if (!expectTokenToBe(firstToken, 'string', boundary)) {
    throw new Error(`data should begin with boundary ${boundary}`);
  }

  const headers: Headers = new Map();

  while (!tokenReader.isEOF()) {
    const [token1, token2, token3, token4, token5] = tokenReader.peek(5);

    if (
      expectTokenToBe(token1, 'new-line') &&
      expectTokenToBe(token2, 'string') &&
      expectTokenToBe(token3, 'data-definition-start') &&
      expectTokenToBe(token4, 'white-space') &&
      expectTokenToBe(token5, 'string')
    ) {
      tokenReader.consume(5);

      headers.set(token2.value.toLowerCase(), {
        name: token2.value,
        value: token5.value,
        values: consumeHeader(tokenReader),
      });
    } else if (
      expectTokenToBe(token1, 'new-line') &&
      expectTokenToBe(token2, 'payload-data')
    ) {
      tokenReader.consume(2);

      const name = headers.get('content-disposition')?.values?.get('name');

      if (headers.get('content-type')?.value === 'application/json') {
        payloads.push({
          data: JSON.parse(token2.value),
          headers: new Map(headers),
          name,
        });
      } else {
        payloads.push({
          data: token2.value,
          headers: new Map(headers),
          name,
        });
      }

      headers.clear();
    } else {
      console.error('unconsumed token', token1);
      tokenReader.consume(1);
    }
  }

  return payloads;
};

export const parseMultipartFormData = (args: {
  boundary: string;
  body: string;
}): Record<string, string> => {
  const { body, boundary } = args;
  const res = parseMultipartFormDataFromTokens({
    boundary: `--${boundary}`,
    tokens: tokenize({ data: body, boundary: `--${boundary}` }),
  });

  return res.reduce(
    (res, current) =>
      current.name
        ? {
            ...res,
            [current.name]: current.data,
          }
        : res,
    {}
  );
};

export const parseContentTypeHeader = (
  headerData: string
): { contentType: string; data: Record<string, string> } => {
  const tokens = tokenize({ data: `${headerData.trim()}\r\n` });

  const tokenReader = new TokenReader(tokens);

  const [token] = tokenReader.consume(1);

  if (!expectTokenToBe(token, 'string')) {
    throw new Error(`header should begin with a string "multipart/form-data"`);
  }

  const headerValues = consumeHeader(tokenReader);

  return {
    contentType: token.value,
    data: Object.fromEntries(headerValues.entries()),
  };
};
