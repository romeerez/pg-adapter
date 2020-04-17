import { AdapterBase } from './adapterBase';
import { Prepared } from '../types';
export declare const prepare: (adapter: AdapterBase, name: string, ...args: any[]) => (prepareTemplate: TemplateStringsArray, prepareArgs?: any[] | undefined) => Prepared;
