declare module 'mongoose' {
  export interface Document {
    _id: any;
    [key: string]: any;
  }
  
  export class Schema {
    constructor(definition: any, options?: any);
    pre(method: string, fn: Function): void;
    methods: Record<string, any>;
    index(fields: Record<string, string>): void;
    static Types: {
      ObjectId: any;
    };
  }
  
  export namespace Types {
    class ObjectId {
      constructor(id?: string | number | ObjectId);
      toString(): string;
    }
  }
  
  export function model(name: string, schema: Schema): any;
  export function connect(uri: string): Promise<typeof mongoose>;
  
  const mongoose: {
    Types: {
      ObjectId: typeof Types.ObjectId;
    };
    Schema: typeof Schema;
    model: typeof model;
    connect: typeof connect;
  };
  export default mongoose;
}

declare module 'dotenv' {
  export function config(): void;
}

declare module 'helmet' {
  import { RequestHandler } from 'express';
  function helmet(): RequestHandler;
  export default helmet;
}
